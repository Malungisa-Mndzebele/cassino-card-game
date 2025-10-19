"""
Casino Card Game Logic Implementation
Complete game mechanics for capture, build, trail, scoring, and win conditions
"""

import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

@dataclass
class GameCard:
    id: str
    suit: str
    rank: str
    value: int

@dataclass
class Build:
    id: str
    cards: List[GameCard]
    value: int
    owner: int

class CasinoGameLogic:
    """Complete Casino card game logic implementation"""
    
    def __init__(self):
        self.suits = ['hearts', 'diamonds', 'clubs', 'spades']
        self.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    
    def create_deck(self) -> List[GameCard]:
        """Create a shuffled deck of 52 cards"""
        deck = []
        for suit in self.suits:
            for rank in self.ranks:
                value = self.get_card_value(rank)
                card_id = f"{rank}_{suit}"
                deck.append(GameCard(id=card_id, suit=suit, rank=rank, value=value))
        
        random.shuffle(deck)
        return deck
    
    def get_card_value(self, rank: str) -> int:
        """Get numeric value of a card rank"""
        face_values = {'A': 14, 'K': 13, 'Q': 12, 'J': 11}
        if rank in face_values:
            return face_values[rank]
        return int(rank)
    
    def deal_initial_cards(self, deck: List[GameCard]) -> Tuple[List[GameCard], List[GameCard], List[GameCard], List[GameCard]]:
        """Deal initial cards: 4 to table, 4 to each player, rest to deck"""
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
        """Validate if a capture is legal"""
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
        """Validate if a build is legal"""
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
        """Check if cards can be combined to make target value"""
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
        """Calculate score from captured cards"""
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
        """Calculate bonus scores for most cards and most spades"""
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
        """Determine winner based on scores and card counts"""
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
