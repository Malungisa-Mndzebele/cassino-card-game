"""
Comprehensive tests for game_logic.py - Target: 100% coverage
Tests all functions, edge cases, and error conditions
"""
import pytest
from game_logic import CasinoGameLogic, GameCard, Build


class TestGameCard:
    """Test GameCard dataclass"""
    
    def test_game_card_creation(self):
        """Test creating a GameCard"""
        card = GameCard(id="A_hearts", suit="hearts", rank="A", value=14)
        assert card.id == "A_hearts"
        assert card.suit == "hearts"
        assert card.rank == "A"
        assert card.value == 14


class TestBuild:
    """Test Build dataclass"""
    
    def test_build_creation(self):
        """Test creating a Build"""
        cards = [GameCard("3_hearts", "hearts", "3", 3)]
        build = Build(id="build_1", cards=cards, value=8, owner=1)
        assert build.id == "build_1"
        assert len(build.cards) == 1
        assert build.value == 8
        assert build.owner == 1


class TestCasinoGameLogicInit:
    """Test CasinoGameLogic initialization"""
    
    def test_init_creates_suits(self):
        """Test initialization creates correct suits"""
        logic = CasinoGameLogic()
        assert logic.suits == ['hearts', 'diamonds', 'clubs', 'spades']
    
    def test_init_creates_ranks(self):
        """Test initialization creates correct ranks"""
        logic = CasinoGameLogic()
        assert logic.ranks == ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']


class TestCreateDeck:
    """Test create_deck method"""
    
    def test_create_deck_size(self):
        """Test deck has 52 cards"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        assert len(deck) == 52
    
    def test_create_deck_all_suits(self):
        """Test deck contains all four suits"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        suits = set(card.suit for card in deck)
        assert suits == {'hearts', 'diamonds', 'clubs', 'spades'}
    
    def test_create_deck_all_ranks(self):
        """Test deck contains all ranks"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        ranks = set(card.rank for card in deck)
        expected = {'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'}
        assert ranks == expected
    
    def test_create_deck_13_cards_per_suit(self):
        """Test each suit has 13 cards"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        for suit in ['hearts', 'diamonds', 'clubs', 'spades']:
            suit_cards = [c for c in deck if c.suit == suit]
            assert len(suit_cards) == 13
    
    def test_create_deck_4_cards_per_rank(self):
        """Test each rank has 4 cards"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        for rank in ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']:
            rank_cards = [c for c in deck if c.rank == rank]
            assert len(rank_cards) == 4
    
    def test_create_deck_unique_ids(self):
        """Test all card IDs are unique"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        ids = [card.id for card in deck]
        assert len(ids) == len(set(ids))


class TestGetCardValue:
    """Test get_card_value method"""
    
    def test_ace_value(self):
        """Test Ace has value 14"""
        logic = CasinoGameLogic()
        assert logic.get_card_value('A') == 14
    
    def test_king_value(self):
        """Test King has value 13"""
        logic = CasinoGameLogic()
        assert logic.get_card_value('K') == 13
    
    def test_queen_value(self):
        """Test Queen has value 12"""
        logic = CasinoGameLogic()
        assert logic.get_card_value('Q') == 12
    
    def test_jack_value(self):
        """Test Jack has value 11"""
        logic = CasinoGameLogic()
        assert logic.get_card_value('J') == 11
    
    def test_number_card_values(self):
        """Test number cards have face value"""
        logic = CasinoGameLogic()
        for i in range(2, 11):
            assert logic.get_card_value(str(i)) == i


