from fastapi import APIRouter

from app.api.endpoints import health, auth, admin

api_router = APIRouter()

# Register core health router
api_router.include_router(health.router, tags=["Health"])

# Phase 2: Authentication & RBAC Router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Phase 2: Admin Approval Workflow Foundation Router
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
# - sync.router
# - packs.router
