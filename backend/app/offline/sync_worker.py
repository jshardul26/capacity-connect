"""Systemd entry point; a station credential is supplied through the protected environment."""
import asyncio
import os
from app.core.database import async_session_factory
from app.offline.sync_service import flush_queue

async def main() -> None:
    async with async_session_factory() as db:
        await flush_queue(db, os.environ.get("CAPACITY_CONNECT_STATION_TOKEN", ""))

if __name__ == "__main__":
    asyncio.run(main())
