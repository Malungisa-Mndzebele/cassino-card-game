"""
Unit tests for Event Store Engine

Tests the core functionality of the EventStoreEngine including:
- Event storage and retrieval
- Sequence number generation
- Checksum computation
- Snapshot creation and management
- Event replay
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Room, Player, GameEvent, StateSnapshot
from event_store import EventStoreEngine


# Test database setup
@pytest.fixture
def db_session():
    """Create a test database session"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def test_room(db_session):
    """Create a test room"""
    room = Room(
        id="TEST01",
        game_phase="round1",
        current_turn=1,
        round_number=1,
        deck=[],
        player1_hand=[{"id": "A_hearts", "rank": "A", "suit": "hearts"}],
        player2_hand=[{"id": "2_spades", "rank": "2", "suit": "spades"}],
        table_cards=[{"id": "3_clubs", "rank": "3", "suit": "clubs"}],
        builds=[],
        player1_captured=[],
        player2_captured=[],
        player1_score=0,
        player2_score=0,
        version=0
    )
    db_session.add(room)
    db_session.commit()
    return room


@pytest.fixture
def test_player(db_session, test_room):
    """Create a test player"""
    player = Player(
        room_id=test_room.id,
        name="TestPlayer",
        ready=True
    )
    db_session.add(player)
    db_session.commit()
    return player


@pytest.fixture
def event_store(db_session):
    """Create an EventStoreEngine instance"""
    return EventStoreEngine(db_session, snapshot_interval=10, max_snapshots=5)


