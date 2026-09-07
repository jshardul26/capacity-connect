from fastapi import APIRouter

from app.api.endpoints import health, auth, admin, trainee, trainer

api_router = APIRouter()

# Register core health router
api_router.include_router(health.router, tags=["Health"])

# Phase 2: Authentication & RBAC Router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Phase 2: Admin Approval Workflow Foundation Router
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Phase 3: Trainee Module Router
api_router.include_router(trainee.router, prefix="/trainee", tags=["Trainee"])

# Phase 4: Trainer Module Router
api_router.include_router(trainer.router, prefix="/trainer", tags=["Trainer"])

