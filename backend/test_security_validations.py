"""
Tests for security validations in validators module.

Tests cover:
- Card integrity validation (duplication detection)
- Score integrity validation (manipulation detection)
- State transition validation (impossible transitions)
- Security event logging
"""

import pytest
from validators import (
    validate_card_integrity,
    validate_score_integrity,
    validate_state_transition,
    log_security_event,
    SecurityViolation
)


class TestCardIntegrityValidation:
    """Test card integrity validation to detect duplication attempts."""
    
    def test_valid_card_distribution(self):
        """Test that valid card distribution passes validation."""
        # Create valid card distribution (52 cards total)
        deck = [{"id": f"{r}_{s}", "rank": r, "suit": s} 
                for r in ['A', '2'] for s in ['hearts', 'diamonds']]  # 4 cards
        
        p1_hand = [{"id": f"{r}_{s}", "rank": r, "suit": s} 
                   for r in ['3', '4'] for s in ['hearts', 'diamonds']]  # 4 cards
        
        p2_hand = [{"id": f"{r}_{s}", "rank": r, "suit": s} 
                   for r in ['5', '6'] for s in ['hearts', 'diamonds']]  # 4 cards
        
        table = [{"id": f"{r}_{s}", "rank": r, "suit": s} 
                 for r in ['7', '8'] for s in ['hearts', 'diamonds']]  # 4 cards
        
        p1_captured = [{"id": f"{r}_{s}", "rank": r, "suit": s} 
                       for r in ['9', '10'] for s in ['hearts', 'diamonds']]  # 4 cards
        
        p2_captured = [{"id": f"{r}_{s}", "rank": r, "suit": s} 
                       for r in ['J', 'Q'] for s in ['hearts', 'diamonds']]  # 4 cards
        
        # Add remaining cards to deck to reach 52
        remaining_cards = []
        for r in ['K']:
            for s in ['hearts', 'diamonds']:
                remaining_cards.append({"id": f"{r}_{s}", "rank": r, "suit": s})
        for r in ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']:
            for s in ['clubs', 'spades']:
                remaining_cards.append({"id": f"{r}_{s}", "rank": r, "suit": s})
        
        deck.extend(remaining_cards)  # Add all remaining cards to deck (total 32)
        
        is_valid, violations = validate_card_integrity(
            "TEST01", 1, deck, p1_hand, p2_hand, table, p1_captured, p2_captured, []
        )
        
        assert is_valid
        assert len(violations) == 0
    
    def test_duplicate_card_detection(self):
        """Test that duplicate cards are detected."""
        # Create duplicate card
        duplicate_card = {"id": "A_hearts", "rank": "A", "suit": "hearts"}
        
        deck = [duplicate_card] * 2  # Duplicate in deck
        p1_hand = [{"id": "2_hearts", "rank": "2", "suit": "hearts"}]
        p2_hand = []
        table = []
        p1_captured = []
        p2_captured = []
        
        # Add more cards to reach 52 (but with duplicates)
        for i in range(50):
            deck.append({"id": f"3_hearts", "rank": "3", "suit": "hearts"})
        
        is_valid, violations = validate_card_integrity(
            "TEST01", 1, deck, p1_hand, p2_hand, table, p1_captured, p2_captured, []
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "card_duplication" for v in violations)
    
    def test_invalid_card_count(self):
        """Test that invalid total card count is detected."""
        # Create only 10 cards (should be 52)
        deck = [{"id": f"{i}_hearts", "rank": str(i), "suit": "hearts"} 
                for i in range(2, 12)]
        
        is_valid, violations = validate_card_integrity(
            "TEST01", 1, deck, [], [], [], [], [], []
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "invalid_card_count" for v in violations)
    
    def test_invalid_card_format(self):
        """Test that invalid card IDs are detected."""
        # Create cards with invalid format
        deck = [
            {"id": "invalid", "rank": "A", "suit": "hearts"},  # No underscore
            {"id": "X_hearts", "rank": "X", "suit": "hearts"},  # Invalid rank
            {"id": "A_invalid", "rank": "A", "suit": "invalid"}  # Invalid suit
        ]
        
        # Add valid cards to reach 52
        for r in ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']:
            for s in ['hearts', 'diamonds', 'clubs', 'spades']:
                if len(deck) < 52:
                    deck.append({"id": f"{r}_{s}", "rank": r, "suit": s})
        
        is_valid, violations = validate_card_integrity(
            "TEST01", 1, deck, [], [], [], [], [], []
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "invalid_card_format" for v in violations)
    
    def test_cards_in_builds(self):
        """Test that cards in builds are counted correctly."""
        # Create valid distribution with builds
        deck = []
        p1_hand = []
        p2_hand = []
        table = []
        p1_captured = []
        p2_captured = []
        
        # Create a build with 4 cards
        builds = [{
            "id": "build_1",
            "cards": [
                {"id": "A_hearts", "rank": "A", "suit": "hearts"},
                {"id": "2_hearts", "rank": "2", "suit": "hearts"},
                {"id": "3_hearts", "rank": "3", "suit": "hearts"},
                {"id": "4_hearts", "rank": "4", "suit": "hearts"}
            ],
            "value": 10,
            "owner": 1
        }]
        
        # Add remaining 48 cards to deck
        card_count = 4
        for r in ['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']:
            for s in ['hearts', 'diamonds', 'clubs', 'spades']:
                if card_count < 52:
                    deck.append({"id": f"{r}_{s}", "rank": r, "suit": s})
                    card_count += 1
        
        # Add more cards to reach exactly 52
        for r in ['A', '2', '3', '4']:
            for s in ['diamonds', 'clubs', 'spades']:
                if card_count < 52:
                    deck.append({"id": f"{r}_{s}", "rank": r, "suit": s})
                    card_count += 1
        
        is_valid, violations = validate_card_integrity(
            "TEST01", 1, deck, p1_hand, p2_hand, table, p1_captured, p2_captured, builds
        )
        
        assert is_valid
        assert len(violations) == 0


