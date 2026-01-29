# Script to add table-only build methods to game_logic.py

NEW_METHODS = '''
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
'''

# Read the current file
with open('game_logic.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the last method and add new methods before the final class closing
# We'll add it after execute_trail method
insert_marker = "def execute_trail(self, hand_card: GameCard) -> List[GameCard]:"
insert_after = '"""Execute a trail move - add card to table"""\n        return [hand_card]'

if insert_after in content:
    # Find the position after execute_trail
    pos = content.find(insert_after) + len(insert_after)
    new_content = content[:pos] + '\n' + NEW_METHODS + content[pos:]
    
    with open('game_logic.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added table build methods to game_logic.py")
else:
    print("Could not find insertion point")
