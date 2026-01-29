# Update GameBoard.svelte to support table-only builds

$content = Get-Content "src\lib\components\GameBoard.svelte" -Raw

# 1. Add import for tableBuild
$oldImport = "import { playCard } from '\$lib/utils/api';"
$newImport = "import { playCard, tableBuild } from '\$lib/utils/api';"
$content = $content -replace [regex]::Escape($oldImport), $newImport

# 2. Add state for table-only build modal
$stateMarker = "let showDragBuildModal = false;"
$newState = @"
let showDragBuildModal = false;
	let showTableBuildModal = false;
	let tableBuildValue: number = 2;
"@
$content = $content -replace [regex]::Escape($stateMarker), $newState

# 3. Add reactive statement for possible table-only build values
$reactiveMarker = '`$: dragBuildValues = calculateDragBuildValuesForCombine();'
$newReactive = @"
`$: dragBuildValues = calculateDragBuildValuesForCombine();
	`$: possibleTableBuildValues = calculateTableBuildValues(tableCards, myHand, selectedTableCards);
"@
$content = $content -replace [regex]::Escape($reactiveMarker), $newReactive

# 4. Add function to calculate table-only build values (after calculateDragBuildValuesForCombine)
$funcMarker = "function getCardValue(card: CardType): number {"
$newFunc = @"
function calculateTableBuildValues(
		tableCardsRef: typeof tableCards,
		myHandRef: typeof myHand,
		selectedIds: typeof selectedTableCards
	): number[] {
		if (selectedIds.length < 2) return [];
		
		const selectedCards = selectedIds.map(id => tableCardsRef.find(c => c.id === id)).filter(Boolean) as CardType[];
		if (selectedCards.length < 2) return [];
		
		const validValues: number[] = [];
		
		for (let v = 2; v <= 14; v++) {
			// Check if player has a card to capture this build value
			const hasCapturingCard = myHandRef.some(c => {
				const cardValues = getCardValues(c);
				return cardValues.includes(v);
			});
			
			// Check if selected table cards can sum to this value
			if (hasCapturingCard && canSumTo(selectedCards, v)) {
				validValues.push(v);
			}
		}
		
		return validValues;
	}

	function getCardValue(card: CardType): number {
"@
$content = $content -replace [regex]::Escape($funcMarker), $newFunc

# 5. Update handleTableCardClick to allow selection without hand card
$oldTableClick = @"
function handleTableCardClick(card: CardType) {
		if (!isMyTurn || !selectedCard || isProcessing) return;
"@
$newTableClick = @"
function handleTableCardClick(card: CardType) {
		if (!isMyTurn || isProcessing) return;
"@
$content = $content -replace [regex]::Escape($oldTableClick), $newTableClick

# 6. Add table build action handler
$trailHandler = "async function handleTrail() {"
$tableBuildHandler = @"
function handleTableBuildAction() {
		if (selectedTableCards.length < 2) {
			actionError = 'Select at least 2 table cards to create a table build';
			return;
		}
		if (possibleTableBuildValues.length === 0) {
			actionError = 'No valid table build possible. You need a card in hand to capture the build.';
			return;
		}
		tableBuildValue = possibleTableBuildValues[0];
		showTableBuildModal = true;
	}

	async function confirmTableBuild() {
		if (!roomId || !playerId || selectedTableCards.length < 2) return;
		isProcessing = true;
		actionError = '';
		showTableBuildModal = false;
		try {
			const response = await tableBuild(roomId, String(playerId), selectedTableCards, tableBuildValue);
			if (response.game_state) {
				gameStore.setGameState(response.game_state);
			}
			selectedCard = null;
			selectedTableCards = [];
			selectedBuildIds = [];
		} catch (err: any) {
			actionError = err.message || 'Table build failed';
		} finally {
			isProcessing = false;
		}
	}

	function cancelTableBuildModal() {
		showTableBuildModal = false;
	}

	async function handleTrail() {
"@
$content = $content -replace [regex]::Escape($trailHandler), $tableBuildHandler

# 7. Update table card button to be clickable without hand card selected
$oldTableBtn = 'disabled={!selectedCard || !isMyTurn || isProcessing}'
$newTableBtn = 'disabled={!isMyTurn || isProcessing}'
$content = $content -replace [regex]::Escape($oldTableBtn), $newTableBtn

# 8. Update selectable class condition
$oldSelectable = 'class:selectable={selectedCard && isMyTurn}'
$newSelectable = 'class:selectable={isMyTurn}'
$content = $content -replace [regex]::Escape($oldSelectable), $newSelectable

Set-Content "src\lib\components\GameBoard.svelte" -Value $content -NoNewline
Write-Host "Updated GameBoard.svelte with table-only build support"
