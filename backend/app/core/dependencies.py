from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

# Re-export get_db for convenient dependency injection
__all__ = ["get_db"]
