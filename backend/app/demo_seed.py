"""Central bootstrap seed for demo deployments.

Run against the configured central PostgreSQL database:

    python -m app.demo_seed

It is idempotent: users are matched by email, courses by code, and
competencies by canonical id. Default credentials for every seeded account
are the documented demo password ``Password123!``. Rotate before field use.
"""

import asyncio
import json
import logging

from sqlalchemy import select

from app.ai_engine.competency_gap import DEFAULT_COMPETENCIES
from app.core.database import Base, engine, async_session_factory
from app.core.init_db import init_db
from app.core.security import get_password_hash
from app.models.admin import Announcement
from app.models.competency import Competency, CourseCompetency, TraineeCompetency
from app.models.offline import SyncState
from app.models.trainer import Assessment, Course, CourseModule, Lesson, Question
from app.models.user import Role, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("capacity_connect.demo_seed")

DEMO_PASSWORD = "Password123!"

DEMO_TRAINERS = [
    {"email": "trainer.radar@imd.gov.in", "full_name": "Dr. Meera Padmanabhan", "station_code": "IMD-CHN"},
    {"email": "trainer.forecast@imd.gov.in", "full_name": "Dr. Arun Kulkarni", "station_code": "IMD-MUM"},
]

DEMO_TRAINEES = [
    {"email": "trainee.anil@imd.gov.in", "full_name": "Anil Varma", "station_code": "IMD-HYD"},
    {"email": "trainee.priya@imd.gov.in", "full_name": "Priya Nair", "station_code": "IMD-BLR"},
]

DEMO_COURSES = [
    {
        "code": "RADAR-101", "title": "Doppler Weather Radar Fundamentals",
        "category": "Radar", "level": "beginner", "estimated_hours": 8,
        "description": "Principles of Doppler weather radar, from sampling to velocity interpretation.",
        "module_title": "Start Here",
        "lessons": [
            ("Radar Principles and the Doppler Dilemma", "Range folding, velocity ambiguity and PRF trades.", 45),
            ("Velocity Interpretation", "Zones of dealiasing and mesocyclone signatures.", 60),
        ],
        "assessment": {
            "title": "Radar 101 Assessment", "subject": "Radar", "duration_minutes": 30,
            "passing_score": 50.0, "total_marks": 100.0, "competency": "comp-radar-doppler",
            "questions": [
                {"text": "Which trade-off is described by the Doppler dilemma?", "correct": "A", "marks": 50.0,
                 "options": [{"id": "A", "text": "Maximum unambiguous range vs velocity"},
                             {"id": "B", "text": "Sensitivity vs resolution"},
                             {"id": "C", "text": "Azimuth vs elevation"},
                             {"id": "D", "text": "Polarization vs frequency"}]},
                {"text": "A mesocyclone signature is most directly identified in which field?", "correct": "B", "marks": 50.0,
                 "options": [{"id": "A", "text": "Reflectivity only"},
                             {"id": "B", "text": "Azimuthal shear of radial velocity"},
                             {"id": "C", "text": "Differential phase"},
                             {"id": "D", "text": "Bright band height"}]},
            ],
        },
    },
    {
        "code": "NWP-201", "title": "Numerical Weather Prediction for Operations",
        "category": "Forecasting", "level": "intermediate", "estimated_hours": 12,
        "description": "Operational NWP products, verification and model blend guidance.",
        "module_title": "Forecasting Workbench",
        "lessons": [
            ("Model Output Statistics Primer", "Post-processing and bias correction.", 50),
            ("Verification Metrics", "Equitable threat score and reliability.", 40),
        ],
        "assessment": {
            "title": "NWP 201 Assessment", "subject": "Forecasting", "duration_minutes": 45,
            "passing_score": 60.0, "total_marks": 100.0, "competency": "comp-nwp-postproc",
            "questions": [
                {"text": "Which metric rewards correct rare-event forecasts proportionally?", "correct": "C", "marks": 100.0,
                 "options": [{"id": "A", "text": "Bias"},
                             {"id": "B", "text": "Mean absolute error"},
                             {"id": "C", "text": "Equitable threat score"},
                             {"id": "D", "text": "Rank correlation"}]},
            ],
        },
    },
]

DEMO_ANNOUNCEMENTS = [
    {"title": "Monsoon Desk Roster Published", "content": "The June-September monsoon desk duty roster is now available on the bulletin."},
    {"title": "Radar Maintenance Window", "content": "Planned maintenance on the Chennai Doppler radar will occur Sunday 22:00-23:30 IST."},
]