class TestDealInitialCards:
    """Test deal_initial_cards method"""
    
    def test_deal_initial_cards_correct_counts(self):
        """Test dealing creates correct card counts"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        table, p1, p2, remaining = logic.deal_initial_cards(deck)
        
        assert len(table) == 4
        assert len(p1) == 4
        assert len(p2) == 4
        assert len(remaining) == 40
    
    def test_deal_initial_cards_total_52(self):
        """Test all 52 cards are accounted for"""
        logic = CasinoGameLogic()
        deck = logic.create_deck()
        table, p1, p2, remaining = logic.deal_initial_cards(deck)
        
        total = len(table) + len(p1) + len(p2) + len(remaining)
        assert total == 52
    
    def test_deal_initial_cards_insufficient_deck(self):
        """Test error when deck has too few cards"""
        logic = CasinoGameLogic()
        small_deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(1, 10)]
        
        with pytest.raises(ValueError, match="Not enough cards in deck"):
            logic.deal_initial_cards(small_deck)
    
    def test_deal_initial_cards_exactly_12(self):
        """Test dealing with exactly 12 cards"""
        logic = CasinoGameLogic()
        deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(1, 13)]
        table, p1, p2, remaining = logic.deal_initial_cards(deck)
        
        assert len(table) == 4
        assert len(p1) == 4
        assert len(p2) == 4
        assert len(remaining) == 0


class TestDealRoundCards:
    """Test deal_round_cards method"""
    
    def test_deal_round_cards_normal(self):
        """Test dealing round 2 cards normally"""
        logic = CasinoGameLogic()
        deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(1, 21)]
        p1_hand = []
        p2_hand = []
        
        p1, p2, remaining = logic.deal_round_cards(deck, p1_hand, p2_hand)
        
        assert len(p1) == 4
        assert len(p2) == 4
        assert len(remaining) == 12
    
    def test_deal_round_cards_insufficient_deck(self):
        """Test dealing with insufficient cards"""
        logic = CasinoGameLogic()
        deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(1, 7)]
        p1_hand = []
        p2_hand = []
        
        p1, p2, remaining = logic.deal_round_cards(deck, p1_hand, p2_hand)
        
        assert len(p1) == 3
        assert len(p2) == 3
        assert len(remaining) == 0
    
    def test_deal_round_cards_extends_existing_hands(self):
        """Test dealing extends existing hands"""
        logic = CasinoGameLogic()
        deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(1, 9)]
        p1_hand = [GameCard("K_spades", "spades", "K", 13)]
        p2_hand = [GameCard("Q_spades", "spades", "Q", 12)]
        
        p1, p2, remaining = logic.deal_round_cards(deck, p1_hand, p2_hand)
        
        assert len(p1) == 5  # 1 existing + 4 new
        assert len(p2) == 5  # 1 existing + 4 new


class TestCanMakeValue:
    """Test can_make_value method"""
    
    def test_can_make_value_single_card(self):
        """Test making value with single card"""
        logic = CasinoGameLogic()
        cards = [GameCard("5_hearts", "hearts", "5", 5)]
        assert logic.can_make_value(cards, 5) is True
    
    def test_can_make_value_two_cards(self):
        """Test making value with two cards"""
        logic = CasinoGameLogic()
        cards = [
            GameCard("3_hearts", "hearts", "3", 3),
            GameCard("5_spades", "spades", "5", 5)
        ]
        assert logic.can_make_value(cards, 8) is True
    
    def test_can_make_value_three_cards(self):
        """Test making value with three cards"""
        logic = CasinoGameLogic()
        cards = [
            GameCard("2_hearts", "hearts", "2", 2),
            GameCard("3_spades", "spades", "3", 3),
            GameCard("5_diamonds", "diamonds", "5", 5)
        ]
        assert logic.can_make_value(cards, 10) is True
    
    def test_can_make_value_impossible(self):
        """Test impossible value"""
        logic = CasinoGameLogic()
        cards = [
            GameCard("2_hearts", "hearts", "2", 2),
            GameCard("3_spades", "spades", "3", 3)
        ]
        assert logic.can_make_value(cards, 10) is False
    
    def test_can_make_value_empty_cards(self):
        """Test with empty card list"""
        logic = CasinoGameLogic()
        assert logic.can_make_value([], 0) is True
        assert logic.can_make_value([], 5) is False


class TestValidateCapture:
    """Test validate_capture method"""
    
    def test_validate_capture_direct_match(self):
        """Test capture with direct value match"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [GameCard("5_spades", "spades", "5", 5)]
        
        assert logic.validate_capture(hand_card, table, []) is True
    
    def test_validate_capture_sum_match(self):
        """Test capture with sum of cards"""
        logic = CasinoGameLogic()
        hand_card = GameCard("8_hearts", "hearts", "8", 8)
        table = [
            GameCard("3_spades", "spades", "3", 3),
            GameCard("5_diamonds", "diamonds", "5", 5)
        ]
        
        assert logic.validate_capture(hand_card, table, []) is True
    
    def test_validate_capture_build_match(self):
        """Test capture matching a build"""
        logic = CasinoGameLogic()
        hand_card = GameCard("8_hearts", "hearts", "8", 8)
        build_cards = [GameCard("3_spades", "spades", "3", 3)]
        build = Build("build_1", build_cards, 8, 1)
        
        assert logic.validate_capture(hand_card, [], [build]) is True
    
    def test_validate_capture_no_match(self):
        """Test invalid capture"""
        logic = CasinoGameLogic()
        hand_card = GameCard("10_hearts", "hearts", "10", 10)
        table = [
            GameCard("3_spades", "spades", "3", 3),
            GameCard("5_diamonds", "diamonds", "5", 5)
        ]
        
        assert logic.validate_capture(hand_card, table, []) is False


