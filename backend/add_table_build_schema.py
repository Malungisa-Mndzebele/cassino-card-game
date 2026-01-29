# Script to add TableBuildRequest schema to schemas.py

NEW_SCHEMA = '''

class TableBuildRequest(BaseModel):
    """
    Request schema for table-only build action (non-standard rule).
    
    Combines table cards into a build WITHOUT playing a hand card.
    Does NOT consume a turn.
    
    Attributes:
        room_id: Room identifier
        player_id: Player identifier
        target_cards: Table card IDs to combine into build
        build_value: Target build value
    """
    room_id: str = Field(..., min_length=6, max_length=6)
    player_id: int = Field(..., ge=1)
    target_cards: List[str] = Field(..., min_length=2)
    build_value: int = Field(..., ge=2, le=14)
'''

# Read the current file
with open('schemas.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add after PlayCardRequest class
insert_marker = "class StartShuffleRequest(BaseModel):"

if insert_marker in content:
    pos = content.find(insert_marker)
    new_content = content[:pos] + NEW_SCHEMA + '\n' + content[pos:]
    
    with open('schemas.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added TableBuildRequest schema to schemas.py")
else:
    print("Could not find insertion point")