class TestEventStoreEngine:
    """Test suite for EventStoreEngine"""
    
    def test_initialization(self, event_store):
        """Test EventStoreEngine initialization"""
        assert event_store.snapshot_interval == 10
        assert event_store.max_snapshots == 5
    
    @pytest.mark.asyncio
    async def test_store_event(self, event_store, test_room, test_player):
        """Test storing a single event"""
        action_data = {
            "card_id": "A_hearts",
            "target_cards": ["3_clubs"],
            "state_changes": {
                "player1_hand": [],
                "player1_captured": [
                    {"id": "A_hearts", "rank": "A", "suit": "hearts"},
                    {"id": "3_clubs", "rank": "3", "suit": "clubs"}
                ],
                "table_cards": []
            }
        }
        
        event = await event_store.store_event(
            room_id=test_room.id,
            action_type="capture",
            action_data=action_data,
            version=1,
            player_id=test_player.id
        )
        
        assert event.id is not None
        assert event.room_id == test_room.id
        assert event.sequence_number == 1
        assert event.version == 1
        assert event.action_type == "capture"
        assert event.player_id == test_player.id
        assert event.checksum is not None
    
    @pytest.mark.asyncio
    async def test_sequence_number_increment(self, event_store, test_room, test_player):
        """Test that sequence numbers increment correctly"""
        # Store first event
        event1 = await event_store.store_event(
            room_id=test_room.id,
            action_type="capture",
            action_data={"test": "data1"},
            version=1,
            player_id=test_player.id
        )
        
        # Store second event
        event2 = await event_store.store_event(
            room_id=test_room.id,
            action_type="trail",
            action_data={"test": "data2"},
            version=2,
            player_id=test_player.id
        )
        
        assert event1.sequence_number == 1
        assert event2.sequence_number == 2
    
    @pytest.mark.asyncio
    async def test_get_events(self, event_store, test_room, test_player):
        """Test retrieving events"""
        # Store multiple events
        for i in range(5):
            await event_store.store_event(
                room_id=test_room.id,
                action_type="capture",
                action_data={"index": i},
                version=i + 1,
                player_id=test_player.id
            )
        
        # Get all events
        events = await event_store.get_events(test_room.id)
        assert len(events) == 5
        
        # Get events from version 3
        events = await event_store.get_events(test_room.id, from_version=3)
        assert len(events) == 3
        assert events[0].version == 3
        
        # Get events from version 2 to 4
        events = await event_store.get_events(test_room.id, from_version=2, to_version=4)
        assert len(events) == 3
        assert events[0].version == 2
        assert events[-1].version == 4
    
    @pytest.mark.asyncio
    async def test_create_snapshot(self, event_store, test_room):
        """Test creating a snapshot"""
        state_data = {
            "version": 10,
            "game_phase": "round1",
            "current_turn": 1,
            "round_number": 1,
            "deck": [],
            "player1_hand": [],
            "player2_hand": [],
            "table_cards": [],
            "builds": [],
            "player1_captured": [],
            "player2_captured": [],
            "player1_score": 5,
            "player2_score": 3
        }
        
        snapshot = await event_store.create_snapshot(test_room.id, state_data)
        
        assert snapshot.id is not None
        assert snapshot.room_id == test_room.id
        assert snapshot.version == 10
        assert snapshot.state_data == state_data
        assert snapshot.checksum is not None
    
    @pytest.mark.asyncio
    async def test_automatic_snapshot_creation(self, event_store, test_room, test_player):
        """Test automatic snapshot creation at intervals"""
        state_data = {
            "version": 10,
            "game_phase": "round1",
            "current_turn": 1,
            "round_number": 1,
            "deck": [],
            "player1_hand": [],
            "player2_hand": [],
            "table_cards": [],
            "builds": [],
            "player1_captured": [],
            "player2_captured": [],
            "player1_score": 0,
            "player2_score": 0
        }
        
        # Version 10 should trigger snapshot (interval = 10)
        snapshot = await event_store.check_and_create_snapshot(
            test_room.id, 10, state_data
        )
        assert snapshot is not None
        assert snapshot.version == 10
        
        # Version 11 should not trigger snapshot
        state_data["version"] = 11
        snapshot = await event_store.check_and_create_snapshot(
            test_room.id, 11, state_data
        )
        assert snapshot is None
        
        # Version 20 should trigger snapshot
        state_data["version"] = 20
        snapshot = await event_store.check_and_create_snapshot(
            test_room.id, 20, state_data
        )
        assert snapshot is not None
        assert snapshot.version == 20
    
    @pytest.mark.asyncio
    async def test_snapshot_cleanup(self, event_store, test_room):
        """Test that old snapshots are cleaned up"""
        # Create 7 snapshots (max is 5)
        for i in range(7):
            state_data = {
                "version": (i + 1) * 10,
                "game_phase": "round1",
                "current_turn": 1,
                "round_number": 1,
                "deck": [],
                "player1_hand": [],
                "player2_hand": [],
                "table_cards": [],
                "builds": [],
                "player1_captured": [],
                "player2_captured": [],
                "player1_score": 0,
                "player2_score": 0
            }
            await event_store.create_snapshot(test_room.id, state_data)
        
        # Trigger cleanup
        await event_store._cleanup_old_snapshots(test_room.id)
        
        # Should only have 5 snapshots left
        snapshots = event_store.db.query(StateSnapshot).filter(
            StateSnapshot.room_id == test_room.id
        ).all()
        assert len(snapshots) == 5
        
        # Should keep the most recent ones (30, 40, 50, 60, 70)
        versions = sorted([s.version for s in snapshots])
        assert versions == [30, 40, 50, 60, 70]
    
    @pytest.mark.asyncio
    async def test_get_latest_snapshot(self, event_store, test_room):
        """Test retrieving the latest snapshot"""
        # No snapshots initially
        snapshot = await event_store.get_latest_snapshot(test_room.id)
        assert snapshot is None
        
        # Create snapshots
        for i in range(3):
            state_data = {
                "version": (i + 1) * 10,
                "game_phase": "round1",
                "current_turn": 1,
                "round_number": 1,
                "deck": [],
                "player1_hand": [],
                "player2_hand": [],
                "table_cards": [],
                "builds": [],
                "player1_captured": [],
                "player2_captured": [],
                "player1_score": 0,
                "player2_score": 0
            }
            await event_store.create_snapshot(test_room.id, state_data)
        
        # Get latest
        snapshot = await event_store.get_latest_snapshot(test_room.id)
        assert snapshot is not None
        assert snapshot.version == 30
    
    @pytest.mark.asyncio
    async def test_replay_events_from_initial(self, event_store, test_room, test_player):
        """Test replaying events from initial state"""
        # Store events with state changes
        await event_store.store_event(
            room_id=test_room.id,
            action_type="capture",
            action_data={
                "state_changes": {
                    "player1_score": 1,
                    "player1_captured": [{"id": "A_hearts", "rank": "A", "suit": "hearts"}]
                }
            },
            version=1,
            player_id=test_player.id
        )
        
        await event_store.store_event(
            room_id=test_room.id,
            action_type="capture",
            action_data={
                "state_changes": {
                    "player2_score": 2,
                    "player2_captured": [{"id": "2_spades", "rank": "2", "suit": "spades"}]
                }
            },
            version=2,
            player_id=test_player.id
        )
        
        # Replay events
        state = await event_store.replay_events(test_room.id)
        
        assert state["version"] == 2
        assert state["player1_score"] == 1
        assert state["player2_score"] == 2
    
    @pytest.mark.asyncio
    async def test_replay_events_from_snapshot(self, event_store, test_room, test_player):
        """Test replaying events from a snapshot"""
        # Create a snapshot at version 10
        snapshot_state = {
            "version": 10,
            "game_phase": "round1",
            "current_turn": 1,
            "round_number": 1,
            "deck": [],
            "player1_hand": [],
            "player2_hand": [],
            "table_cards": [],
            "builds": [],
            "player1_captured": [],
            "player2_captured": [],
            "player1_score": 5,
            "player2_score": 3
        }
        snapshot = await event_store.create_snapshot(test_room.id, snapshot_state)
        
        # Store events after snapshot
        await event_store.store_event(
            room_id=test_room.id,
            action_type="capture",
            action_data={
                "state_changes": {
                    "player1_score": 6
                }
            },
            version=11,
            player_id=test_player.id
        )
        
        # Replay from snapshot
        state = await event_store.replay_events(test_room.id, from_snapshot=snapshot)
        
        assert state["version"] == 11
        assert state["player1_score"] == 6
        assert state["player2_score"] == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