class TestValidateBuild:
    """Test validate_build method"""
    
    def test_validate_build_valid(self):
        """Test valid build"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [GameCard("3_spades", "spades", "3", 3)]
        player_hand = [
            hand_card,
            GameCard("8_clubs", "clubs", "8", 8)
        ]
        
        assert logic.validate_build(hand_card, table, 8, player_hand) is True
    
    def test_validate_build_same_value_as_hand(self):
        """Test build with same value as hand card (invalid)"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [GameCard("3_spades", "spades", "3", 3)]
        player_hand = [hand_card]
        
        assert logic.validate_build(hand_card, table, 5, player_hand) is False
    
    def test_validate_build_no_capturing_card(self):
        """Test build without capturing card in hand"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [GameCard("3_spades", "spades", "3", 3)]
        player_hand = [hand_card]
        
        assert logic.validate_build(hand_card, table, 8, player_hand) is False
    
    def test_validate_build_negative_needed_value(self):
        """Test build with negative needed value"""
        logic = CasinoGameLogic()
        hand_card = GameCard("10_hearts", "hearts", "10", 10)
        table = [GameCard("3_spades", "spades", "3", 3)]
        player_hand = [
            hand_card,
            GameCard("8_clubs", "clubs", "8", 8)
        ]
        
        assert logic.validate_build(hand_card, table, 8, player_hand) is False


class TestExecuteCapture:
    """Test execute_capture method"""
    
    def test_execute_capture_simple(self):
        """Test executing a simple capture"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        target = [GameCard("5_spades", "spades", "5", 5)]
        
        captured, remaining_builds, remaining_table = logic.execute_capture(
            hand_card, target, [], 1
        )
        
        assert len(captured) == 2
        assert hand_card in captured
        assert target[0] in captured
    
    def test_execute_capture_with_build(self):
        """Test capturing a build"""
        logic = CasinoGameLogic()
        hand_card = GameCard("8_hearts", "hearts", "8", 8)
        build_cards = [
            GameCard("3_spades", "spades", "3", 3),
            GameCard("5_diamonds", "diamonds", "5", 5)
        ]
        build = Build("build_1", build_cards, 8, 1)
        
        captured, remaining_builds, remaining_table = logic.execute_capture(
            hand_card, [], [build], 1
        )
        
        assert len(captured) == 3  # hand card + 2 build cards
        assert len(remaining_builds) == 0


