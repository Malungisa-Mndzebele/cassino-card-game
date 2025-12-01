"""
Integration tests for security validations in state synchronizer.

This module tests that security validations are properly integrated into
the state synchronization flow and that violations are detected and logged.

Requirements: 4.2
"""

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Room
from state_synchronizer import StateSynchronizer

# Test database URL (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def async_engine():
    """Create async test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()


@pytest_asyncio.fixture
async def async_db(async_engine):
    """Create async database session"""
    async_session = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def test_room_valid(async_db):
    """Create test room with valid state (52 cards total)"""
    # Create valid card distribution
    deck = []
    for rank in ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']:
        for suit in ['hearts', 'diamonds', 'clubs', 'spades']:
            deck.append({"id": f"{rank}_{suit}", "rank": rank, "suit": suit})
    
    room = Room(
        id="VALID1",
        game_phase="round1",
        status="playing",
        version=1,
        deck=deck[:40],  # 40 cards in deck
        player1_hand=[deck[40], deck[41], deck[42], deck[43]],  # 4 cards
        player2_hand=[deck[44], deck[45], deck[46], deck[47]],  # 4 cards
        table_cards=[deck[48], deck[49], deck[50], deck[51]],  # 4 cards
        player1_captured=[],
        player2_captured=[],
        builds=[],
        player1_score=0,
        player2_score=0,
        round_number=1
    )
    async_db.add(room)
    await async_db.commit()
    await async_db.refresh(room)
    return room


@pytest_asyncio.fixture
async def test_room_invalid_cards(async_db):
    """Create test room with invalid card count (security violation)"""
    # Create only 10 cards (should be 52)
    deck = []
    for i in range(10):
        deck.append({"id": f"A_hearts_{i}", "rank": "A", "suit": "hearts"})
    
    room = Room(
        id="INVLD1",
        game_phase="round1",
        status="playing",
        version=1,
        deck=deck,
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        player1_captured=[],
        player2_captured=[],
        builds=[],
        player1_score=0,
        player2_score=0,
        round_number=1
    )
    async_db.add(room)
    await async_db.commit()
    await async_db.refresh(room)
    return room


@pytest_asyncio.fixture
async def test_room_invalid_score(async_db):
    """Create test room with invalid score (security violation)"""
    # Create valid card distribution
    deck = []
    for rank in ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']:
        for suit in ['hearts', 'diamonds', 'clubs', 'spades']:
            deck.append({"id": f"{rank}_{suit}", "rank": rank, "suit": suit})
    
    room = Room(
        id="INVLD2",
        game_phase="round1",
        status="playing",
        version=1,
        deck=deck[:48],
        player1_hand=[],
        player2_hand=[],
        table_cards=[],
        player1_captured=[deck[48], deck[49], deck[50], deck[51]],  # 4 cards
        player2_captured=[],
        builds=[],
        player1_score=100,  # Invalid score (too high)
        player2_score=0,
        round_number=1
    )
    async_db.add(room)
    await async_db.commit()
    await async_db.refresh(room)
    return room


class TestSecurityIntegration:
    """Test security validation integration with state synchronizer"""
    
    @pytest.mark.asyncio
    async def test_valid_state_passes_security_checks(self, async_db, test_room_valid):
        """Test that valid state passes all security checks"""
        synchronizer = StateSynchronizer(db=async_db)
        
        result = await synchronizer.process_action(
            room_id=test_room_valid.id,
            player_id=1,
            action_type="test_action",
            action_data={"test": "data"}
        )
        
        # Should succeed with no security violations
        assert result.success is True
        assert len(result.errors) == 0
        assert result.version == 2  # Version incremented
    
    @pytest.mark.asyncio
    async def test_invalid_card_count_blocks_action(self, async_db, test_room_invalid_cards):
        """Test that invalid card count triggers security violation and blocks action"""
        synchronizer = StateSynchronizer(db=async_db)
        
        result = await synchronizer.process_action(
            room_id=test_room_invalid_cards.id,
            player_id=1,
            action_type="test_action",
            action_data={"test": "data"}
        )
        
        # Should fail due to critical security violation
        assert result.success is False
        assert len(result.errors) > 0
        assert any("card count" in error.lower() for error in result.errors)
        assert result.version == 1  # Version not incremented
    
    @pytest.mark.asyncio
    async def test_invalid_score_blocks_action(self, async_db, test_room_invalid_score):
        """Test that invalid score triggers security violation and blocks action"""
        synchronizer = StateSynchronizer(db=async_db)
        
        result = await synchronizer.process_action(
            room_id=test_room_invalid_score.id,
            player_id=1,
            action_type="test_action",
            action_data={"test": "data"}
        )
        
        # Should fail due to critical security violation
        assert result.success is False
        assert len(result.errors) > 0
        assert any("score" in error.lower() for error in result.errors)
        assert result.version == 1  # Version not incremented
    
    @pytest.mark.asyncio
    async def test_security_violations_logged(self, async_db, test_room_invalid_cards, caplog):
        """Test that security violations are properly logged"""
        import logging
        caplog.set_level(logging.ERROR)
        
        synchronizer = StateSynchronizer(db=async_db)
        
        await synchronizer.process_action(
            room_id=test_room_invalid_cards.id,
            player_id=1,
            action_type="test_action",
            action_data={"test": "data"}
        )
        
        # Check that security violation was logged
        assert any("SECURITY" in record.message for record in caplog.records)
        assert any("card count" in record.message.lower() for record in caplog.records)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
