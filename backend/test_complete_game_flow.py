"""
Test complete game flow from start to finish with winner determination.
This test ensures the game properly handles all phases and crowns a winner.
"""

import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Room, Player
from game_logic import CasinoGameLogic
from main import app
from fastapi.testclient import TestClient
import json

# Test client for API calls
client = TestClient(app)

@pytest.mark.asyncio
async def test_complete_game_flow_to_winner(db_session: AsyncSession):
    """
    Test a complete game flow from room creation to winner determination.
    This test simulates two players playing through an entire game.
    """
    game_logic = CasinoGameLogic()
    
    # Step 1: Create room and add players
    print("🎮 Step 1: Creating room and adding players...")
    
    # Create room via API
    response = client.post("/rooms", json={
        "player_name": "TestPlayer1"
    })
    assert response.status_code == 200
    room_data = response.json()
    room_id = room_data["room_id"]
    player1_token = room_data["session_token"]
    
    # Add second player
    response = client.post(f"/rooms/{room_id}/join", json={
        "player_name": "TestPlayer2"
    })
    assert response.status_code == 200
    player2_token = response.json()["session_token"]
    
    print(f"✅ Room created: {room_id}")
    
    # Step 2: Set both players ready
    print("🎮 Step 2: Setting players ready...")
    
    # Player 1 ready
    response = client.post(f"/rooms/{room_id}/ready", 
                          headers={"Authorization": f"Bearer {player1_token}"})
    assert response.status_code == 200
    
    # Player 2 ready
    response = client.post(f"/rooms/{room_id}/ready", 
                          headers={"Authorization": f"Bearer {player2_token}"})
    assert response.status_code == 200
    
    print("✅ Both players ready")
    
    # Step 3: Start game (dealer phase)
    print("🎮 Step 3: Starting game...")
    
    # Get game state to verify dealer phase
    response = client.get(f"/rooms/{room_id}/state",
                         headers={"Authorization": f"Bearer {player1_token}"})
    assert response.status_code == 200
    game_state = response.json()["game_state"]
    
    # Should be in dealer phase
    assert game_state["phase"] in ["dealer", "round1"]
    
    # If in dealer phase, proceed to dealing
    if game_state["phase"] == "dealer":
        response = client.post(f"/rooms/{room_id}/deal",
                              headers={"Authorization": f"Bearer {player1_token}"})
        assert response.status_code == 200
    
    print("✅ Game started and cards dealt")
    
    # Step 4: Play through the game
    print("🎮 Step 4: Playing through the game...")
    
    moves_played = 0
    max_moves = 50  # Safety limit
    
    for move_count in range(max_moves):
        # Get current game state
        response = client.get(f"/rooms/{room_id}/state",
                             headers={"Authorization": f"Bearer {player1_token}"})
        assert response.status_code == 200
        game_state = response.json()["game_state"]
        
        # Check if game is finished
        if game_state["phase"] == "finished" or game_state.get("gameCompleted", False):
            print(f"🏆 Game finished after {moves_played} moves!")
            break
        
        # Determine whose turn it is
        current_turn = game_state.get("currentTurn", 1)
        current_token = player1_token if current_turn == 1 else player2_token
        player_name = "Player1" if current_turn == 1 else "Player2"
        
        # Get player's hand
        hand_key = "player1Hand" if current_turn == 1 else "player2Hand"
        player_hand = game_state.get(hand_key, [])
        
        if not player_hand:
            # No cards in hand, might need to deal round 2 or game is over
            if game_state.get("round", 1) == 1:
                print("🃏 Round 1 complete, dealing round 2...")
                response = client.post(f"/rooms/{room_id}/deal-round2",
                                      headers={"Authorization": f"Bearer {current_token}"})
                if response.status_code == 200:
                    continue
            else:
                print("🏁 No more cards, game should be finishing...")
                break
        
        # Play a card (trail - simplest move)
        if player_hand:
            card_to_play = player_hand[0]  # Play first card
            
            print(f"🎯 {player_name} playing card: {card_to_play['id']}")
            
            # Make a trail move (safest move that always works)
            response = client.post(f"/rooms/{room_id}/play-card", 
                                  headers={"Authorization": f"Bearer {current_token}"},
                                  json={
                                      "card_id": card_to_play["id"],
                                      "action": "trail",
                                      "target_cards": []
                                  })
            
            if response.status_code == 200:
                moves_played += 1
                print(f"✅ Move {moves_played} completed")
            else:
                print(f"❌ Move failed: {response.json()}")
                # Try a different approach or break
                break
        
        # Small delay to prevent overwhelming the system
        await asyncio.sleep(0.1)
    
    # Step 5: Verify game completion and winner
    print("🎮 Step 5: Verifying game completion...")
    
    # Get final game state
    response = client.get(f"/rooms/{room_id}/state",
                         headers={"Authorization": f"Bearer {player1_token}"})
    assert response.status_code == 200
    final_state = response.json()["game_state"]
    
    print(f"📊 Final game state:")
    print(f"   Phase: {final_state.get('phase', 'unknown')}")
    print(f"   Game Completed: {final_state.get('gameCompleted', False)}")
    print(f"   Player 1 Score: {final_state.get('player1Score', 0)}")
    print(f"   Player 2 Score: {final_state.get('player2Score', 0)}")
    print(f"   Winner: {final_state.get('winner', 'None')}")
    
    # Verify game is completed
    assert final_state["phase"] == "finished" or final_state.get("gameCompleted", False)
    
    # Verify scores are calculated
    p1_score = final_state.get("player1Score", 0)
    p2_score = final_state.get("player2Score", 0)
    
    assert p1_score >= 0
    assert p2_score >= 0
    
    # Verify winner is determined (could be None for tie)
    winner = final_state.get("winner")
    if winner is not None:
        assert winner in [1, 2]
        print(f"🏆 Winner: Player {winner}")
        
        # Winner should have higher score, or same score with more cards
        if winner == 1:
            assert p1_score >= p2_score
        else:
            assert p2_score >= p1_score
    else:
        print("🤝 Game ended in a tie")
        assert p1_score == p2_score
    
    print(f"✅ Complete game flow test passed! Total moves: {moves_played}")


