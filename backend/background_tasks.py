"""
Background Tasks for Session Management
Handles periodic cleanup and monitoring
"""

import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from sqlalchemy import select
from database import get_db, AsyncSessionLocal
from session_manager import SessionManager
from models import GameSession


logger = logging.getLogger(__name__)


class BackgroundTaskManager:
    """Manages background tasks for session management"""
    
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def start(self):
        """Start all background tasks"""
        if self.running:
            return
        
        self.running = True
        logger.info("Starting background tasks...")
        
        # Start individual tasks
        self.tasks.append(asyncio.create_task(self.heartbeat_monitor()))
        self.tasks.append(asyncio.create_task(self.session_cleanup()))
        self.tasks.append(asyncio.create_task(self.abandoned_game_checker()))
    
    async def stop(self):
        """Stop all background tasks"""
        self.running = False
        logger.info("Stopping background tasks...")
        
        for task in self.tasks:
            task.cancel()
        
        await asyncio.gather(*self.tasks, return_exceptions=True)
        self.tasks.clear()
    
    async def heartbeat_monitor(self):
        """
        Monitor heartbeat timeouts
        Runs every 30 seconds
        """
        while self.running:
            try:
                async with AsyncSessionLocal() as db:
                    try:
                        # Find sessions with stale heartbeats (> 30 seconds)
                        thirty_seconds_ago = datetime.now() - timedelta(seconds=30)
                        
                        stale_sessions = await db.execute(
                            select(GameSession).filter(
                                GameSession.is_active == True,
                                GameSession.last_heartbeat < thirty_seconds_ago,
                                GameSession.disconnected_at == None
                            )
                        )
                        stale_sessions = stale_sessions.scalars().all()
                        
                        if stale_sessions:
                            logger.info(f"Found {len(stale_sessions)} sessions with stale heartbeats")
                            
                            session_manager = SessionManager(db)
                            for session in stale_sessions:
                                # Mark as disconnected
                                await session_manager.mark_disconnected(session.id)
                                logger.warning(f"Session {session.id} marked as disconnected due to heartbeat timeout")
                            
                            await db.commit()
                    
                    except Exception as e:
                        logger.error(f"Error in heartbeat monitor: {e}")
                        await db.rollback()
            
            except Exception as e:
                logger.error(f"Error in heartbeat monitor outer loop: {e}")
            
            # Wait 30 seconds before next check
            await asyncio.sleep(30)
    
    async def session_cleanup(self):
        """
        Clean up expired sessions
        Runs every hour
        """
        while self.running:
            try:
                async with AsyncSessionLocal() as db:
                    try:
                        session_manager = SessionManager(db)
                        count = await session_manager.cleanup_expired_sessions()
                        
                        if count > 0:
                            logger.info(f"Cleaned up {count} expired sessions")
                            await db.commit()
                    
                    except Exception as e:
                        logger.error(f"Error in session cleanup: {e}")
                        await db.rollback()
                
            except Exception as e:
                logger.error(f"Error in session cleanup outer loop: {e}")
            
            # Wait 1 hour before next cleanup
            await asyncio.sleep(3600)
    
    async def abandoned_game_checker(self):
        """
        Check for abandoned games
        Runs every 60 seconds
        """
        while self.running:
            try:
                async with AsyncSessionLocal() as db:
                    try:
                        session_manager = SessionManager(db)
                        abandoned_rooms = await session_manager.check_abandoned_games()
                        
                        if abandoned_rooms:
                            logger.info(f"Found {len(abandoned_rooms)} rooms with abandoned players")
                            # TODO: Notify connected players about abandoned games
                            # This will be implemented when we add the notification system
                            await db.commit()
                    
                    except Exception as e:
                        logger.error(f"Error in abandoned game checker: {e}")
                        await db.rollback()
                
            except Exception as e:
                logger.error(f"Error in abandoned game checker outer loop: {e}")
            
            # Wait 60 seconds before next check
            await asyncio.sleep(60)


# Global instance
background_task_manager = BackgroundTaskManager()
