# Script to add table-build endpoint to main.py

NEW_ENDPOINT = '''

@app.post("/game/table-build", response_model=StandardResponse)
async def table_build(request: TableBuildRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a build from table cards only (non-standard rule).
    
    This action does NOT consume a turn - it allows players to combine
    table cards into a build without playing a card from their hand.
    
    Rules:
    - Must select at least 2 table cards
    - Cards must sum to the declared build value
    - Player must have a card in hand that can capture the build
    """
    from action_logger import ActionLogger
    from schemas import TableBuildRequest
    
    room = await get_room_or_404(db, request.room_id)
    
    # Log the action
    action_logger = ActionLogger(db)
    action_id = await action_logger.log_game_action(
        room_id=request.room_id,
        player_id=request.player_id,
        action_type="table_build",
        action_data={
            "target_cards": request.target_cards,
            "build_value": request.build_value
        }
    )
    
    # Check if game is in progress
    if room.game_phase not in ["round1", "round2"]:
        raise HTTPException(status_code=400, detail="Game is not in progress")
    
    # Check if it's the player's turn (table builds can only be done on your turn)
    assert_players_turn(room, request.player_id)
    
    # Convert database data to game objects
    player1_hand = convert_dict_to_game_cards(room.player1_hand or [])
    player2_hand = convert_dict_to_game_cards(room.player2_hand or [])
    table_cards = convert_dict_to_game_cards(room.table_cards or [])
    builds = convert_dict_to_builds(room.builds or [])
    
    # Determine which player is playing
    players_in_room = get_sorted_players(room)
    is_player1 = request.player_id == players_in_room[0].id
    player_hand = player1_hand if is_player1 else player2_hand
    
    # Find target cards on table
    target_cards = [card for card in table_cards if card.id in request.target_cards]
    
    if len(target_cards) != len(request.target_cards):
        raise HTTPException(status_code=400, detail="Some target cards not found on table")
    
    # Validate table build
    if not game_logic.validate_table_build(target_cards, request.build_value, player_hand):
        raise HTTPException(status_code=400, detail="Invalid table build. Cards must sum to build value and you need a card to capture it.")
    
    # Execute table build
    new_build = game_logic.execute_table_build(target_cards, request.build_value, request.player_id)
    
    # Update game state - remove cards from table, add build
    table_cards = [card for card in table_cards if card.id not in request.target_cards]
    builds.append(new_build)
    
    # Update database
    room.table_cards = convert_game_cards_to_dict(table_cards)
    room.builds = convert_builds_to_dict(builds)
    
    # Note: We do NOT switch turns for table-only builds
    # The player still needs to play a card from their hand
    
    # Increment version and update metadata
    room.version += 1
    room.last_modified = datetime.utcnow()
    room.modified_by = request.player_id
    
    await db.commit()
    
    # Re-fetch room with players loaded for response
    room = await get_room_or_404(db, request.room_id)
    
    # Broadcast game state update
    game_state_response = await game_state_to_response(room)
    state_dict = game_state_response.model_dump()
    await manager.broadcast_json_to_room({
        "type": "game_state_update",
        "room_id": room.id,
        "game_state": state_dict
    }, room.id)
    
    return StandardResponse(
        success=True,
        message="Table build created successfully",
        game_state=game_state_response
    )

'''

# Read the current file
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import for TableBuildRequest to the imports section
if 'TableBuildRequest' not in content:
    # Find the schemas import line and add TableBuildRequest
    old_import = 'from schemas import ('
    if old_import in content:
        # Find the end of the import block
        import_start = content.find(old_import)
        import_end = content.find(')', import_start) + 1
        import_block = content[import_start:import_end]
        
        # Add TableBuildRequest to the import
        if 'TableBuildRequest' not in import_block:
            new_import_block = import_block.replace('SyncRequest', 'SyncRequest,\n    TableBuildRequest')
            content = content.replace(import_block, new_import_block)

# Add the endpoint after play_card endpoint
insert_marker = '@app.post("/game/reset"'

if insert_marker in content:
    pos = content.find(insert_marker)
    new_content = content[:pos] + NEW_ENDPOINT + content[pos:]
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added table-build endpoint to main.py")
else:
    print("Could not find insertion point")
