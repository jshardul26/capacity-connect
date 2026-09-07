from fastapi import APIRouter

from app.api.endpoints import health

api_router = APIRouter()

# Register core health router
api_router.include_router(health.router, tags=["Health"])

# Future Phase routers will be registered here according to API_CONTRACT.md:
# - auth.router
# - trainee.router
# - trainer.router
# - courses.router
# - assessments.router
# - competency.router
# - admin.router
# - sync.router
# - packs.router
