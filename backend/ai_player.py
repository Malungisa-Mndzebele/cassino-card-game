"""
AI Player for Casino Card Game

Implements computer opponent logic with different difficulty levels.
The AI evaluates possible moves and selects the best action based on
game state analysis and strategic priorities.

Difficulty Levels:
    - easy: Random valid moves
    - medium: Basic strategy (prioritize captures)
    - hard: Advanced strategy (point optimization)
"""

import random
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from game_logic import CasinoGameLogic, GameCard, Build


@dataclass
class AIMove:
    """Represents a move decision by the AI"""
    action: str  # 'capture', 'build', 'trail'
    card_id: str
    target_cards: List[str]
    build_value: Optional[int] = None
    score: float = 0.0  # Move evaluation score


class AIPlayer:
    """
    AI opponent for single-player mode.
    
    Evaluates game state and selects optimal moves based on difficulty level.
    Uses the same game logic as human players for move validation.
    
    Attributes:
        difficulty (str): AI difficulty level (easy, medium, hard)
        game_logic (CasinoGameLogic): Game logic instance for validation
    """
    
    def __init__(self, difficulty: str = "medium"):
        self.difficulty = difficulty
        self.game_logic = CasinoGameLogic()
        
        # Point values for strategic evaluation
        self.card_points = {
            'A': 1,      # Aces worth 1 point each
            '2_spades': 1,  # Big Casino
            '10_diamonds': 2,  # Little Casino
        }
    
    def get_move(
        self,
        hand: List[Dict[str, Any]],
        table_cards: List[Dict[str, Any]],
        builds: List[Dict[str, Any]],
        opponent_hand_size: int,
        my_captured: List[Dict[str, Any]],
        opponent_captured: List[Dict[str, Any]]
    ) -> AIMove:
        """
        Determine the best move for the AI player.
        
        Args:
            hand: AI's current hand (list of card dicts)
            table_cards: Cards on the table
            builds: Current builds on table
            opponent_hand_size: Number of cards in opponent's hand
            my_captured: AI's captured cards
            opponent_captured: Opponent's captured cards
        
        Returns:
            AIMove: The selected move
        """
        # Convert dicts to GameCard objects
        hand_cards = self._to_game_cards(hand)
        table_game_cards = self._to_game_cards(table_cards)
        game_builds = self._to_builds(builds)
        
        # Get all possible moves
        possible_moves = self._get_all_possible_moves(
            hand_cards, table_game_cards, game_builds
        )
        
        if not possible_moves:
            # Should never happen, but fallback to trail
            return AIMove(
                action='trail',
                card_id=hand[0]['id'],
                target_cards=[]
            )
        
        # Select move based on difficulty
        if self.difficulty == "easy":
            return self._select_random_move(possible_moves)
        elif self.difficulty == "medium":
            return self._select_medium_move(possible_moves, my_captured)
        else:  # hard
            return self._select_hard_move(
                possible_moves, my_captured, opponent_captured,
                table_game_cards, opponent_hand_size
            )
    
    def _to_game_cards(self, cards: List[Dict[str, Any]]) -> List[GameCard]:
        """Convert card dictionaries to GameCard objects"""
        return [
            GameCard(
                id=c['id'],
                suit=c['suit'],
                rank=c['rank'],
                value=c.get('value', self.game_logic.get_card_value(c['rank']))
            )
            for c in cards
        ]
    
    def _to_builds(self, builds: List[Dict[str, Any]]) -> List[Build]:
        """Convert build dictionaries to Build objects"""
        return [
            Build(
                id=b['id'],
                cards=self._to_game_cards(b['cards']),
                value=b['value'],
                owner=b['owner']
            )
            for b in builds
        ]
    
    def _get_all_possible_moves(
        self,
        hand: List[GameCard],
        table_cards: List[GameCard],
        builds: List[Build]
    ) -> List[AIMove]:
        """Generate all valid moves for the current state"""
        moves = []
        
        for card in hand:
            # Check capture possibilities
            capture_moves = self._get_capture_moves(card, table_cards, builds)
            moves.extend(capture_moves)
            
            # Check build possibilities
            build_moves = self._get_build_moves(card, table_cards, hand)
            moves.extend(build_moves)
            
            # Trail is always possible
            moves.append(AIMove(
                action='trail',
                card_id=card.id,
                target_cards=[],
                score=0.0
            ))
        
        return moves
    
    def _get_capture_moves(
        self,
        hand_card: GameCard,
        table_cards: List[GameCard],
        builds: List[Build]
    ) -> List[AIMove]:
        """Get all valid capture moves for a hand card"""
        moves = []
        hand_values = self.game_logic.get_card_values(hand_card)
        
        # Direct card captures
        for table_card in table_cards:
            card_values = self.game_logic.get_card_values(table_card)
            if any(hv in card_values for hv in hand_values):
                moves.append(AIMove(
                    action='capture',
                    card_id=hand_card.id,
                    target_cards=[table_card.id],
                    score=self._evaluate_capture([table_card])
                ))
        
        # Multi-card captures (combinations that sum to hand card value)
        for hand_value in hand_values:
            combo_captures = self._find_sum_combinations(table_cards, hand_value)
            for combo in combo_captures:
                if len(combo) > 1:  # Only multi-card combos
                    moves.append(AIMove(
                        action='capture',
                        card_id=hand_card.id,
                        target_cards=[c.id for c in combo],
                        score=self._evaluate_capture(combo)
                    ))
        
        # Build captures
        for build in builds:
            if build.value in hand_values:
                moves.append(AIMove(
                    action='capture',
                    card_id=hand_card.id,
                    target_cards=[build.id],
                    score=self._evaluate_capture(build.cards) + 0.5  # Bonus for capturing builds
                ))
        
        return moves
    
    def _get_build_moves(
        self,
        hand_card: GameCard,
        table_cards: List[GameCard],
        full_hand: List[GameCard]
    ) -> List[AIMove]:
        """Get all valid build moves for a hand card"""
        moves = []
        possible_builds = self.game_logic.get_possible_builds(
            hand_card, table_cards, full_hand
        )
        
        for table_combo, build_value in possible_builds:
            moves.append(AIMove(
                action='build',
                card_id=hand_card.id,
                target_cards=[c.id for c in table_combo],
                build_value=build_value,
                score=self._evaluate_build(build_value, table_combo)
            ))
        
        return moves
    
    def _find_sum_combinations(
        self,
        cards: List[GameCard],
        target_sum: int
    ) -> List[List[GameCard]]:
        """Find all card combinations that sum to target value"""
        results = []
        
        for i in range(1, 2**len(cards)):
            combo = []
            for j in range(len(cards)):
                if i & (1 << j):
                    combo.append(cards[j])
            
            # Check if combo sums to target (considering Ace dual values)
            if self.game_logic._check_sum_with_ace_variations(combo, target_sum):
                results.append(combo)
        
        return results
    
    def _evaluate_capture(self, cards: List[GameCard]) -> float:
        """Evaluate the value of capturing specific cards"""
        score = len(cards) * 0.1  # Base score for card count
        
        for card in cards:
            # Aces
            if card.rank == 'A':
                score += 1.0
            # Big Casino (2 of spades)
            elif card.rank == '2' and card.suit == 'spades':
                score += 1.0
            # Little Casino (10 of diamonds)
            elif card.rank == '10' and card.suit == 'diamonds':
                score += 2.0
            # Spades (for most spades bonus)
            elif card.suit == 'spades':
                score += 0.2
        
        return score
    
    def _evaluate_build(self, build_value: int, table_cards: List[GameCard]) -> float:
        """Evaluate the value of creating a build"""
        score = 0.3  # Base score for building
        
        # Higher value builds are slightly better (harder to capture)
        score += build_value * 0.02
        
        # Evaluate cards being protected in the build
        score += self._evaluate_capture(table_cards) * 0.5
        
        return score
    
    def _select_random_move(self, moves: List[AIMove]) -> AIMove:
        """Easy difficulty: Select a random valid move"""
        return random.choice(moves)
    
    def _select_medium_move(
        self,
        moves: List[AIMove],
        my_captured: List[Dict[str, Any]]
    ) -> AIMove:
        """Medium difficulty: Prioritize captures over builds over trails"""
        # Separate moves by type
        captures = [m for m in moves if m.action == 'capture']
        builds = [m for m in moves if m.action == 'build']
        trails = [m for m in moves if m.action == 'trail']
        
        # Prefer captures
        if captures:
            # Sort by score and pick best
            captures.sort(key=lambda m: m.score, reverse=True)
            return captures[0]
        
        # Then builds
        if builds:
            builds.sort(key=lambda m: m.score, reverse=True)
            return builds[0]
        
        # Finally trail (pick lowest value card)
        trails.sort(key=lambda m: self._get_card_trail_priority(m.card_id))
        return trails[0]
    
    def _select_hard_move(
        self,
        moves: List[AIMove],
        my_captured: List[Dict[str, Any]],
        opponent_captured: List[Dict[str, Any]],
        table_cards: List[GameCard],
        opponent_hand_size: int
    ) -> AIMove:
        """Hard difficulty: Advanced strategic evaluation"""
        # Calculate current standings
        my_card_count = len(my_captured)
        opp_card_count = len(opponent_captured)
        my_spades = sum(1 for c in my_captured if c.get('suit') == 'spades')
        opp_spades = sum(1 for c in opponent_captured if c.get('suit') == 'spades')
        
        # Adjust scores based on game state
        for move in moves:
            adjusted_score = move.score
            
            if move.action == 'capture':
                # Bonus if we're behind on card count
                if my_card_count < opp_card_count:
                    adjusted_score += 0.3
                
                # Bonus for spades if we're behind
                if my_spades < opp_spades:
                    # Check if capture includes spades
                    target_ids = move.target_cards
                    for tc in table_cards:
                        if tc.id in target_ids and tc.suit == 'spades':
                            adjusted_score += 0.4
            
            elif move.action == 'build':
                # Penalize builds if opponent might capture
                if opponent_hand_size > 2:
                    adjusted_score -= 0.2
            
            elif move.action == 'trail':
                # Penalize trailing valuable cards
                adjusted_score -= 0.5
            
            move.score = adjusted_score
        
        # Sort by adjusted score
        moves.sort(key=lambda m: m.score, reverse=True)
        
        # Add some randomness to top moves (avoid being too predictable)
        top_moves = [m for m in moves if m.score >= moves[0].score - 0.3]
        return random.choice(top_moves[:3]) if len(top_moves) > 1 else moves[0]
    
    def _get_card_trail_priority(self, card_id: str) -> int:
        """Get priority for trailing a card (lower = trail first)"""
        # Parse card_id (format: "rank_suit")
        parts = card_id.rsplit('_', 1)
        if len(parts) != 2:
            return 50
        
        rank, suit = parts
        
        # Don't trail valuable cards
        if rank == 'A':
            return 100  # Never trail aces
        if rank == '2' and suit == 'spades':
            return 100  # Never trail Big Casino
        if rank == '10' and suit == 'diamonds':
            return 100  # Never trail Little Casino
        
        # Prefer trailing low cards
        value = self.game_logic.get_card_value(rank)
        
        # Slight penalty for spades
        if suit == 'spades':
            value += 5
        
        return value
