# Feature Request: Multiple/Compound Builds

## Status
📋 **Requested** - Not yet implemented

## Priority
🟡 **Medium** - Enhances gameplay to match traditional Casino rules

## Overview
Add support for creating multiple builds (compound builds) in a single action, where a player can combine multiple sets of cards that all equal the same target value.

## Current Limitation
The game currently only supports:
1. **Simple Build**: One hand card + table cards = build value
2. **Augmenting Build**: Adding cards to an existing build

Players must make multiple turns to create what should be a single compound build action.

## Requested Feature
Allow players to create a compound build in ONE action by selecting multiple card combinations that all equal the same value.

### Example Scenario
**Table Cards:** 5, 8, K, 7  
**Hand Cards:** 6, K

**Desired Action:** Build 13 by combining:
- 5 + 8 = 13 (from table)
- K = 13 (from table)
- 6 (from hand) + 7 (from table) = 13

**Result:** One build with value 13 containing three separate combinations, all capturable with a King.

### Traditional Casino Rules
In traditional Casino, a player can create a multiple build by:
1. Combining multiple sets of cards that equal the same value
2. Each set can be from table cards, hand cards, or a mix
3. All sets must equal the declared build value
4. Player must have a card in hand that can capture the build value
5. The entire compound build is captured as one unit

## Use Cases

### Use Case 1: Basic Multiple Build
- **Table:** 2, 3, 5, 8
- **Hand:** 5, 10
- **Action:** Build 10 using (2+3+5) and (5 from hand)
- **Capture:** Later capture with 10

### Use Case 2: Complex Multiple Build
- **Table:** A, 2, 3, 4, 5, 6, 7
- **Hand:** 6, 7, 8
- **Action:** Build 8 using (A+7), (3+5), (2+6 from hand)
- **Capture:** Later capture with 8

### Use Case 3: Augmenting Multiple Build
- **Existing Build:** 9-build (4+5)
- **Table:** 3, 6, 9
- **Hand:** 9
- **Action:** Augment to multiple 9-build by adding (3+6) and (9 from table)
- **Capture:** Later capture with 9

## Technical Requirements

### Backend Changes

#### 1. Data Structure
Update the `Build` class to support multiple combinations:

```python
@dataclass
class BuildCombination:
    """Represents one combination within a multiple build"""
    cards: List[GameCard]
    # Each combination sums to the build value

@dataclass
class Build:
    id: str
    combinations: List[BuildCombination]  # NEW: Multiple combinations
    value: int
    owner: int
    
    @property
    def cards(self) -> List[GameCard]:
        """Flatten all cards from all combinations"""
        return [card for combo in self.combinations for card in combo.cards]
```

#### 2. Validation Logic
Update `validate_build` to accept multiple card groups:

```python
def validate_multiple_build(
    self,
    card_groups: List[List[GameCard]],  # Multiple groups of cards
    build_value: int,
    player_hand: List[GameCard]
) -> bool:
    """
    Validate a multiple build.
    
    Rules:
    1. Each group must sum to build_value
    2. At least one group must include a hand card
    3. Player must have a card in hand to capture build_value
    4. All groups must be valid combinations
    """
    # Check player has capture card
    has_capture_card = any(
        build_value in self.get_card_values(card) 
        for card in player_hand
    )
    if not has_capture_card:
        return False
    
    # Check at least one group uses a hand card
    hand_card_ids = {card.id for card in player_hand}
    has_hand_card = any(
        any(card.id in hand_card_ids for card in group)
        for group in card_groups
    )
    if not has_hand_card:
        return False
    
    # Validate each group sums to build_value
    for group in card_groups:
        if not self.can_make_value_with_aces(group, build_value):
            return False
    
    return True
```

#### 3. Execution Logic
Update `execute_build` to handle multiple combinations:

