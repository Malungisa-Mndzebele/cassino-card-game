"""
Game Action Logger - Async Version
Logs all game actions for replay and deduplication
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib
import logging
import json
from datetime import datetime
from typing import Optional

from models import GameActionLog

logger = logging.getLogger(__name__)


class ActionLogger:
    """Service for logging game actions (async version)"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_game_action(
        self,
        room_id: str,
        player_id: int,
        action_type: str,
        action_data: dict
    ) -> str:
        action_id = self._generate_action_id(room_id, player_id, action_type, action_data)

        result = await self.db.execute(
            select(GameActionLog).where(GameActionLog.action_id == action_id)
        )
        existing = result.scalar_one_or_none()

        if existing:
            logger.info(f"Action {action_id} already logged, skipping duplicate")
            return action_id

        result = await self.db.execute(
            select(GameActionLog)
            .where(GameActionLog.room_id == room_id)
            .order_by(GameActionLog.sequence_number.desc())
            .limit(1)
        )
        last_action = result.scalar_one_or_none()

        sequence_number = 1 if not last_action else last_action.sequence_number + 1

        action_log = GameActionLog(
            room_id=room_id,
            player_id=player_id,
            action_type=action_type,
            action_data=action_data,
            sequence_number=sequence_number,
            action_id=action_id
        )

        self.db.add(action_log)
        await self.db.commit()

        logger.info(f"Logged action {action_id} (seq {sequence_number}) for player {player_id} in room {room_id}")
        return action_id

    async def is_action_processed(self, action_id: str) -> bool:
        result = await self.db.execute(
            select(GameActionLog).where(GameActionLog.action_id == action_id)
        )
        return result.scalar_one_or_none() is not None

    async def get_action_by_id(self, action_id: str) -> Optional[GameActionLog]:
        result = await self.db.execute(
            select(GameActionLog).where(GameActionLog.action_id == action_id)
        )
        return result.scalar_one_or_none()

    async def get_room_actions(self, room_id: str, limit: Optional[int] = None) -> list:
        query = select(GameActionLog).where(
            GameActionLog.room_id == room_id
        ).order_by(GameActionLog.sequence_number)

        if limit:
            query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    def _generate_action_id(self, room_id: str, player_id: int, action_type: str, action_data: dict) -> str:
        data_str = json.dumps(action_data, sort_keys=True)
        timestamp = datetime.now().isoformat()
        hash_input = f"{room_id}:{player_id}:{action_type}:{data_str}:{timestamp}"
        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]
