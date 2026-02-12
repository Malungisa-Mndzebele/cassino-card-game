"""
Game Service - Business logic for game actions

Handles game actions (play card, shuffle, deal), state updates, and game flow.
Separates business logic from route handlers for better testability.
"""

from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging
from datetime import datetime

from models import Room, Player
from schemas import PlayCardRequest, StartShuffleRequest, SelectFaceUpCardsRequest, StartGameRequest
from game_logic import CasinoGameLogic, GameCard, Build
from action_logger import ActionLogger

logger = logging.getLogger(__name__)


class GameService:
    """
    Service for game-related operations.
    
    Provides methods for executing game actions (capture, build, trail),
    managing game phases, and handling game state updates.
    """
    
    def __init__(
        self,
        db: AsyncSession,
        game_logic: Optional[CasinoGameLogic] = None,
        action_logger: Optional[ActionLogger] = None
    ):
        """
        Initialize game service.
        
        Args:
            db: Async database session
            game_logic: Optional game logic instance
            action_logger: Optional action logger for audit trail
        """
        self.db = db
        self.game_logic = game_logic or CasinoGameLogic()
        self.action_logger = action_logger or ActionLogger(db)
    
    # Card conversion utilities
    @staticmethod
    def convert_game_cards_to_dict(cards: List[GameCard]) -> List[Dict[str, Any]]:
        """Convert GameCard objects to dictionary format for JSON storage."""
        return [{"id": card.id, "suit": card.suit, "rank": card.rank, "value": card.value} for card in cards]
    
    @staticmethod
    def convert_dict_to_game_cards(cards_dict: List[Dict[str, Any]]) -> List[GameCard]:
        """Convert dictionary format to GameCard objects."""
        return [GameCard(id=card["id"], suit=card["suit"], rank=card["rank"], value=card["value"]) for card in cards_dict]
    
    @staticmethod
    def convert_builds_to_dict(builds: List[Build]) -> List[Dict[str, Any]]:
        """Convert Build objects to dictionary format for JSON storage."""
        return [{"id": build.id, "cards": GameService.convert_game_cards_to_dict(build.cards), "value": build.value, "owner": build.owner} for build in builds]
    
    @staticmethod
    def convert_dict_to_builds(builds_dict: List[Dict[str, Any]]) -> List[Build]:
        """Convert dictionary format to Build objects."""
        return [Build(id=build["id"], cards=GameService.convert_dict_to_game_cards(build["cards"]), value=build["value"], owner=build["owner"]) for build in builds_dict]
    
    def get_sorted_players(self, room: Room) -> List[Player]:
        """Return players sorted by join time (player 1 first)."""
        if not room.players:
            return []
        return sorted(room.players, key=lambda p: p.joined_at or datetime.min)
    
    async def start_shuffle(self, room: Room, player_id: int) -> Room:
        """
        Start the shuffle phase.
        
        Args:
            room: Room object
            player_id: Player initiating shuffle
        
        Returns:
            Updated room object
        """
        room.shuffle_complete = True
        room.game_phase = "dealer"
        
        # Increment version and update metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = player_id
        
        await self.db.commit()
        
        logger.info(f"Shuffle started in room {room.id} by player {player_id}")
        
        return room
    
    async def select_face_up_cards(self, room: Room, player_id: int) -> Room:
        """
        Select face-up cards and deal initial cards.
        
        Args:
            room: Room object
            player_id: Player selecting cards (must be player 1)
        
        Returns:
            Updated room object
        
        Raises:
            ValueError: If not player 1 or invalid state
        """
        # Check if it's the right player's turn (Player 1 should select face-up cards)
        players_in_room = self.get_sorted_players(room)
        if len(players_in_room) == 0 or player_id != players_in_room[0].id:
            raise ValueError("Only Player 1 can select face-up cards")
        
        room.card_selection_complete = True
        room.game_phase = "round1"
        room.game_started = True
        room.round_number = 1
        room.current_turn = 1
        
        # Create and deal cards using game logic
        deck = self.game_logic.create_deck()
        table_cards, player1_hand, player2_hand, remaining_deck = self.game_logic.deal_initial_cards(deck)
        
        # Store in database
        room.deck = self.convert_game_cards_to_dict(remaining_deck)
        room.table_cards = self.convert_game_cards_to_dict(table_cards)
        room.player1_hand = self.convert_game_cards_to_dict(player1_hand)
        room.player2_hand = self.convert_game_cards_to_dict(player2_hand)
        room.dealing_complete = True
        
        # Increment version and update metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = player_id
        
        await self.db.commit()
        
        logger.info(f"Cards dealt in room {room.id} by player {player_id}")
        
        return room

    async def start_game(self, room: Room, player_id: int) -> Room:
        """
        Start the game after dealer animation completes.
        
        Combines shuffle and deal into a single action:
        1. Creates and shuffles the deck
        2. Deals cards to each player
        3. Places cards face-up on the table
        4. Transitions game phase to round1
        
        Args:
            room: Room object
            player_id: Player starting the game
        
        Returns:
            Updated room object
        
        Raises:
            ValueError: If game not in dealer phase or player not in room
        """
        # Verify game is in dealer phase (both players ready)
        if room.game_phase != "dealer":
            raise ValueError(f"Game must be in dealer phase to start. Current phase: {room.game_phase}")
        
        # Verify player is in the room
        players_in_room = self.get_sorted_players(room)
        player_ids = [p.id for p in players_in_room]
        if player_id not in player_ids:
            raise ValueError("Player not in room")
        
        # Set shuffle and card selection as complete
        room.shuffle_complete = True
        room.card_selection_complete = True
        room.game_phase = "round1"
        room.game_started = True
        room.round_number = 1
        room.current_turn = 1
        
        # Create and deal cards using game logic
        deck = self.game_logic.create_deck()
        table_cards, player1_hand, player2_hand, remaining_deck = self.game_logic.deal_initial_cards(deck)
        
        # Store in database
        room.deck = self.convert_game_cards_to_dict(remaining_deck)
        room.table_cards = self.convert_game_cards_to_dict(table_cards)
        room.player1_hand = self.convert_game_cards_to_dict(player1_hand)
        room.player2_hand = self.convert_game_cards_to_dict(player2_hand)
        room.dealing_complete = True
        
        # Increment version and update metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = player_id
        
        await self.db.commit()
        
        logger.info(f"Game started in room {room.id} by player {player_id}")
        
        return room
    
    async def play_card(
        self,
        room: Room,
        player_id: int,
        card_id: str,
        action: str,
        target_cards: Optional[List[str]] = None,
        build_value: Optional[int] = None,
        client_version: Optional[int] = None
    ) -> Tuple[Room, Optional[str]]:
        """
        Execute a card play action (capture, build, or trail).
        
        Args:
            room: Room object
            player_id: Player making the move
            card_id: ID of card being played
            action: Action type (capture, build, trail)
            target_cards: IDs of target cards for capture/build
            build_value: Value for build action
            client_version: Client's version for conflict detection
        
        Returns:
            Tuple of (updated room, action_id)
        
        Raises:
            ValueError: If invalid action, not player's turn, or card not found
            VersionConflictError: If client version doesn't match server
        """
        from version_validator import validate_version
        
        # Version conflict handling
        if client_version is not None:
            validation = validate_version(client_version, room.version)
            if not validation.valid:
                raise VersionConflictError(
                    message=validation.message,
                    client_version=client_version,
                    server_version=room.version,
                    requires_sync=validation.requires_sync,
                    has_gap=validation.has_gap,
                    gap_size=validation.gap_size
                )
        
        # Log the action
        action_id = await self.action_logger.log_game_action(
            room_id=room.id,
            player_id=player_id,
            action_type=action,
            action_data={
                "card_id": card_id,
                "target_cards": target_cards,
                "build_value": build_value
            }
        )
        
        # Check if game is in progress
        if room.game_phase not in ["round1", "round2"]:
            raise ValueError("Game is not in progress")
        
        # Check if it's the player's turn
        self._assert_players_turn(room, player_id)
        
        # Convert database data to game objects
        player1_hand = self.convert_dict_to_game_cards(room.player1_hand or [])
        player2_hand = self.convert_dict_to_game_cards(room.player2_hand or [])
        table_cards = self.convert_dict_to_game_cards(room.table_cards or [])
        builds = self.convert_dict_to_builds(room.builds or [])
        player1_captured = self.convert_dict_to_game_cards(room.player1_captured or [])
        player2_captured = self.convert_dict_to_game_cards(room.player2_captured or [])
        
        # Determine which player is playing based on join order
        players_in_room = self.get_sorted_players(room)
        is_player1 = player_id == players_in_room[0].id
        player_hand = player1_hand if is_player1 else player2_hand
        player_captured = player1_captured if is_player1 else player2_captured
        
        # Find the card being played
        hand_card = next((card for card in player_hand if card.id == card_id), None)
        if not hand_card:
            raise ValueError("Card not found in player's hand")
        
        # Establish opponent's captured pile
        opponent_captured = player2_captured if is_player1 else player1_captured

        # Execute the action based on type
        if action == "capture":
            self._execute_capture(
                hand_card, player_hand, player_captured,
                table_cards, builds, target_cards or [], player_id
            )
        elif action == "build":
            self._execute_build(
                hand_card, player_hand, table_cards, builds,
                opponent_captured, target_cards or [], build_value or 0, player_id
            )
        elif action == "trail":
            self._execute_trail(hand_card, player_hand, table_cards)
        else:
            raise ValueError("Invalid action")
        
        # Update database with new game state
        room.player1_hand = self.convert_game_cards_to_dict(player1_hand)
        room.player2_hand = self.convert_game_cards_to_dict(player2_hand)
        room.table_cards = self.convert_game_cards_to_dict(table_cards)
        room.builds = self.convert_builds_to_dict(builds)
        room.player1_captured = self.convert_game_cards_to_dict(player1_captured)
        room.player2_captured = self.convert_game_cards_to_dict(player2_captured)
        
        # Update last play information
        room.last_play = {
            "card_id": card_id,
            "action": action,
            "target_cards": target_cards,
            "build_value": build_value,
            "player_id": player_id
        }
        room.last_action = action
        
        # Check if round is complete and handle game flow
        self._handle_round_completion(room, player1_hand, player2_hand, player1_captured, player2_captured)
        
        # Increment version and update metadata
        room.version += 1
        room.last_modified = datetime.utcnow()
        room.modified_by = player_id
        
        await self.db.commit()
        
        return room, action_id
    
    def _assert_players_turn(self, room: Room, player_id: int) -> None:
        """Validate it's the specified player's turn."""
        players_in_room = self.get_sorted_players(room)
        if len(players_in_room) < 2:
            raise ValueError("Not enough players")
        expected_player = players_in_room[room.current_turn - 1] if room.current_turn <= len(players_in_room) else None
        if not expected_player or expected_player.id != player_id:
            raise ValueError("Not your turn")
    
    def _execute_capture(
        self,
        hand_card: GameCard,
        player_hand: List[GameCard],
        player_captured: List[GameCard],
        table_cards: List[GameCard],
        builds: List[Build],
        target_card_ids: List[str],
        player_id: int
    ) -> None:
        """Execute a capture action."""
        target_cards = [card for card in table_cards if card.id in target_card_ids]
        target_builds = [build for build in builds if build.id in target_card_ids]
        
        if not self.game_logic.validate_capture(hand_card, target_cards, target_builds):
            raise ValueError("Invalid capture")
        
        captured_cards, remaining_builds, _ = self.game_logic.execute_capture(
            hand_card, target_cards, target_builds, builds, player_id
        )
        
        player_hand.remove(hand_card)
        # Add captured cards with hand card on top (last in list = top of pile)
        player_captured.extend(captured_cards[1:])  # Add captured table cards/builds first
        player_captured.append(captured_cards[0])   # Hand card goes on top (end of list)
        
        # Remove captured cards from table
        for card in target_cards:
            if card in table_cards:
                table_cards.remove(card)
        
        # Update builds list
        builds.clear()
        builds.extend(remaining_builds)
    
    def _execute_build(
        self,
        hand_card: GameCard,
        player_hand: List[GameCard],
        table_cards: List[GameCard],
        builds: List[Build],
        opponent_captured: List[GameCard],
        target_card_ids: List[str],
        build_value: int,
        player_id: int
    ) -> None:
        """Execute a build action."""
        # Find target cards in table
        target_cards = [card for card in table_cards if card.id in target_card_ids]
        target_builds = [build for build in builds if build.id in target_card_ids]
        
        # Check opponent's top captured card
        opponent_top_card = None
        if opponent_captured and opponent_captured[-1].id in target_card_ids:
            opponent_top_card = opponent_captured[-1]
            target_cards.append(opponent_top_card)
        
        if not self.game_logic.validate_build(hand_card, target_cards, build_value, player_hand, target_builds):
            raise ValueError("Invalid build")
        
        _, new_build = self.game_logic.execute_build(
            hand_card, target_cards, build_value, player_id, target_builds
        )
        
        player_hand.remove(hand_card)
        
        # Remove used cards from table
        for card in target_cards:
            if card in table_cards:
                table_cards.remove(card)
            # Remove from opponent captured if it was the top card
            elif opponent_top_card and card.id == opponent_top_card.id:
                opponent_captured.remove(card)
        
        # Remove merged builds from builds list
        for build in target_builds:
            if build in builds:
                builds.remove(build)

        builds.append(new_build)
    
    def _execute_trail(
        self,
        hand_card: GameCard,
        player_hand: List[GameCard],
        table_cards: List[GameCard]
    ) -> None:
        """Execute a trail action."""
        new_table_cards = self.game_logic.execute_trail(hand_card)
        player_hand.remove(hand_card)
        table_cards.extend(new_table_cards)

    def _handle_round_completion(
        self,
        room: Room,
        player1_hand: List[GameCard],
        player2_hand: List[GameCard],
        player1_captured: List[GameCard],
        player2_captured: List[GameCard]
    ) -> None:
        """Handle round completion and game flow."""
        if self.game_logic.is_round_complete(player1_hand, player2_hand):
            remaining_deck = self.convert_dict_to_game_cards(room.deck or [])
            
            if len(remaining_deck) > 0 and room.round_number == 1:
                # Deal round 2 cards
                new_player1_hand, new_player2_hand, new_deck = self.game_logic.deal_round_cards(
                    remaining_deck, player1_hand, player2_hand
                )
                
                room.player1_hand = self.convert_game_cards_to_dict(new_player1_hand)
                room.player2_hand = self.convert_game_cards_to_dict(new_player2_hand)
                room.deck = self.convert_game_cards_to_dict(new_deck)
                room.round_number = 2
                room.game_phase = "round2"
                room.current_turn = 1  # Reset turn to player 1 for round 2
            else:
                # Game is complete
                room.game_phase = "finished"
                room.game_completed = True
                
                # Calculate final scores
                p1_base_score = self.game_logic.calculate_score(player1_captured)
                p2_base_score = self.game_logic.calculate_score(player2_captured)
                p1_bonus, p2_bonus = self.game_logic.calculate_bonus_scores(player1_captured, player2_captured)
                
                room.player1_score = p1_base_score + p1_bonus
                room.player2_score = p2_base_score + p2_bonus
                
                # Determine winner
                room.winner = self.game_logic.determine_winner(
                    room.player1_score, room.player2_score,
                    len(player1_captured), len(player2_captured)
                )
        else:
            # Switch turns
            room.current_turn = 2 if room.current_turn == 1 else 1


class VersionConflictError(Exception):
    """Exception raised when client version conflicts with server version."""
    
    def __init__(
        self,
        message: str,
        client_version: int,
        server_version: int,
        requires_sync: bool = True,
        has_gap: bool = False,
        gap_size: int = 0
    ):
        super().__init__(message)
        self.message = message
        self.client_version = client_version
        self.server_version = server_version
        self.requires_sync = requires_sync
        self.has_gap = has_gap
        self.gap_size = gap_size