```python
def execute_multiple_build(
    self,
    card_groups: List[List[GameCard]],
    build_value: int,
    player_id: int
) -> Build:
    """Execute a multiple build"""
    combinations = [
        BuildCombination(cards=group)
        for group in card_groups
    ]
    
    build_id = f"build_{player_id}_{len(combinations)}x{build_value}"
    return Build(
        id=build_id,
        combinations=combinations,
        value=build_value,
        owner=player_id
    )
```

#### 4. API Endpoint
Add new endpoint or extend existing build endpoint:

```python
class MultipleBuildRequest(BaseModel):
    player_id: int
    card_groups: List[List[str]]  # List of card ID groups
    build_value: int

@app.post("/game/build/multiple")
async def create_multiple_build(
    request: MultipleBuildRequest,
    db: Session = Depends(get_db)
):
    # Validate and execute multiple build
    # Return updated game state
    pass
```

### Frontend Changes

#### 1. UI/UX Design
Create a multi-step build interface:

**Step 1: Select Build Mode**
- [ ] Simple Build (current)
- [ ] Multiple Build (new)

**Step 2: Define Combinations**
- Show selected cards grouped by combination
- Allow adding/removing combinations
- Display running total for each combination
- Highlight when combination equals target value

**Step 3: Confirm Build**
- Show all combinations
- Verify player has capture card
- Submit build action

#### 2. Component Structure
```typescript
// New component: MultipleBuildCreator.svelte
interface CardGroup {
    id: string;
    cards: Card[];
    sum: number;
    isValid: boolean;
}

let cardGroups: CardGroup[] = [];
let targetValue: number = 0;
let currentGroup: Card[] = [];

function addCardToCurrentGroup(card: Card) { }
function finalizeCurrentGroup() { }
function removeGroup(groupId: string) { }
function submitMultipleBuild() { }
```

#### 3. Visual Representation
Display multiple builds with grouped cards:

```
┌─────────────────────────────────┐
│  Build 13 (Player 1)            │
├─────────────────────────────────┤
│  [5♠][8♥] = 13                  │
│  [K♦] = 13                      │
│  [6♣][7♠] = 13                  │
└─────────────────────────────────┘
```

### Database Changes

#### 1. Schema Update
Update the `builds` column in the `rooms` table to support the new structure:

```python
# Migration needed to handle new Build structure
# Backward compatible: Single combination = old format
```

#### 2. Serialization
Update build serialization to handle combinations:

```python
def build_to_dict(build: Build) -> dict:
    return {
        "id": build.id,
        "combinations": [
            [card_to_dict(card) for card in combo.cards]
            for combo in build.combinations
        ],
        "value": build.value,
        "owner": build.owner
    }
```

## Implementation Plan

### Phase 1: Backend Foundation (2-3 days)
- [ ] Update Build data structure
- [ ] Implement validation logic
- [ ] Add execution logic
- [ ] Create API endpoint
- [ ] Write unit tests

### Phase 2: Frontend UI (3-4 days)
- [ ] Design UI/UX mockups
- [ ] Create MultipleBuildCreator component
- [ ] Implement card grouping logic
- [ ] Add visual feedback
- [ ] Handle edge cases

### Phase 3: Integration (1-2 days)
- [ ] Connect frontend to backend
- [ ] Update WebSocket messages
- [ ] Test with real gameplay
- [ ] Handle state synchronization

### Phase 4: Testing & Polish (2-3 days)
- [ ] E2E tests for multiple builds
- [ ] Test edge cases
- [ ] Performance optimization
- [ ] UI polish and animations
- [ ] Documentation updates

**Total Estimated Time:** 8-12 days

## Testing Scenarios

### Test Case 1: Basic Multiple Build
1. Create multiple build with 2 combinations
2. Verify build is created correctly
3. Capture build with matching card
4. Verify all cards are captured

### Test Case 2: Complex Multiple Build
1. Create multiple build with 3+ combinations
2. Include hand cards and table cards
3. Verify validation works correctly
4. Test with Aces (dual values)

