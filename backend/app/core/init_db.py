import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base, engine, async_session_factory
from app.core.security import get_password_hash
from app.models.user import Role, User
from app.models.competency import Competency
from app.ai_engine.competency_gap import DEFAULT_COMPETENCIES

logger = logging.getLogger("capacity_connect.init_db")

DEFAULT_ADMIN_EMAIL = "admin.imd@moes.gov.in"
DEFAULT_ADMIN_PASSWORD = "Admin@CapacityConnect2026"


async def init_db() -> None:
    """
    Initializes tables and seeds canonical system roles and initial administrator.
    """
    logger.info("Verifying database tables and seeding canonical roles...")
    
    # Create all tables if they do not already exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # SQLite local nodes may already contain the Phase 9 queue. Additive
        # fields keep those durable events readable after a Phase 10 upgrade.
        if engine.dialect.name == "sqlite":
            from sqlalchemy import text
            columns = (await conn.execute(text("PRAGMA table_info(sync_queue)"))).fetchall()
            existing = {column[1] for column in columns}
            for name, definition in (
                ("client_signature", "TEXT NOT NULL DEFAULT ''"),
                ("next_attempt_at", "DATETIME"),
                ("last_error", "TEXT"),
                ("processing_started_at", "DATETIME"),
            ):
                if name not in existing:
                    await conn.execute(text(f"ALTER TABLE sync_queue ADD COLUMN {name} {definition}"))
            competency_columns = (await conn.execute(text("PRAGMA table_info(competencies)"))).fetchall()
            if "criticality_weight" not in {column[1] for column in competency_columns}:
                await conn.execute(text("ALTER TABLE competencies ADD COLUMN criticality_weight FLOAT NOT NULL DEFAULT 1.0"))
            profile_columns = (await conn.execute(text("PRAGMA table_info(trainer_profiles)"))).fetchall()
            if "is_available_for_assignment" not in {column[1] for column in profile_columns}:
                await conn.execute(text("ALTER TABLE trainer_profiles ADD COLUMN is_available_for_assignment BOOLEAN NOT NULL DEFAULT 0"))

    async with async_session_factory() as session:
        # 1. Seed Roles
        roles_data = [
            (1, "trainee", "Trainee learner role"),
            (2, "trainer", "Trainer and domain instructor role"),
            (3, "admin", "System administrator role"),
        ]

        for role_id, role_name, role_desc in roles_data:
            result = await session.execute(select(Role).where(Role.name == role_name))
            existing_role = result.scalar_one_or_none()
            if not existing_role:
                new_role = Role(id=role_id, name=role_name, description=role_desc)
                session.add(new_role)
                logger.info(f"Seeded canonical role: {role_name}")

        await session.commit()

        # 2. Seed the canonical competency taxonomy.  These records are part of
        # the application baseline, rather than endpoint-triggered demo data.
        for competency_data in DEFAULT_COMPETENCIES:
            result = await session.execute(
                select(Competency).where(Competency.id == competency_data["id"])
            )
            if not result.scalar_one_or_none():
                session.add(Competency(**competency_data))
                logger.info("Seeded canonical competency: %s", competency_data["name"])

        await session.commit()

        # 3. Seed Initial Administrator if none exists
        result = await session.execute(select(Role).where(Role.name == "admin"))
        admin_role = result.scalar_one_or_none()

        if admin_role:
            user_result = await session.execute(
                select(User).where(User.email == DEFAULT_ADMIN_EMAIL)
            )
            existing_admin = user_result.scalar_one_or_none()
            if not existing_admin:
                admin_user = User(
                    email=DEFAULT_ADMIN_EMAIL,
                    password_hash=get_password_hash(DEFAULT_ADMIN_PASSWORD),
                    full_name="IMD Portal Administrator",
                    phone_number="+911124611000",
                    station_code="IMD-HQ-DELHI",
                    organization="India Meteorological Department (IMD)",
                    role_id=admin_role.id,
                    status="approved"
                )
                session.add(admin_user)
                await session.commit()
                logger.info(f"Seeded default administrator: {DEFAULT_ADMIN_EMAIL}")
            else:
                logger.info("Administrator account already exists.")