class TestScoreIntegrityValidation:
    """Test score integrity validation to detect manipulation."""
    
    def test_valid_scores(self):
        """Test that valid scores pass validation."""
        # Player 1 has 2 aces and 2 of spades = 3 points
        p1_captured = [
            {"id": "A_hearts", "rank": "A", "suit": "hearts"},
            {"id": "A_diamonds", "rank": "A", "suit": "diamonds"},
            {"id": "2_spades", "rank": "2", "suit": "spades"}
        ]
        
        # Player 2 has 10 of diamonds = 2 points
        p2_captured = [
            {"id": "10_diamonds", "rank": "10", "suit": "diamonds"}
        ]
        
        is_valid, violations = validate_score_integrity(
            "TEST01", 1, 3, 2, p1_captured, p2_captured
        )
        
        assert is_valid
        assert len(violations) == 0
    
    def test_score_too_high(self):
        """Test that inflated scores are detected."""
        # Player has only 1 ace but claims 10 points
        p1_captured = [
            {"id": "A_hearts", "rank": "A", "suit": "hearts"}
        ]
        p2_captured = []
        
        is_valid, violations = validate_score_integrity(
            "TEST01", 1, 10, 0, p1_captured, p2_captured
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "score_too_high" for v in violations)
    
    def test_score_too_low(self):
        """Test that deflated scores are detected."""
        # Player has 4 aces but claims 0 points
        p1_captured = [
            {"id": "A_hearts", "rank": "A", "suit": "hearts"},
            {"id": "A_diamonds", "rank": "A", "suit": "diamonds"},
            {"id": "A_clubs", "rank": "A", "suit": "clubs"},
            {"id": "A_spades", "rank": "A", "suit": "spades"}
        ]
        p2_captured = []
        
        is_valid, violations = validate_score_integrity(
            "TEST01", 1, 0, 0, p1_captured, p2_captured
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "score_too_low" for v in violations)
    
    def test_negative_score(self):
        """Test that negative scores are detected."""
        p1_captured = []
        p2_captured = []
        
        is_valid, violations = validate_score_integrity(
            "TEST01", 1, -5, 0, p1_captured, p2_captured
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "invalid_score_range" for v in violations)
    
    def test_score_out_of_range(self):
        """Test that scores above maximum are detected."""
        p1_captured = []
        p2_captured = []
        
        is_valid, violations = validate_score_integrity(
            "TEST01", 1, 100, 0, p1_captured, p2_captured
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "invalid_score_range" for v in violations)
    
    def test_score_with_bonuses(self):
        """Test that scores with bonuses are accepted."""
        # Player has 2 aces (2 points) + bonuses (up to 4) = max 6
        p1_captured = [
            {"id": "A_hearts", "rank": "A", "suit": "hearts"},
            {"id": "A_diamonds", "rank": "A", "suit": "diamonds"}
        ]
        p2_captured = []
        
        # Score of 6 should be valid (2 base + 4 bonus)
        is_valid, violations = validate_score_integrity(
            "TEST01", 1, 6, 0, p1_captured, p2_captured
        )
        
        assert is_valid
        assert len(violations) == 0