async def _ensure_users(session, role_name: str, fixtures: list[dict]) -> list[User]:
    role = await session.scalar(select(Role).where(Role.name == role_name))
    if not role:
        return []
    created = []
    for fixture in fixtures:
        user = await session.scalar(select(User).where(User.email == fixture["email"]))
        if user:
            created.append(user)
            continue
        user = User(
            email=fixture["email"], password_hash=get_password_hash(DEMO_PASSWORD),
            full_name=fixture["full_name"], station_code=fixture["station_code"],
            role_id=role.id, status="approved",
        )
        session.add(user)
        created.append(user)
        await session.flush()
    return created


async def _ensure_courses(session, trainers: list[User]) -> None:
    for index, course_fixture in enumerate(DEMO_COURSES):
        course = await session.scalar(select(Course).where(Course.code == course_fixture["code"]))
        if course:
            continue
        trainer = trainers[index % len(trainers)]
        course = Course(
            trainer_id=trainer.id, code=course_fixture["code"], title=course_fixture["title"],
            description=course_fixture["description"], category=course_fixture["category"],
            level=course_fixture["level"], estimated_hours=course_fixture["estimated_hours"],
            is_published=True,
        )
        session.add(course)
        await session.flush()

        module = CourseModule(course_id=course.id, title=course_fixture["module_title"], order_index=1)
        session.add(module)
        await session.flush()
        for order, lesson_data in enumerate(course_fixture["lessons"], start=1):
            session.add(Lesson(module_id=module.id, title=lesson_data[0], content_text=lesson_data[1],
                               order_index=order, duration_minutes=lesson_data[2]))

        assessment_data = course_fixture["assessment"]
        competency = await session.scalar(select(Competency).where(Competency.id == assessment_data["competency"]))
        if competency:
            session.add(CourseCompetency(course_id=course.id, competency_id=competency.id, yield_level=0.60))
        assessment = Assessment(
            course_id=course.id, competency_id=competency.id if competency else None, created_by=trainer.id,
            title=assessment_data["title"], subject=assessment_data["subject"],
            duration_minutes=assessment_data["duration_minutes"], passing_score=assessment_data["passing_score"],
            total_marks=assessment_data["total_marks"], is_published=True,
        )
        session.add(assessment)
        await session.flush()
        for order, question in enumerate(assessment_data["questions"], start=1):
            session.add(Question(
                assessment_id=assessment.id, question_text=question["text"], question_type="mcq",
                options_json=json.dumps(question["options"]), correct_option=question["correct"],
                marks=question["marks"], order_index=order,
            ))

    # Some demo competency evidence so radar charts render instantly for one trainee.
    trainees = list((await session.execute(select(User).where(User.email == DEMO_TRAINEES[0]["email"]))).scalars())
    if trainees:
        trainee = trainees[0]
        for competency in (await session.execute(select(Competency))).scalars().all():
            existing = await session.scalar(select(TraineeCompetency).where(
                TraineeCompetency.user_id == trainee.id, TraineeCompetency.competency_id == competency.id))
            if not existing:
                session.add(TraineeCompetency(user_id=trainee.id, competency_id=competency.id,
                                              proficiency_level=0.35))


async def _ensure_announcements(session) -> None:
    admin = await session.scalar(select(User).where(User.email == "admin.imd@moes.gov.in"))
    if not admin:
        return
    for fixture in DEMO_ANNOUNCEMENTS:
        exists = await session.scalar(select(Announcement).where(Announcement.title == fixture["title"]))
        if not exists:
            session.add(Announcement(published_by=admin.id, title=fixture["title"], content=fixture["content"],
                                     is_featured_on_homepage=True, is_active=True))
    await session.flush()


async def main() -> None:
    await init_db()
    async with async_session_factory() as session:
        trainers = await _ensure_users(session, "trainer", DEMO_TRAINERS)
        if not trainers:
            raise RuntimeError("The 'trainer' role was not seeded; cannot continue.")
        await _ensure_users(session, "trainee", DEMO_TRAINEES)
        await _ensure_courses(session, trainers)
        await _ensure_announcements(session)
        state = await session.get(SyncState, "IMD-HQ-DELHI")
        if not state:
            session.add(SyncState(id="IMD-HQ-DELHI"))
        await session.commit()
    logger.info("Demo seed complete. Login with any DEMO account using password '%s'.", DEMO_PASSWORD)


if __name__ == "__main__":
    asyncio.run(main())