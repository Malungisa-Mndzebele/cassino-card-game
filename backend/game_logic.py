"""
Casino Card Game Logic Implementation
Complete game mechanics for capture, build, trail, scoring, and win conditions
"""

import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

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
class Build:
    """
    Represents a build combination in the game.
    
    A build is a combination of cards that can only be captured by a card matching
    the build's value. Builds are owned by the player who created them.
    
    Attributes:
        id (str): Unique build identifier
        cards (list): List of GameCard objects in the build
        value (int): Target value for capturing this build
        owner (int): Player ID who created the build
    """
    id: str
    cards: List[GameCard]
    value: int
    owner: int


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
    
    def validate_build(self, hand_card: GameCard, target_cards: List[GameCard], build_value: int, player_hand: List[GameCard]) -> bool:
        """
        Validate if a build move is legal.
        
        A build is valid if:
        1. Player has another card in hand that can capture the build
        2. Either:
           a. Target cards + hand card sum to build value (combining build)
           b. No target cards and hand card value equals build value (simple build)
        
        Note: Aces can be used as either 1 or 14 for builds.
        
        Args:
            hand_card (GameCard): Card being played from hand
            target_cards (list): Table cards to include in build (can be empty for simple build)
            build_value (int): Declared value of the build
            player_hand (list): Player's complete hand (to verify capture card exists)
        
        Returns:
            bool: True if build is valid, False otherwise
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> hand_card = GameCard("5_hearts", "hearts", "5", 5)
            >>> table = [GameCard("3_spades", "spades", "3", 3)]
            >>> player_hand = [hand_card, GameCard("8_clubs", "clubs", "8", 8)]
            >>> logic.validate_build(hand_card, table, 8, player_hand)
            True  # 5 + 3 = 8, and player has 8 to capture later
        """
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
    
    def execute_capture(self, hand_card: GameCard, target_cards: List[GameCard], builds: List[Build], player_id: int) -> Tuple[List[GameCard], List[Build], List[GameCard]]:
        """Execute a capture move"""
        captured_cards = [hand_card]
        remaining_table_cards = []
        remaining_builds = []
        
        # Add target cards to captured pile
        for card in target_cards:
            captured_cards.append(card)
        
        # Add build cards to captured pile and remove build
        for build in builds:
            if build.value == hand_card.value:
                captured_cards.extend(build.cards)
            else:
                remaining_builds.append(build)
        
        return captured_cards, remaining_builds, remaining_table_cards
    
    def execute_build(self, hand_card: GameCard, target_cards: List[GameCard], build_value: int, player_id: int) -> Tuple[List[GameCard], Build]:
        """Execute a build move"""
        # Remove target cards from table
        remaining_table_cards = []
        
        # Create new build
        build_cards = [hand_card] + target_cards
        build_id = f"build_{player_id}_{len(build_cards)}_{build_value}"
        new_build = Build(id=build_id, cards=build_cards, value=build_value, owner=player_id)
        
        return remaining_table_cards, new_build
    
    def execute_trail(self, hand_card: GameCard) -> List[GameCard]:
        """Execute a trail move - add card to table"""
        return [hand_card]
    
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