class TestExecuteBuild:
    """Test execute_build method"""
    
    def test_execute_build(self):
        """Test executing a build"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        target = [GameCard("3_spades", "spades", "3", 3)]
        
        remaining_table, new_build = logic.execute_build(hand_card, target, 8, 1)
        
        assert new_build.value == 8
        assert new_build.owner == 1
        assert len(new_build.cards) == 2
        assert hand_card in new_build.cards
        assert target[0] in new_build.cards


class TestExecuteTrail:
    """Test execute_trail method"""
    
    def test_execute_trail(self):
        """Test executing a trail"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        
        result = logic.execute_trail(hand_card)
        
        assert len(result) == 1
        assert result[0] == hand_card


class TestCalculateScore:
    """Test calculate_score method"""
    
    def test_calculate_score_aces(self):
        """Test scoring with aces"""
        logic = CasinoGameLogic()
        cards = [
            GameCard("A_hearts", "hearts", "A", 14),
            GameCard("A_spades", "spades", "A", 14)
        ]
        
        assert logic.calculate_score(cards) == 2
    
    def test_calculate_score_big_casino(self):
        """Test scoring 2 of spades"""
        logic = CasinoGameLogic()
        cards = [GameCard("2_spades", "spades", "2", 2)]
        
        assert logic.calculate_score(cards) == 1
    
    def test_calculate_score_little_casino(self):
        """Test scoring 10 of diamonds"""
        logic = CasinoGameLogic()
        cards = [GameCard("10_diamonds", "diamonds", "10", 10)]
        
        assert logic.calculate_score(cards) == 2
    
    def test_calculate_score_all_special(self):
        """Test scoring all special cards"""
        logic = CasinoGameLogic()
        cards = [
            GameCard("A_hearts", "hearts", "A", 14),
            GameCard("A_spades", "spades", "A", 14),
            GameCard("A_diamonds", "diamonds", "A", 14),
            GameCard("A_clubs", "clubs", "A", 14),
            GameCard("2_spades", "spades", "2", 2),
            GameCard("10_diamonds", "diamonds", "10", 10)
        ]
        
        assert logic.calculate_score(cards) == 7  # 4 aces + 1 for 2♠ + 2 for 10♦
    
    def test_calculate_score_no_special(self):
        """Test scoring with no special cards"""
        logic = CasinoGameLogic()
        cards = [
            GameCard("3_hearts", "hearts", "3", 3),
            GameCard("5_spades", "spades", "5", 5)
        ]
        
        assert logic.calculate_score(cards) == 0


class TestCalculateBonusScores:
    """Test calculate_bonus_scores method"""
    
    def test_bonus_most_cards_p1(self):
        """Test bonus for player 1 having most cards"""
        logic = CasinoGameLogic()
        p1_cards = [GameCard(f"{i}_hearts", "hearts", str(i % 13 + 1), i % 13 + 1) for i in range(30)]
        p2_cards = [GameCard(f"{i}_clubs", "clubs", str(i % 13 + 1), i % 13 + 1) for i in range(22)]
        
        p1_bonus, p2_bonus = logic.calculate_bonus_scores(p1_cards, p2_cards)
        
        assert p1_bonus >= 2  # At least most cards bonus
    
    def test_bonus_most_cards_p2(self):
        """Test bonus for player 2 having most cards"""
        logic = CasinoGameLogic()
        p1_cards = [GameCard(f"{i}_hearts", "hearts", str(i % 13 + 1), i % 13 + 1) for i in range(20)]
        p2_cards = [GameCard(f"{i}_clubs", "clubs", str(i % 13 + 1), i % 13 + 1) for i in range(32)]
        
        p1_bonus, p2_bonus = logic.calculate_bonus_scores(p1_cards, p2_cards)
        
        assert p2_bonus >= 2  # At least most cards bonus
    
    def test_bonus_tied_cards(self):
        """Test bonus when card count is tied"""
        logic = CasinoGameLogic()
        p1_cards = [GameCard(f"{i}_hearts", "hearts", str(i % 13 + 1), i % 13 + 1) for i in range(26)]
        p2_cards = [GameCard(f"{i}_clubs", "clubs", str(i % 13 + 1), i % 13 + 1) for i in range(26)]
        
        p1_bonus, p2_bonus = logic.calculate_bonus_scores(p1_cards, p2_cards)
        
        # Each gets 1 point for tied cards
        assert p1_bonus >= 1
        assert p2_bonus >= 1
    
    def test_bonus_most_spades(self):
        """Test bonus for most spades"""
        logic = CasinoGameLogic()
        p1_cards = [GameCard(f"{i}_spades", "spades", str(i % 13 + 1), i % 13 + 1) for i in range(8)]
        p2_cards = [GameCard(f"{i}_spades", "spades", str(i % 13 + 1), i % 13 + 1) for i in range(5)]
        
        p1_bonus, p2_bonus = logic.calculate_bonus_scores(p1_cards, p2_cards)
        
        # P1 should get spades bonus
        assert p1_bonus >= 2


