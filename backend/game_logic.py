"""
Casino Card Game Logic Implementation
Complete game mechanics for capture, build, trail, scoring, and win conditions
"""

import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

@dataclass
class GameCard:
    """
    Represents a playing card.
    
    Attributes:
        id (str): Unique card identifier (format: "rank_suit", e.g., "A_hearts")
        suit (str): Card suit (hearts, diamonds, clubs, spades)
        rank (str): Card rank (A, 2-10, J, Q, K)
        value (int): Numeric value for game logic (A=14, K=13, Q=12, J=11, 2-10=face value)
    """
    id: str
    suit: str
    rank: str
    value: int


@dataclass
class BuildComponent:
    """
    Represents a single component within a multi-component build.
    
    Each component is an independent group of cards that sums to the
    build's target value. Multi-component builds allow players to create
    multiple card groups in a single action, all summing to the same value.
    
    Attributes:
        cards (List[GameCard]): Cards in this component
        sum_value (int): Calculated sum of cards in this component
        ace_values_used (Dict[str, int]): Maps Ace card IDs to their used value (1 or 14)
    """
    cards: List[GameCard]
    sum_value: int
    ace_values_used: Dict[str, int] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize component for API response.
        
        Returns:
            dict: Dictionary representation with cards, sum_value, and ace_values_used
        """
        return {
            'cards': [{'id': card.id, 'suit': card.suit, 'rank': card.rank, 'value': card.value} 
                     for card in self.cards],
            'sum_value': self.sum_value,
            'ace_values_used': self.ace_values_used
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BuildComponent':
        """
        Deserialize component from database/cache.
        
        Args:
            data: Dictionary containing component data
            
        Returns:
            BuildComponent: Reconstructed component object
        """
        cards = [GameCard(id=c['id'], suit=c['suit'], rank=c['rank'], value=c['value']) 
                for c in data['cards']]
        return cls(
            cards=cards,
            sum_value=data['sum_value'],
            ace_values_used=data.get('ace_values_used', {})
        )


@dataclass
class Build:
    """
    Represents a build combination in the game.
    
    Supports both single-component (legacy) and multi-component builds.
    A build is a combination of cards that can only be captured by a card matching
    the build's value. Builds are owned by the player who created them.
    
    Attributes:
        id (str): Unique build identifier
        cards (List[GameCard]): All cards in the build (flattened from components)
        value (int): Target value for capturing this build
        owner (int): Player ID who created/owns the build
        components (List[BuildComponent]): Component groupings (empty for legacy builds)
        is_multi_component (bool): True if build has multiple components
    """
    id: str
    cards: List[GameCard]
    value: int
    owner: int
    components: List[BuildComponent] = field(default_factory=list)
    is_multi_component: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize build for API response.
        
        Returns:
            dict: Dictionary representation with all build data including components
        """
        return {
            'id': self.id,
            'cards': [{'id': card.id, 'suit': card.suit, 'rank': card.rank, 'value': card.value} 
                     for card in self.cards],
            'value': self.value,
            'owner': self.owner,
            'components': [comp.to_dict() for comp in self.components],
            'is_multi_component': self.is_multi_component
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Build':
        """
        Deserialize build from database/cache.
        
        Args:
            data: Dictionary containing build data
            
        Returns:
            Build: Reconstructed build object
        """
        cards = [GameCard(id=c['id'], suit=c['suit'], rank=c['rank'], value=c['value']) 
                for c in data['cards']]
        components = [BuildComponent.from_dict(c) for c in data.get('components', [])]
        return cls(
            id=data['id'],
            cards=cards,
            value=data['value'],
            owner=data['owner'],
            components=components,
            is_multi_component=data.get('is_multi_component', False)
        )


class CasinoGameLogic:
    """
    Complete Casino card game logic implementation.
    
    This class encapsulates all game mechanics including deck creation, dealing,
    move validation, and scoring. It provides pure functions with no side effects,
    making it easy to test and reason about.
    
    Game Rules:
        - 52-card deck, 2 players
        - Deal 4 cards to table, 4 to each player
        - Players take turns playing cards to capture, build, or trail
        - After hands are empty, deal 4 more cards to each player (round 2)
        - Score points for aces, special cards, most cards, most spades
        - First to 11 points wins
    
    Attributes:
        suits (list): Available card suits
        ranks (list): Available card ranks
    
    Example:
        >>> logic = CasinoGameLogic()
        >>> deck = logic.create_deck()
        >>> table, p1_hand, p2_hand, remaining = logic.deal_initial_cards(deck)
        >>> is_valid = logic.validate_capture(p1_hand[0], table, [])
    """
    
    def __init__(self):
        self.suits = ['hearts', 'diamonds', 'clubs', 'spades']
        self.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    
    def create_deck(self) -> List[GameCard]:
        """
        Create a shuffled deck of 52 cards.
        
        Generates a standard 52-card deck with all suits and ranks, then shuffles
        it using Python's random.shuffle for fair distribution.
        
        Returns:
            list: List of 52 GameCard objects in random order
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> deck = logic.create_deck()
            >>> len(deck)
            52
            >>> deck[0].suit in ['hearts', 'diamonds', 'clubs', 'spades']
            True
        """
        deck = []
        for suit in self.suits:
            for rank in self.ranks:
                value = self.get_card_value(rank)
                card_id = f"{rank}_{suit}"
                deck.append(GameCard(id=card_id, suit=suit, rank=rank, value=value))
        
        random.shuffle(deck)
        return deck
    
    def get_card_value(self, rank: str) -> int:
        """
        Get primary numeric value of a card rank for game logic.
        
        Converts card ranks to numeric values used in capture and build calculations.
        Face cards have special values: A=1 (primary), K=13, Q=12, J=11.
        Note: Aces can also be used as 14 - see get_card_values() for both options.
        
        Args:
            rank (str): Card rank (A, 2-10, J, Q, K)
        
        Returns:
            int: Numeric value of the rank (Ace returns 1 as primary value)
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> logic.get_card_value('A')
            1
            >>> logic.get_card_value('K')
            13
            >>> logic.get_card_value('7')
            7
        """
        face_values = {'A': 1, 'K': 13, 'Q': 12, 'J': 11}
        if rank in face_values:
            return face_values[rank]
        return int(rank)
    
    def get_card_values(self, card: 'GameCard') -> List[int]:
        """
        Get all possible values for a card (Aces can be 1 or 14).
        
        Args:
            card (GameCard): The card to get values for
        
        Returns:
            list: List of possible values (usually 1 element, 2 for Aces)
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> ace = GameCard("A_hearts", "hearts", "A", 1)
            >>> logic.get_card_values(ace)
            [1, 14]
            >>> seven = GameCard("7_spades", "spades", "7", 7)
            >>> logic.get_card_values(seven)
            [7]
        """
        if card.rank == 'A':
            return [1, 14]
        return [card.value]
    
    def deal_initial_cards(self, deck: List[GameCard]) -> Tuple[List[GameCard], List[GameCard], List[GameCard], List[GameCard]]:
        """
        Deal initial cards for game start.
        
        Deals 4 cards to the table, 12 cards to each player, and returns the
        remaining deck for round 2 dealing.
        
        Args:
            deck (list): Full shuffled deck of 52 cards
        
        Returns:
            tuple: (table_cards, player1_hand, player2_hand, remaining_deck)
                - table_cards: 4 cards placed on table
                - player1_hand: 12 cards for player 1
                - player2_hand: 12 cards for player 2
                - remaining_deck: 24 remaining cards for round 2
        
        Raises:
            ValueError: If deck has fewer than 28 cards
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> deck = logic.create_deck()
            >>> table, p1, p2, remaining = logic.deal_initial_cards(deck)
            >>> len(table), len(p1), len(p2), len(remaining)
            (4, 12, 12, 24)
        """
        if len(deck) < 28:
            raise ValueError("Not enough cards in deck")
        
        table_cards = deck[:4]
        player1_hand = deck[4:16]
        player2_hand = deck[16:28]
        remaining_deck = deck[28:]
        
        return table_cards, player1_hand, player2_hand, remaining_deck
    
    def deal_round_cards(self, deck: List[GameCard], player1_hand: List[GameCard], player2_hand: List[GameCard]) -> Tuple[List[GameCard], List[GameCard], List[GameCard]]:
        """Deal 12 more cards to each player for round 2"""
        if len(deck) < 24:
            # Not enough cards for full deal, deal what we can
            cards_to_deal = len(deck)
            cards_per_player = cards_to_deal // 2
            
            new_p1_cards = deck[:cards_per_player]
            new_p2_cards = deck[cards_per_player:cards_per_player*2]
            remaining_deck = deck[cards_per_player*2:]
        else:
            new_p1_cards = deck[:12]
            new_p2_cards = deck[12:24]
            remaining_deck = deck[24:]
        
        player1_hand.extend(new_p1_cards)
        player2_hand.extend(new_p2_cards)
        
        return player1_hand, player2_hand, remaining_deck
    
    def validate_capture(self, hand_card: GameCard, target_cards: List[GameCard], builds: List[Build]) -> bool:
        """
        Validate if a capture move is legal.
        
        A capture is valid if:
        1. Hand card matches a table card's value (direct match)
        2. Hand card value equals sum of multiple table cards
        3. Hand card value matches a build's value
        
        Note: Aces can be used as either 1 or 14 for captures.
        
        Args:
            hand_card (GameCard): Card being played from hand
            target_cards (list): Table cards to capture
            builds (list): Active builds on table
        
        Returns:
            bool: True if capture is valid, False otherwise
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> hand_card = GameCard("8_hearts", "hearts", "8", 8)
            >>> table = [GameCard("3_spades", "spades", "3", 3),
            ...          GameCard("5_diamonds", "diamonds", "5", 5)]
            >>> logic.validate_capture(hand_card, table, [])
            True  # 3 + 5 = 8
        """
        # Get all possible values for the hand card (Aces can be 1 or 14)
        hand_values = self.get_card_values(hand_card)
        
        for hand_value in hand_values:
            # Check direct table card matches (considering Ace dual values)
            for card in target_cards:
                card_values = self.get_card_values(card)
                if hand_value in card_values:
                    return True
            
            # Check if target cards can sum to hand card value
            if self.can_make_value_with_aces(target_cards, hand_value):
                return True
            
            # Check build matches
            for build in builds:
                if build.value == hand_value:
                    return True
        
        return False
    
    def validate_build(self, hand_card: GameCard, target_cards: List[GameCard], build_value: int, player_hand: List[GameCard], target_builds: List[Build] = None) -> bool:
        """
        Validate if a build move is legal.
        
        A build is valid if:
        1. Player has another card in hand that can capture the build
        2. Either:
           a. Target cards + hand card sum to build value (combining build)
           b. No target cards and hand card value equals build value (simple build)
           c. target_builds are present: Hand Card + [Target Cards] sum to Build Value (augmenting build)
        
        Note: Aces can be used as either 1 or 14 for builds.
        
        Args:
            hand_card (GameCard): Card being played from hand
            target_cards (list): Table cards to include in build (can be empty for simple build)
            build_value (int): Declared value of the build
            player_hand (list): Player's complete hand (to verify capture card exists)
            target_builds (list, optional): Existing builds to augment
        
        Returns:
            bool: True if build is valid, False otherwise
        """
        if target_builds is None:
            target_builds = []

        # Get all possible values for the hand card (Aces can be 1 or 14)
        hand_values = self.get_card_values(hand_card)
        
        # Must have cards to capture the build value (considering Ace dual values)
        has_capturing_card = False
        for card in player_hand:
            if card.id != hand_card.id:
                card_values = self.get_card_values(card)
                if build_value in card_values:
                    has_capturing_card = True
                    break
        
        if not has_capturing_card:
            return False
        
        # Check target builds
        if target_builds:
            # All target builds must have the same value as the new build value
            for build in target_builds:
                if build.value != build_value:
                    return False
            
            # Augmenting a build: Hand Card + Target Cards must sum to Build Value
            # Try each possible hand card value
            for hand_value in hand_values:
                needed_value = build_value - hand_value
                if needed_value == 0:
                    # Multiple build: augmenting existing build with a card of same value
                    # Valid only if no additional target cards are being used
                    if len(target_cards) == 0:
                        return True
                    continue
                
                if needed_value < 0:
                    continue
                
                # Check if target cards sum to needed value (considering Ace dual values)
                if self.can_make_value_with_aces(target_cards, needed_value):
                    return True
            
            return False

        # Simple build: no target cards, hand card becomes a build with declared value
        # The hand card's value must equal the build value
        if len(target_cards) == 0:
            return build_value in hand_values
        
        # Combining build: hand card + target cards must sum to build value
        # Can't build same value as any of the hand card's values when combining
        if build_value in hand_values:
            return False
        
        # Try each possible hand card value to see if build is valid
        for hand_value in hand_values:
            needed_value = build_value - hand_value
            if needed_value <= 0:
                continue
            
            # Check if we can make the needed value with target cards (considering Ace dual values)
            if self.can_make_value_with_aces(target_cards, needed_value):
                return True
        
        return False
    
    def can_make_value(self, cards: List[GameCard], target_value: int) -> bool:
        """
        Check if any combination of cards sums to target value.
        
        Uses bit manipulation to try all possible combinations of cards and checks
        if any combination sums to the target value. This is used for validating
        captures and builds.
        
        Note: This method uses primary card values only. For Ace dual-value support,
        use can_make_value_with_aces() instead.
        
        Args:
            cards (list): List of GameCard objects to combine
            target_value (int): Target sum to achieve
        
        Returns:
            bool: True if any combination sums to target, False otherwise
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> cards = [GameCard("3_spades", "spades", "3", 3),
            ...          GameCard("5_diamonds", "diamonds", "5", 5),
            ...          GameCard("2_hearts", "hearts", "2", 2)]
            >>> logic.can_make_value(cards, 8)
            True  # 3 + 5 = 8
            >>> logic.can_make_value(cards, 15)
            False  # No combination sums to 15
        """
        if not cards:
            return target_value == 0
        
        # Try all combinations
        for i in range(1, 2**len(cards)):
            combination = []
            for j in range(len(cards)):
                if i & (1 << j):
                    combination.append(cards[j])
            
            if sum(card.value for card in combination) == target_value:
                return True
        
        return False
    
    def can_make_value_with_aces(self, cards: List[GameCard], target_value: int) -> bool:
        """
        Check if any combination of cards sums to target value, considering Ace dual values.
        
        Aces can be counted as either 1 or 14. This method tries all combinations
        of cards AND all possible Ace value assignments.
        
        Args:
            cards (list): List of GameCard objects to combine
            target_value (int): Target sum to achieve
        
        Returns:
            bool: True if any combination sums to target, False otherwise
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> cards = [GameCard("A_spades", "spades", "A", 1),
            ...          GameCard("3_diamonds", "diamonds", "3", 3)]
            >>> logic.can_make_value_with_aces(cards, 4)
            True  # A(1) + 3 = 4
            >>> logic.can_make_value_with_aces(cards, 17)
            True  # A(14) + 3 = 17
        """
        if not cards:
            return target_value == 0
        
        # Try all card combinations
        for i in range(1, 2**len(cards)):
            combination = []
            for j in range(len(cards)):
                if i & (1 << j):
                    combination.append(cards[j])
            
            # For this combination, try all Ace value assignments
            if self._check_sum_with_ace_variations(combination, target_value):
                return True
        
        return False
    
    def _check_sum_with_ace_variations(self, cards: List[GameCard], target_value: int) -> bool:
        """
        Check if cards can sum to target with different Ace value assignments.
        
        Args:
            cards (list): List of cards in the combination
            target_value (int): Target sum to achieve
        
        Returns:
            bool: True if any Ace value assignment achieves the target
        """
        # Find all Aces in the combination
        ace_indices = [i for i, card in enumerate(cards) if card.rank == 'A']
        
        if not ace_indices:
            # No Aces, just sum normally
            return sum(card.value for card in cards) == target_value
        
        # Try all 2^n combinations of Ace values (1 or 14)
        for ace_combo in range(2**len(ace_indices)):
            total = 0
            for i, card in enumerate(cards):
                if card.rank == 'A':
                    # Find which Ace this is in our ace_indices list
                    ace_idx = ace_indices.index(i)
                    # Use 1 or 14 based on the bit
                    if ace_combo & (1 << ace_idx):
                        total += 14
                    else:
                        total += 1
                else:
                    total += card.value
            
            if total == target_value:
                return True
        
        return False
    
    def validate_component(
        self,
        component_cards: List[GameCard],
        target_value: int,
        hand_card: Optional[GameCard] = None
    ) -> Tuple[bool, Optional[str], Dict[str, int]]:
        """
        Validate that a component's cards sum to target value.
        
        Handles Ace dual values by trying all possible combinations.
        A component is valid if all its cards sum to the target value,
        considering Aces can be either 1 or 14.
        
        Args:
            component_cards: Cards in the component
            target_value: Required sum
            hand_card: If provided, must be included in component
        
        Returns:
            Tuple of (is_valid, error_message, ace_values_used)
            ace_values_used maps Ace card IDs to their used value (1 or 14)
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> cards = [GameCard("A_spades", "spades", "A", 1),
            ...          GameCard("3_diamonds", "diamonds", "3", 3)]
            >>> is_valid, error, ace_vals = logic.validate_component(cards, 4, None)
            >>> is_valid
            True
            >>> ace_vals
            {'A_spades': 1}
        """
        # Check for empty component
        if not component_cards:
            return False, "Component contains no cards", {}
        
        # If hand_card is provided, verify it's in the component
        if hand_card is not None:
            hand_card_ids = {hand_card.id}
            component_card_ids = {card.id for card in component_cards}
            if hand_card.id not in component_card_ids:
                return False, f"Hand card {hand_card.id} not found in component", {}
        
        # Find all Aces in the component
        ace_cards = [card for card in component_cards if card.rank == 'A']
        non_ace_cards = [card for card in component_cards if card.rank != 'A']
        
        # Calculate sum of non-Ace cards
        non_ace_sum = sum(card.value for card in non_ace_cards)
        
        # If no Aces, just check if sum matches
        if not ace_cards:
            actual_sum = non_ace_sum
            if actual_sum == target_value:
                return True, None, {}
            else:
                return False, f"Component sum {actual_sum} does not match target value {target_value}", {}
        
        # Try all 2^n combinations of Ace values (1 or 14)
        num_aces = len(ace_cards)
        for ace_combo in range(2**num_aces):
            total = non_ace_sum
            ace_values_used = {}
            
            for i, ace_card in enumerate(ace_cards):
                # Use 1 or 14 based on the bit
                if ace_combo & (1 << i):
                    ace_value = 14
                else:
                    ace_value = 1
                total += ace_value
                ace_values_used[ace_card.id] = ace_value
            
            if total == target_value:
                return True, None, ace_values_used
        
        # No valid Ace combination found
        return False, f"Component cards cannot sum to target value {target_value}", {}

    def validate_multi_component_build(
        self,
        hand_card: GameCard,
        components: List[List[GameCard]],
        build_value: int,
        player_hand: List[GameCard],
        table_cards: List[GameCard],
        target_builds: List[Build] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate if a multi-component build is legal.

        A multi-component build is valid if:
        1. Player has a capturing card in hand matching build_value
        2. Each component independently sums to build_value
        3. Hand card is included in exactly one component
        4. All component cards are available on table
        5. If augmenting, all target builds have matching value

        Args:
            hand_card: Card being played from hand
            components: List of card groups, each forming a component
            build_value: Declared value of the build
            player_hand: Player's complete hand
            table_cards: Cards currently on the table
            target_builds: Existing builds to augment (optional)

        Returns:
            Tuple of (is_valid, error_message)

        Example:
            >>> logic = CasinoGameLogic()
            >>> hand_card = GameCard("5_hearts", "hearts", "5", 5)
            >>> comp1 = [GameCard("3_spades", "spades", "3", 3),
            ...          GameCard("2_diamonds", "diamonds", "2", 2)]
            >>> comp2 = [hand_card]
            >>> player_hand = [hand_card, GameCard("5_clubs", "clubs", "5", 5)]
            >>> table_cards = [GameCard("3_spades", "spades", "3", 3),
            ...                GameCard("2_diamonds", "diamonds", "2", 2)]
            >>> is_valid, error = logic.validate_multi_component_build(
            ...     hand_card, [comp1, comp2], 5, player_hand, table_cards)
            >>> is_valid
            True
        """
        if target_builds is None:
            target_builds = []

        # Validate we have at least one component
        if not components:
            return False, "No components provided"

        # 1. Validate player has capturing card in hand matching build_value
        has_capturing_card = False
        for card in player_hand:
            if card.id != hand_card.id:
                card_values = self.get_card_values(card)
                if build_value in card_values:
                    has_capturing_card = True
                    break

        if not has_capturing_card:
            return False, f"No card in hand can capture build value {build_value}"

        # 5. If augmenting, validate all target builds have matching value
        if target_builds:
            for build in target_builds:
                if build.value != build_value:
                    return False, f"Target build has value {build.value}, expected {build_value}"

        # Track which component contains the hand card
        hand_card_component_count = 0

        # Create a set of available table card IDs for validation
        available_table_card_ids = {card.id for card in table_cards}

        # 2. Validate each component independently
        for i, component_cards in enumerate(components):
            # Validate component using validate_component
            is_valid, error_msg, ace_values = self.validate_component(
                component_cards,
                build_value,
                None  # Don't enforce hand_card presence here, we'll check separately
            )

            if not is_valid:
                return False, f"Component {i + 1}: {error_msg}"

            # 3. Check if hand card is in this component
            component_card_ids = {card.id for card in component_cards}
            if hand_card.id in component_card_ids:
                hand_card_component_count += 1

            # 4. Check all component cards are available on table (except hand card)
            for card in component_cards:
                if card.id != hand_card.id and card.id not in available_table_card_ids:
                    return False, f"Card {card.id} in component {i + 1} is not available on table"

        # 3. Ensure hand card is included in exactly one component
        if hand_card_component_count == 0:
            return False, "Hand card must be included in exactly one component"
        elif hand_card_component_count > 1:
            return False, f"Hand card appears in {hand_card_component_count} components, must be in exactly one"
        
        return True, None

    
    def execute_capture(self, hand_card: GameCard, target_cards: List[GameCard], target_builds: List[Build], all_builds: List[Build], player_id: int) -> Tuple[List[GameCard], List[Build], List[GameCard]]:
        """Execute a capture move
        
        Args:
            hand_card: The card being played from hand
            target_cards: Table cards being captured
            target_builds: Builds being captured (filtered list)
            all_builds: All builds on the table
            player_id: ID of the player making the capture
            
        Returns:
            Tuple of (captured_cards, remaining_builds, remaining_table_cards)
        """
        captured_cards = [hand_card]
        remaining_table_cards = []
        
        # Add target cards to captured pile
        for card in target_cards:
            captured_cards.append(card)
        
        # Add targeted build cards to captured pile
        target_build_ids = {build.id for build in target_builds}
        for build in target_builds:
            captured_cards.extend(build.cards)
        
        # Return all builds except the captured ones
        remaining_builds = [build for build in all_builds if build.id not in target_build_ids]
        
        return captured_cards, remaining_builds, remaining_table_cards
    
    def execute_build(self, hand_card: GameCard, target_cards: List[GameCard], build_value: int, player_id: int, target_builds: List[Build] = None) -> Tuple[List[GameCard], Build]:
        """Execute a build move"""
        if target_builds is None:
            target_builds = []

        # Remove target cards from table
        remaining_table_cards = []
        
        # Create new build cards list
        build_cards = [hand_card] + target_cards
        
        # Add cards from existing builds if any
        for build in target_builds:
            build_cards.extend(build.cards)

        # Create new build
        # If we are augmenting, we might want to keep the original owner? 
        # Standard rule: if you act on a build, you become the owner.
        build_id = f"build_{player_id}_{len(build_cards)}_{build_value}"
        # Make id unique if augmenting to avoid collisions or confusion, though purely internal ID
        if target_builds:
            build_id += "_aug"
            
        new_build = Build(id=build_id, cards=build_cards, value=build_value, owner=player_id)
        
        return remaining_table_cards, new_build
    
    def execute_multi_component_build(
        self,
        hand_card: GameCard,
        components: List[List[GameCard]],
        build_value: int,
        player_id: int,
        target_builds: List[Build] = None
    ) -> Tuple[List[GameCard], Build]:
        """
        Execute a multi-component build move.
        
        Creates a new Build object with component metadata. Each component is
        validated and stored with its ace_values_used mapping. All component
        cards are flattened into the build.cards list.
        
        When augmenting existing builds, the new components are merged with
        the existing build's components.
        
        Args:
            hand_card: Card being played from hand
            components: List of card groups forming components
            build_value: Build value
            player_id: Player creating the build
            target_builds: Existing builds to augment (optional)
        
        Returns:
            Tuple of (remaining_table_cards, new_build)
            
        Example:
            >>> logic = CasinoGameLogic()
            >>> hand_card = GameCard("5_hearts", "hearts", "5", 5)
            >>> comp1 = [GameCard("3_spades", "spades", "3", 3),
            ...          GameCard("2_diamonds", "diamonds", "2", 2)]
            >>> comp2 = [hand_card]
            >>> remaining, build = logic.execute_multi_component_build(
            ...     hand_card, [comp1, comp2], 5, 1)
            >>> build.is_multi_component
            True
            >>> len(build.components)
            2
        """
        if target_builds is None:
            target_builds = []
        
        # Create BuildComponent objects for each component
        build_components = []
        all_build_cards = []
        
        for component_cards in components:
            # Validate component and get ace values used
            is_valid, error_msg, ace_values_used = self.validate_component(
                component_cards,
                build_value,
                None
            )
            
            # Create BuildComponent with ace values
            component = BuildComponent(
                cards=component_cards,
                sum_value=build_value,
                ace_values_used=ace_values_used
            )
            build_components.append(component)
            
            # Add cards to flattened list
            all_build_cards.extend(component_cards)
        
        # If augmenting, merge with existing build components
        if target_builds:
            for build in target_builds:
                # Add existing build's components
                if build.components:
                    build_components.extend(build.components)
                else:
                    # Legacy build without components - create a single component
                    legacy_component = BuildComponent(
                        cards=build.cards,
                        sum_value=build.value,
                        ace_values_used={}
                    )
                    build_components.append(legacy_component)
                
                # Add existing build's cards to flattened list
                all_build_cards.extend(build.cards)
        
        # Generate unique build ID with timestamp to avoid collisions across turns
        import time
        build_id = f"build_{player_id}_{len(all_build_cards)}_{build_value}_{int(time.time() * 1000)}"
        if target_builds:
            build_id += "_aug"
        
        # Create new Build with component metadata
        new_build = Build(
            id=build_id,
            cards=all_build_cards,
            value=build_value,
            owner=player_id,
            components=build_components,
            is_multi_component=True
        )
        
        # Return empty list for remaining_table_cards (cards are removed by caller)
        remaining_table_cards = []
        
        return remaining_table_cards, new_build
    
    def execute_trail(self, hand_card: GameCard) -> List[GameCard]:
        """Execute a trail move - add card to table"""
        return [hand_card]

    def validate_table_build(self, target_cards: List[GameCard], build_value: int, player_hand: List[GameCard]) -> bool:
        """
        Validate if a table-only build is legal (non-standard rule).
        
        A table-only build combines table cards into a build WITHOUT playing a hand card.
        This does NOT consume a turn.
        
        Rules:
        1. Player must have a card in hand that can capture the build value
        2. Target cards must sum to the build value
        3. Must have at least 2 target cards
        
        Args:
            target_cards (list): Table cards to combine into build
            build_value (int): Declared value of the build
            player_hand (list): Player's hand (to verify capture card exists)
        
        Returns:
            bool: True if table-only build is valid, False otherwise
        """
        # Must have at least 2 cards to combine
        if len(target_cards) < 2:
            return False
        
        # Must have a card in hand to capture this build value
        has_capturing_card = False
        for card in player_hand:
            card_values = self.get_card_values(card)
            if build_value in card_values:
                has_capturing_card = True
                break
        
        if not has_capturing_card:
            return False
        
        # Target cards must sum to build value (considering Ace dual values)
        return self.can_make_value_with_aces(target_cards, build_value)
    
    def execute_table_build(self, target_cards: List[GameCard], build_value: int, player_id: int) -> Build:
        """
        Execute a table-only build (non-standard rule).
        
        Creates a build from table cards only, without playing a hand card.
        
        Args:
            target_cards (list): Table cards to combine
            build_value (int): Build value
            player_id (int): Player creating the build
        
        Returns:
            Build: The new build object
        """
        build_id = f"build_{player_id}_{len(target_cards)}_{build_value}_table"
        return Build(id=build_id, cards=target_cards, value=build_value, owner=player_id)

    
    def calculate_score(self, captured_cards: List[GameCard]) -> int:
        """
        Calculate base score from captured cards.
        
        Scoring rules:
        - Each Ace: 1 point (4 total possible)
        - 2 of Spades (Big Casino): 1 point
        - 10 of Diamonds (Little Casino): 2 points
        
        Bonus scores (most cards, most spades) are calculated separately.
        
        Args:
            captured_cards (list): List of GameCard objects captured by player
        
        Returns:
            int: Base score (0-7 points possible)
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> cards = [
            ...     GameCard("A_hearts", "hearts", "A", 14),
            ...     GameCard("A_spades", "spades", "A", 14),
            ...     GameCard("2_spades", "spades", "2", 2),
            ...     GameCard("10_diamonds", "diamonds", "10", 10)
            ... ]
            >>> logic.calculate_score(cards)
            5  # 2 aces + 1 for 2♠ + 2 for 10♦
        """
        score = 0
        
        # Count aces (1 point each)
        aces = sum(1 for card in captured_cards if card.rank == 'A')
        score += aces
        
        # 2 of spades (1 point)
        if any(card.rank == '2' and card.suit == 'spades' for card in captured_cards):
            score += 1
        
        # 10 of diamonds (2 points)
        if any(card.rank == '10' and card.suit == 'diamonds' for card in captured_cards):
            score += 2
        
        return score
    
    def calculate_bonus_scores(self, player1_captured: List[GameCard], player2_captured: List[GameCard]) -> Tuple[int, int]:
        """
        Calculate bonus scores for most cards and most spades.
        
        Bonus scoring rules:
        - Most Cards: 2 points (1 point each if tied)
        - Most Spades: 2 points (1 point each if tied)
        
        Args:
            player1_captured (list): Player 1's captured cards
            player2_captured (list): Player 2's captured cards
        
        Returns:
            tuple: (player1_bonus, player2_bonus) - bonus points for each player
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> p1_cards = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(1, 28)]
            >>> p2_cards = [GameCard(f"{i}_clubs", "clubs", str(i), i) for i in range(1, 26)]
            >>> logic.calculate_bonus_scores(p1_cards, p2_cards)
            (2, 0)  # Player 1 has most cards (27 > 25)
        """
        p1_cards = len(player1_captured)
        p2_cards = len(player2_captured)
        
        p1_spades = sum(1 for card in player1_captured if card.suit == 'spades')
        p2_spades = sum(1 for card in player2_captured if card.suit == 'spades')
        
        # Most cards bonus (2 points)
        p1_bonus = 0
        p2_bonus = 0
        
        if p1_cards > p2_cards:
            p1_bonus += 2
        elif p2_cards > p1_cards:
            p2_bonus += 2
        else:
            p1_bonus += 1
            p2_bonus += 1
        
        # Most spades bonus (2 points)
        if p1_spades > p2_spades:
            p1_bonus += 2
        elif p2_spades > p1_spades:
            p2_bonus += 2
        else:
            p1_bonus += 1
            p2_bonus += 1
        
        return p1_bonus, p2_bonus
    
    def determine_winner(self, player1_score: int, player2_score: int, player1_cards: int, player2_cards: int) -> Optional[int]:
        """
        Determine the winner based on final scores and tiebreaker rules.
        
        Winner determination:
        1. Player with higher score wins
        2. If scores tied, player with more captured cards wins
        3. If both tied, game is a draw (returns None)
        
        Args:
            player1_score (int): Player 1's final score
            player2_score (int): Player 2's final score
            player1_cards (int): Number of cards captured by player 1
            player2_cards (int): Number of cards captured by player 2
        
        Returns:
            int or None: 1 if player 1 wins, 2 if player 2 wins, None for tie
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> logic.determine_winner(8, 6, 27, 25)
            1  # Player 1 wins with higher score
            >>> logic.determine_winner(7, 7, 28, 24)
            1  # Tied score, player 1 wins with more cards
            >>> logic.determine_winner(7, 7, 26, 26)
            None  # Complete tie
        """
        if player1_score > player2_score:
            return 1
        elif player2_score > player1_score:
            return 2
        else:
            # Tie in score, check card count
            if player1_cards > player2_cards:
                return 1
            elif player2_cards > player1_cards:
                return 2
            else:
                return None  # Complete tie
    
    def is_round_complete(self, player1_hand: List[GameCard], player2_hand: List[GameCard]) -> bool:
        """Check if current round is complete (both players have no cards)"""
        return len(player1_hand) == 0 and len(player2_hand) == 0
    
    def is_game_complete(self, round_number: int, deck: List[GameCard], player1_hand: List[GameCard], player2_hand: List[GameCard]) -> bool:
        """Check if game is complete"""
        # Game is complete after 2 rounds or when no more cards to deal
        return round_number >= 2 or (len(deck) == 0 and len(player1_hand) == 0 and len(player2_hand) == 0)
    
    def get_playable_cards(self, player_hand: List[GameCard], table_cards: List[GameCard], builds: List[Build]) -> List[GameCard]:
        """Get cards that can be played (always all cards, but this could be extended for special rules)"""
        return player_hand
    
    def get_possible_captures(self, hand_card: GameCard, table_cards: List[GameCard], builds: List[Build]) -> List[GameCard]:
        """
        Get cards that can be captured with the given hand card.
        
        Note: Considers Ace dual values (1 and 14) for both hand card and table cards.
        """
        capturable = []
        hand_values = self.get_card_values(hand_card)
        
        # Direct matches (considering Ace dual values)
        for card in table_cards:
            card_values = self.get_card_values(card)
            # Check if any hand value matches any card value
            if any(hv in card_values for hv in hand_values):
                capturable.append(card)
        
        # Build matches
        for build in builds:
            if build.value in hand_values:
                capturable.extend(build.cards)
        
        return capturable
    
    def get_possible_builds(self, hand_card: GameCard, table_cards: List[GameCard], player_hand: List[GameCard]) -> List[Tuple[List[GameCard], int]]:
        """
        Get possible builds with the given hand card.
        
        Note: Considers Ace dual values (1 and 14) for hand card, table cards, and capturing cards.
        """
        possible_builds = []
        hand_values = self.get_card_values(hand_card)
        
        # Try different build values
        for build_value in range(2, 15):
            # Can't build same value as any of the hand card's values
            if build_value in hand_values:
                continue
            
            # Check if player has a card to capture this build (considering Ace dual values)
            has_capturing_card = False
            for card in player_hand:
                if card.id != hand_card.id:
                    card_values = self.get_card_values(card)
                    if build_value in card_values:
                        has_capturing_card = True
                        break
            
            if not has_capturing_card:
                continue
            
            # Try each possible hand card value
            for hand_value in hand_values:
                needed_value = build_value - hand_value
                if needed_value <= 0:
                    continue
                
                # Find combinations that make the needed value (considering Ace dual values)
                for i in range(1, 2**len(table_cards)):
                    combination = []
                    for j in range(len(table_cards)):
                        if i & (1 << j):
                            combination.append(table_cards[j])
                    
                    if self._check_sum_with_ace_variations(combination, needed_value):
                        # Avoid duplicates
                        combo_ids = tuple(sorted(c.id for c in combination))
                        if not any(tuple(sorted(c.id for c in existing[0])) == combo_ids and existing[1] == build_value 
                                   for existing in possible_builds):
                            possible_builds.append((combination, build_value))
        
        return possible_builds
