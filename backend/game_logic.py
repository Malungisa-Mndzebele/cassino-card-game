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
        Get numeric value of a card rank for game logic.
        
        Converts card ranks to numeric values used in capture and build calculations.
        Face cards have special values: A=14, K=13, Q=12, J=11.
        
        Args:
            rank (str): Card rank (A, 2-10, J, Q, K)
        
        Returns:
            int: Numeric value of the rank
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> logic.get_card_value('A')
            14
            >>> logic.get_card_value('K')
            13
            >>> logic.get_card_value('7')
            7
        """
        face_values = {'A': 14, 'K': 13, 'Q': 12, 'J': 11}
        if rank in face_values:
            return face_values[rank]
        return int(rank)
    
    def deal_initial_cards(self, deck: List[GameCard]) -> Tuple[List[GameCard], List[GameCard], List[GameCard], List[GameCard]]:
        """
        Deal initial cards for game start.
        
        Deals 4 cards to the table, 4 cards to each player, and returns the
        remaining deck for round 2 dealing.
        
        Args:
            deck (list): Full shuffled deck of 52 cards
        
        Returns:
            tuple: (table_cards, player1_hand, player2_hand, remaining_deck)
                - table_cards: 4 cards placed on table
                - player1_hand: 4 cards for player 1
                - player2_hand: 4 cards for player 2
                - remaining_deck: 40 remaining cards
        
        Raises:
            ValueError: If deck has fewer than 12 cards
        
        Example:
            >>> logic = CasinoGameLogic()
            >>> deck = logic.create_deck()
            >>> table, p1, p2, remaining = logic.deal_initial_cards(deck)
            >>> len(table), len(p1), len(p2), len(remaining)
            (4, 4, 4, 40)
        """
        if len(deck) < 12:
            raise ValueError("Not enough cards in deck")
        
        table_cards = deck[:4]
        player1_hand = deck[4:8]
        player2_hand = deck[8:12]
        remaining_deck = deck[12:]
        
        return table_cards, player1_hand, player2_hand, remaining_deck
    
    def deal_round_cards(self, deck: List[GameCard], player1_hand: List[GameCard], player2_hand: List[GameCard]) -> Tuple[List[GameCard], List[GameCard], List[GameCard]]:
        """Deal 4 more cards to each player for round 2"""
        if len(deck) < 8:
            # Not enough cards for full deal, deal what we can
            cards_to_deal = len(deck)
            cards_per_player = cards_to_deal // 2
            
            new_p1_cards = deck[:cards_per_player]
            new_p2_cards = deck[cards_per_player:cards_per_player*2]
            remaining_deck = deck[cards_per_player*2:]
        else:
            new_p1_cards = deck[:4]
            new_p2_cards = deck[4:8]
            remaining_deck = deck[8:]
        
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
        hand_value = hand_card.value
        
        # Check direct table card matches
        for card in target_cards:
            if card.value == hand_value:
                return True
        
        # Check if target cards can sum to hand card value
        if self.can_make_value(target_cards, hand_value):
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
        1. Build value differs from hand card value
        2. Player has another card in hand that can capture the build
        3. Target cards + hand card sum to build value
        
        Args:
            hand_card (GameCard): Card being played from hand
            target_cards (list): Table cards to include in build
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
        # Can't build same value as hand card
        if hand_card.value == build_value:
            return False
        
        # Must have cards to capture the build value
        has_capturing_card = any(card.value == build_value and card.id != hand_card.id for card in player_hand)
        if not has_capturing_card:
            return False
        
        # Check if target cards can sum to (build_value - hand_card.value)
        needed_value = build_value - hand_card.value
        if needed_value <= 0:
            return False
        
        # Check if we can make the needed value with target cards
        return self.can_make_value(target_cards, needed_value)
    
    def can_make_value(self, cards: List[GameCard], target_value: int) -> bool:
        """
        Check if any combination of cards sums to target value.
        
        Uses bit manipulation to try all possible combinations of cards and checks
        if any combination sums to the target value. This is used for validating
        captures and builds.
        
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
        """Get cards that can be captured with the given hand card"""
        capturable = []
        
        # Direct matches
        for card in table_cards:
            if card.value == hand_card.value:
                capturable.append(card)
        
        # Build matches
        for build in builds:
            if build.value == hand_card.value:
                capturable.extend(build.cards)
        
        return capturable
    
    def get_possible_builds(self, hand_card: GameCard, table_cards: List[GameCard], player_hand: List[GameCard]) -> List[Tuple[List[GameCard], int]]:
        """Get possible builds with the given hand card"""
        possible_builds = []
        
        # Try different build values
        for build_value in range(2, 15):
            if build_value == hand_card.value:
                continue
            
            # Check if player has a card to capture this build
            has_capturing_card = any(card.value == build_value and card.id != hand_card.id for card in player_hand)
            if not has_capturing_card:
                continue
            
            # Check if we can make the needed value
            needed_value = build_value - hand_card.value
            if needed_value <= 0:
                continue
            
            # Find combinations that make the needed value
            for i in range(1, 2**len(table_cards)):
                combination = []
                for j in range(len(table_cards)):
                    if i & (1 << j):
                        combination.append(table_cards[j])
                
                if sum(card.value for card in combination) == needed_value:
                    possible_builds.append((combination, build_value))
        
        return possible_builds