@pytest.mark.asyncio 
async def test_game_logic_winner_determination():
    """
    Test the game logic winner determination directly.
    """
    game_logic = CasinoGameLogic()
    
    # Test case 1: Player 1 wins with higher score
    winner = game_logic.determine_winner(8, 6, 27, 25)
    assert winner == 1
    
    # Test case 2: Player 2 wins with higher score  
    winner = game_logic.determine_winner(5, 9, 25, 27)
    assert winner == 2
    
    # Test case 3: Tie score, Player 1 wins with more cards
    winner = game_logic.determine_winner(7, 7, 28, 24)
    assert winner == 1
    
    # Test case 4: Tie score, Player 2 wins with more cards
    winner = game_logic.determine_winner(6, 6, 24, 28)
    assert winner == 2
    
    # Test case 5: Complete tie
    winner = game_logic.determine_winner(7, 7, 26, 26)
    assert winner is None
    
    print("✅ Winner determination logic tests passed!")


@pytest.mark.asyncio
async def test_scoring_system():
    """
    Test the scoring system to ensure it works correctly.
    """
    game_logic = CasinoGameLogic()
    
    # Create test cards
    from game_logic import GameCard
    
    # Test cards for Player 1
    p1_cards = [
        GameCard("A_hearts", "hearts", "A", 14),      # 1 point (ace)
        GameCard("A_spades", "spades", "A", 14),      # 1 point (ace)  
        GameCard("2_spades", "spades", "2", 2),       # 1 point (big casino)
        GameCard("10_diamonds", "diamonds", "10", 10), # 2 points (little casino)
        GameCard("K_hearts", "hearts", "K", 13),
        GameCard("Q_spades", "spades", "Q", 12),
        GameCard("J_spades", "spades", "J", 11),
        GameCard("9_spades", "spades", "9", 9),
        GameCard("8_spades", "spades", "8", 8),
        GameCard("7_spades", "spades", "7", 7),
        GameCard("6_spades", "spades", "6", 6),
        GameCard("5_spades", "spades", "5", 5),
        GameCard("4_spades", "spades", "4", 4),
        GameCard("3_spades", "spades", "3", 3),
        # Total: 14 cards, 9 spades
    ]
    
    # Test cards for Player 2  
    p2_cards = [
        GameCard("A_diamonds", "diamonds", "A", 14),   # 1 point (ace)
        GameCard("A_clubs", "clubs", "A", 14),         # 1 point (ace)
        GameCard("K_diamonds", "diamonds", "K", 13),
        GameCard("Q_diamonds", "diamonds", "Q", 12),
        GameCard("J_diamonds", "diamonds", "J", 11),
        GameCard("10_hearts", "hearts", "10", 10),
        GameCard("9_hearts", "hearts", "9", 9),
        GameCard("8_hearts", "hearts", "8", 8),
        GameCard("7_hearts", "hearts", "7", 7),
        GameCard("6_hearts", "hearts", "6", 6),
        GameCard("5_hearts", "hearts", "5", 5),
        GameCard("4_hearts", "hearts", "4", 4),
        GameCard("3_hearts", "hearts", "3", 3),
        GameCard("2_hearts", "hearts", "2", 2),
        # Total: 14 cards, 0 spades
    ]
    
    # Calculate base scores
    p1_base = game_logic.calculate_score(p1_cards)
    p2_base = game_logic.calculate_score(p2_cards)
    
    # Player 1: 2 aces + 1 big casino + 2 little casino = 5 points
    assert p1_base == 5
    
    # Player 2: 2 aces = 2 points  
    assert p2_base == 2
    
    # Calculate bonus scores
    p1_bonus, p2_bonus = game_logic.calculate_bonus_scores(p1_cards, p2_cards)
    
    # Cards are tied (14 each), so 1 point each for most cards
    # Player 1 has 9 spades vs 0, so 2 points for most spades
    # Player 1 bonus: 1 (tied cards) + 2 (most spades) = 3
    # Player 2 bonus: 1 (tied cards) + 0 (no spades) = 1
    assert p1_bonus == 3
    assert p2_bonus == 1
    
    # Final scores
    p1_final = p1_base + p1_bonus  # 5 + 3 = 8
    p2_final = p2_base + p2_bonus  # 2 + 1 = 3
    
    # Determine winner
    winner = game_logic.determine_winner(p1_final, p2_final, len(p1_cards), len(p2_cards))
    assert winner == 1  # Player 1 should win with 8 vs 3
    
    print("✅ Scoring system tests passed!")
    print(f"   Player 1: {p1_base} base + {p1_bonus} bonus = {p1_final} total")
    print(f"   Player 2: {p2_base} base + {p2_bonus} bonus = {p2_final} total")
    print(f"   Winner: Player {winner}")


if __name__ == "__main__":
    # Run the tests
    import asyncio
    
    async def run_tests():
        # These would normally be run by pytest, but we can run them directly for testing
        print("🧪 Running complete game flow tests...")
        
        # Test game logic components
        await test_game_logic_winner_determination()
        await test_scoring_system()
        
        print("✅ All game logic tests passed!")
    
    asyncio.run(run_tests())