from fastapi import APIRouter

from app.api.endpoints import health, auth, admin, trainee, trainer, courses, assessments, announcements, competency, offline, sync

api_router = APIRouter()

# Register core health router
api_router.include_router(health.router, tags=["Health"])

# Phase 2: Authentication & RBAC Router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Phase 7: Admin Module Router
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Phase 3: Trainee Module Router
api_router.include_router(trainee.router, prefix="/trainee", tags=["Trainee"])

# Phase 4: Trainer Module Router
api_router.include_router(trainer.router, prefix="/trainer", tags=["Trainer"])

# Phase 5: Learning Management Router
api_router.include_router(courses.router, prefix="/courses", tags=["Courses & LMS"])

# Phase 6: Assessment System Router
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])

# Phase 7: Announcements, Notifications & Achievements Public/User Router
api_router.include_router(announcements.router, tags=["Announcements & Notifications"])

# Phase 8: Competency & Intelligent Matching Router
api_router.include_router(competency.router, tags=["Competency & Matching"])

# Phase 9: local-node persistence, content-store and pack foundation
api_router.include_router(offline.router)
api_router.include_router(sync.router)