class TestStateTransitionValidation:
    """Test state transition validation to detect impossible transitions."""
    
    def test_valid_phase_transition(self):
        """Test that valid phase transitions pass validation."""
        # waiting -> cardSelection is valid
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "waiting", "cardSelection", 0, 0
        )
        
        assert is_valid
        assert len(violations) == 0
    
    def test_invalid_phase_transition(self):
        """Test that invalid phase transitions are detected."""
        # waiting -> round2 is invalid (skips phases)
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "waiting", "round2", 0, 2
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "invalid_phase_transition" for v in violations)
    
    def test_round_number_decrease(self):
        """Test that round number decreases are detected."""
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "round2", "round1", 2, 1
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "round_number_decreased" for v in violations)
    
    def test_round_number_skip(self):
        """Test that skipping round numbers is detected."""
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "round1", "finished", 0, 3
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "round_number_skipped" for v in violations)
    
    def test_valid_round_progression(self):
        """Test that valid round progression passes validation."""
        # round1 -> round2 with round 0 -> 1 is valid
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "round1", "round2", 0, 1
        )
        
        assert is_valid
        assert len(violations) == 0
    
    def test_invalid_round_change_phase(self):
        """Test that round changes during invalid phases are detected."""
        # Round shouldn't change during waiting phase
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "waiting", "waiting", 0, 1
        )
        
        assert not is_valid
        assert len(violations) > 0
        assert any(v.violation_type == "invalid_round_change" for v in violations)
    
    def test_multiple_violations(self):
        """Test that multiple violations are detected."""
        # Invalid phase transition AND round decrease
        is_valid, violations = validate_state_transition(
            "TEST01", 1, "round2", "waiting", 2, 0
        )
        
        assert not is_valid
        assert len(violations) >= 2


class TestSecurityEventLogging:
    """Test security event logging functionality."""
    
    def test_log_critical_violations(self):
        """Test that critical violations are logged."""
        violations = [
            SecurityViolation(
                violation_type="card_duplication",
                severity="critical",
                description="Duplicate cards detected",
                details={"duplicates": {"A_hearts": 2}}
            )
        ]
        
        # Should not raise exception
        log_security_event("TEST01", 1, violations)
    
    def test_log_multiple_severity_levels(self):
        """Test that violations of different severities are logged."""
        violations = [
            SecurityViolation(
                violation_type="card_duplication",
                severity="critical",
                description="Critical violation"
            ),
            SecurityViolation(
                violation_type="score_too_high",
                severity="high",
                description="High severity violation"
            ),
            SecurityViolation(
                violation_type="minor_issue",
                severity="medium",
                description="Medium severity violation"
            ),
            SecurityViolation(
                violation_type="info",
                severity="low",
                description="Low severity violation"
            )
        ]
        
        # Should not raise exception
        log_security_event("TEST01", 1, violations)
    
    def test_log_empty_violations(self):
        """Test that logging empty violations list doesn't error."""
        # Should not raise exception
        log_security_event("TEST01", 1, [])


class TestSecurityViolationClass:
    """Test SecurityViolation class."""
    
    def test_create_violation(self):
        """Test creating a security violation."""
        violation = SecurityViolation(
            violation_type="test_violation",
            severity="high",
            description="Test description",
            details={"key": "value"}
        )
        
        assert violation.violation_type == "test_violation"
        assert violation.severity == "high"
        assert violation.description == "Test description"
        assert violation.details == {"key": "value"}
        assert violation.timestamp is not None
    
    def test_create_violation_without_details(self):
        """Test creating a violation without details."""
        violation = SecurityViolation(
            violation_type="test_violation",
            severity="low",
            description="Test description"
        )
        
        assert violation.details == {}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