class TestDetermineWinner:
    """Test determine_winner method"""
    
    def test_winner_by_score_p1(self):
        """Test player 1 wins by score"""
        logic = CasinoGameLogic()
        assert logic.determine_winner(10, 8, 26, 26) == 1
    
    def test_winner_by_score_p2(self):
        """Test player 2 wins by score"""
        logic = CasinoGameLogic()
        assert logic.determine_winner(7, 9, 26, 26) == 2
    
    def test_winner_by_cards_p1(self):
        """Test player 1 wins by card count (tied score)"""
        logic = CasinoGameLogic()
        assert logic.determine_winner(8, 8, 30, 22) == 1
    
    def test_winner_by_cards_p2(self):
        """Test player 2 wins by card count (tied score)"""
        logic = CasinoGameLogic()
        assert logic.determine_winner(8, 8, 20, 32) == 2
    
    def test_complete_tie(self):
        """Test complete tie"""
        logic = CasinoGameLogic()
        assert logic.determine_winner(8, 8, 26, 26) is None


class TestRoundAndGameCompletion:
    """Test round and game completion checks"""
    
    def test_is_round_complete_true(self):
        """Test round is complete when both hands empty"""
        logic = CasinoGameLogic()
        assert logic.is_round_complete([], []) is True
    
    def test_is_round_complete_false_p1_has_cards(self):
        """Test round not complete when p1 has cards"""
        logic = CasinoGameLogic()
        p1_hand = [GameCard("5_hearts", "hearts", "5", 5)]
        assert logic.is_round_complete(p1_hand, []) is False
    
    def test_is_round_complete_false_p2_has_cards(self):
        """Test round not complete when p2 has cards"""
        logic = CasinoGameLogic()
        p2_hand = [GameCard("5_hearts", "hearts", "5", 5)]
        assert logic.is_round_complete([], p2_hand) is False
    
    def test_is_game_complete_round_2(self):
        """Test game complete after round 2"""
        logic = CasinoGameLogic()
        deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(10)]
        assert logic.is_game_complete(2, deck, [], []) is True
    
    def test_is_game_complete_no_cards(self):
        """Test game complete when no cards left"""
        logic = CasinoGameLogic()
        assert logic.is_game_complete(1, [], [], []) is True
    
    def test_is_game_complete_false(self):
        """Test game not complete"""
        logic = CasinoGameLogic()
        deck = [GameCard(f"{i}_hearts", "hearts", str(i), i) for i in range(10)]
        p1_hand = [GameCard("K_spades", "spades", "K", 13)]
        assert logic.is_game_complete(1, deck, p1_hand, []) is False


class TestGetPlayableCards:
    """Test get_playable_cards method"""
    
    def test_get_playable_cards_returns_all(self):
        """Test all cards are playable"""
        logic = CasinoGameLogic()
        hand = [
            GameCard("5_hearts", "hearts", "5", 5),
            GameCard("8_spades", "spades", "8", 8)
        ]
        table = []
        builds = []
        
        playable = logic.get_playable_cards(hand, table, builds)
        assert playable == hand