### Test Case 3: Augmenting Multiple Build
1. Create simple build
2. Augment to multiple build
3. Verify existing combinations preserved
4. Test ownership rules

### Test Case 4: Invalid Scenarios
1. Combinations don't equal target value
2. No capture card in hand
3. No hand card used in any combination
4. Duplicate cards across combinations

### Test Case 5: Edge Cases
1. All combinations use same cards (invalid)
2. Empty combinations
3. Single card combinations
4. Maximum number of combinations

## Backward Compatibility

### Considerations
- Existing simple builds must continue to work
- Old game states must be loadable
- API must support both old and new formats

### Migration Strategy
1. Treat existing builds as single-combination builds
2. Add `combinations` field with default value
3. Update serialization to handle both formats
4. Gradual rollout with feature flag

## User Documentation

### Tutorial Updates
- Add section on multiple builds
- Include visual examples
- Explain when to use multiple builds
- Show strategic advantages

### In-Game Help
- Add tooltip explaining multiple builds
- Show example scenarios
- Provide step-by-step guide

## Benefits

### Gameplay
- ✅ Matches traditional Casino rules
- ✅ Adds strategic depth
- ✅ More efficient gameplay (fewer turns)
- ✅ Enables advanced tactics

### User Experience
- ✅ More authentic Casino experience
- ✅ Reduces frustration for experienced players
- ✅ Enables more complex strategies
- ✅ Increases replay value

## Risks & Challenges

### Technical Challenges
- 🔴 Complex UI for card grouping
- 🟡 State management complexity
- 🟡 Validation edge cases
- 🟡 Performance with many combinations

### UX Challenges
- 🔴 Learning curve for new players
- 🟡 Mobile UI constraints
- 🟡 Visual clarity with many cards
- 🟡 Undo/redo functionality

### Mitigation Strategies
- Progressive disclosure (hide advanced features initially)
- Comprehensive tutorial
- Visual feedback and validation
- Extensive testing with real users

## Alternative Approaches

### Option 1: Simplified Multiple Build
Only allow 2 combinations maximum to reduce complexity.

**Pros:** Easier to implement, simpler UI  
**Cons:** Still doesn't match full Casino rules

### Option 2: Auto-Detect Multiple Builds
System automatically suggests multiple build opportunities.

**Pros:** Easier for beginners  
**Cons:** Removes player agency, complex algorithm

### Option 3: Sequential Build Enhancement
Keep current system but make augmenting faster/easier.

**Pros:** Minimal changes  
**Cons:** Doesn't solve the core issue

## Related Features

- [ ] Build hints/suggestions
- [ ] Build history/replay
- [ ] Build statistics
- [ ] Advanced build strategies guide

## References

### Casino Rules
- [Pagat.com - Casino Card Game](https://www.pagat.com/fishing/casino.html)
- [Wikipedia - Casino (card game)](https://en.wikipedia.org/wiki/Casino_(card_game))
- Traditional Casino rulebooks

### Similar Implementations
- Research other online Casino implementations
- Study physical Casino gameplay videos
- Analyze user feedback from Casino players

## Feedback & Discussion

### User Requests
- Original request: User wants to build 13 using (5+8), K, and (6+7) in one action
- Expected by experienced Casino players
- Would improve competitive play

### Community Input
- [ ] Survey existing players
- [ ] Gather feedback on proposed UI
- [ ] Test with focus group
- [ ] Iterate based on feedback

## Approval & Sign-off

- [ ] Product Owner approval
- [ ] Technical feasibility confirmed
- [ ] UI/UX design approved
- [ ] Resource allocation confirmed
- [ ] Timeline agreed upon

---

**Created:** 2026-02-12  
**Last Updated:** 2026-02-12  
**Status:** Pending Review  
**Assigned To:** TBD  
**Target Release:** TBD