class TestGetPossibleCaptures:
    """Test get_possible_captures method"""
    
    def test_get_possible_captures_direct_match(self):
        """Test getting capturable cards with direct match"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [
            GameCard("5_spades", "spades", "5", 5),
            GameCard("3_diamonds", "diamonds", "3", 3)
        ]
        
        capturable = logic.get_possible_captures(hand_card, table, [])
        assert len(capturable) == 1
        assert capturable[0].rank == "5"
    
    def test_get_possible_captures_build_match(self):
        """Test getting capturable cards from build"""
        logic = CasinoGameLogic()
        hand_card = GameCard("8_hearts", "hearts", "8", 8)
        build_cards = [
            GameCard("3_spades", "spades", "3", 3),
            GameCard("5_diamonds", "diamonds", "5", 5)
        ]
        build = Build("build_1", build_cards, 8, 1)
        
        capturable = logic.get_possible_captures(hand_card, [], [build])
        assert len(capturable) == 2


class TestGetPossibleBuilds:
    """Test get_possible_builds method"""
    
    def test_get_possible_builds_valid(self):
        """Test getting possible builds"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [GameCard("3_spades", "spades", "3", 3)]
        player_hand = [
            hand_card,
            GameCard("8_clubs", "clubs", "8", 8)
        ]
        
        possible = logic.get_possible_builds(hand_card, table, player_hand)
        assert len(possible) > 0
        # Should find build value 8 (5 + 3)
        assert any(build_val == 8 for _, build_val in possible)
    
    def test_get_possible_builds_no_capturing_card(self):
        """Test no builds when no capturing card"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        table = [GameCard("3_spades", "spades", "3", 3)]
        player_hand = [hand_card]  # No capturing card
        
        possible = logic.get_possible_builds(hand_card, table, player_hand)
        assert len(possible) == 0


class TestAdditionalCoverage:
    """Additional tests to reach 100% coverage"""
    
    def test_execute_capture_keeps_non_matching_builds(self):
        """Test that non-matching builds are kept"""
        logic = CasinoGameLogic()
        hand_card = GameCard("8_hearts", "hearts", "8", 8)
        build_cards_8 = [GameCard("3_spades", "spades", "3", 3)]
        build_cards_10 = [GameCard("5_diamonds", "diamonds", "5", 5)]
        build_8 = Build("build_1", build_cards_8, 8, 1)
        build_10 = Build("build_2", build_cards_10, 10, 1)
        
        captured, remaining_builds, remaining_table = logic.execute_capture(
            hand_card, [], [build_8, build_10], 1
        )
        
        # Build with value 8 should be captured, build with value 10 should remain
        assert len(remaining_builds) == 1
        assert remaining_builds[0].value == 10
    
    def test_execute_build_creates_correct_id(self):
        """Test build ID format"""
        logic = CasinoGameLogic()
        hand_card = GameCard("5_hearts", "hearts", "5", 5)
        target = [GameCard("3_spades", "spades", "3", 3)]
        
        remaining_table, new_build = logic.execute_build(hand_card, target, 8, 2)
        
        # Check build ID contains player ID and value
        assert "2" in new_build.id
        assert "8" in new_build.id
    
    def test_get_possible_builds_multiple_combinations(self):
        """Test finding multiple possible build combinations"""
        logic = CasinoGameLogic()
        hand_card = GameCard("2_hearts", "hearts", "2", 2)
        table = [
            GameCard("3_spades", "spades", "3", 3),
            GameCard("5_diamonds", "diamonds", "5", 5),
            GameCard("7_clubs", "clubs", "7", 7)
        ]
        player_hand = [
            hand_card,
            GameCard("10_hearts", "hearts", "10", 10),
            GameCard("12_spades", "spades", "Q", 12)
        ]
        
        possible = logic.get_possible_builds(hand_card, table, player_hand)
        
        # Should find multiple valid builds
        # 2 + 3 + 5 = 10, 2 + 3 + 7 = 12, etc.
        assert len(possible) > 0
