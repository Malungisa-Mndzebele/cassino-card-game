<script lang="ts">
	import { gameStore } from '$stores/gameStore';
	import { connectionStore } from '$stores/connectionStore';
	import { Card, CapturedPile } from '$components';
	import { playCard } from '$lib/utils/api';
	import type { Card as CardType } from '$types/game';
	
	$: gameState = $gameStore.gameState;
	$: playerId = $gameStore.playerId;
	$: roomId = $gameStore.roomId;
	$: players = gameState?.players || [];
	$: isPlayer1 = String(players[0]?.id) === String(playerId);
	$: myHand = isPlayer1 ? (gameState?.player1Hand || []) : (gameState?.player2Hand || []);
	$: opponentHand = isPlayer1 ? (gameState?.player2Hand || []) : (gameState?.player1Hand || []);
	$: tableCards = gameState?.tableCards || [];
	$: builds = gameState?.builds || [];
	$: currentTurn = gameState?.currentTurn || 1;
	$: isMyTurn = (isPlayer1 && currentTurn === 1) || (!isPlayer1 && currentTurn === 2);
	$: myName = isPlayer1 ? players[0]?.name : players[1]?.name;
	$: opponentName = isPlayer1 ? players[1]?.name : players[0]?.name;
	$: myScore = isPlayer1 ? (gameState?.player1Score || 0) : (gameState?.player2Score || 0);
	$: opponentScore = isPlayer1 ? (gameState?.player2Score || 0) : (gameState?.player1Score || 0);
	$: myCaptured = isPlayer1 ? (gameState?.player1Captured?.length || 0) : (gameState?.player2Captured?.length || 0);
	$: opponentCaptured = isPlayer1 ? (gameState?.player2Captured?.length || 0) : (gameState?.player1Captured?.length || 0);
	$: myCapturedCards = isPlayer1 ? (gameState?.player1Captured || []) : (gameState?.player2Captured || []);
	$: opponentCapturedCards = isPlayer1 ? (gameState?.player2Captured || []) : (gameState?.player1Captured || []);
	$: isGameFinished = gameState?.phase === 'finished';
	$: winner = gameState?.winner;
	$: winnerName = winner === 1 ? players[0]?.name : winner === 2 ? players[1]?.name : null;

	let selectedCard: CardType | null = null;
	let selectedTableCards: string[] = [];
	let selectedBuildIds: string[] = [];
	let showBuildModal = false;
	let buildValue: number = 2;
	let isProcessing = false;
	let actionError = '';
	let showExitConfirm = false;
// Drag and drop state for building
let draggedCard: CardType | null = null;
let dragOverTableCardId: string | null = null;
let showDragBuildModal = false;
let dragBuildCard: CardType | null = null;
let dragTargetCard: CardType | null = null;
$: dragBuildValues = calculateDragBuildValues();

function calculateDragBuildValues(): number[] {
if (!dragBuildCard || !dragTargetCard) return [];
const handCardValue = getCardValue(dragBuildCard);
const tableCardValue = getCardValue(dragTargetCard);
const validValues: number[] = [];

// Try all possible build values
for (let v = 2; v <= 14; v++) {
// Check if we have a card to capture this build value
const hasCapturingCard = myHand.some(c => c.id !== dragBuildCard?.id && getCardValues(c).includes(v));
if (!hasCapturingCard) continue;

// Check if hand card + table card can make this value
const handValues = getCardValues(dragBuildCard);
const tableValues = getCardValues(dragTargetCard);
for (const hv of handValues) {
for (const tv of tableValues) {
if (hv + tv === v) {
if (!validValues.includes(v)) validValues.push(v);
}
}
}
}
return validValues.sort((a, b) => a - b);
}
	// Force reactivity by explicitly depending on ALL variables used in calculation
	// selectedCard and selectedTableCards must be in the reactive statement for proper updates
	$: possibleBuildValues = calculatePossibleBuildValues(tableCards, myHand, selectedCard, selectedTableCards);

	function calculatePossibleBuildValues(
		tableCardsRef: typeof tableCards, 
		myHandRef: typeof myHand,
		handCard: typeof selectedCard,
		selectedIds: typeof selectedTableCards
	): number[] {
		if (!handCard || selectedIds.length === 0) {
			return [];
		}
		const handCardValue = getCardValue(handCard);
		const validValues: number[] = [];
		
						const selectedCards = selectedIds.map(id => {
			const found = tableCardsRef.find(c => c.id === id);
			return found;
		}).filter(Boolean) as CardType[];
		for (let v = 2; v <= 14; v++) {
			if (v === handCardValue) continue;
			const hasCapturingCard = myHandRef.some(c => {
				if (c.id === selectedCard?.id) return false;
				const cardValues = getCardValues(c);
				const matches = cardValues.includes(v);
								return matches;
			});
			const canMake = canMakeValueWithCards(v, handCard, selectedCards);
						if (hasCapturingCard && canMake) {
				validValues.push(v);
			}
		}
		
		return validValues;
	}
	function getCardValue(card: CardType): number {
		const rank = card.rank;
		if (rank === 'A') return 1;
		if (rank === 'K') return 13;
		if (rank === 'Q') return 12;
		if (rank === 'J') return 11;
		return parseInt(rank);
	}
	function getCardValues(card: CardType): number[] {
		if (card.rank === 'A') return [1, 14];
		return [getCardValue(card)];
	}
	function canMakeValue(targetValue: number, tableCardsRef: typeof tableCards): boolean {
		if (!selectedCard) {
			return false;
		}
		const handValues = getCardValues(selectedCard);
		const selectedCards = selectedTableCards.map(id => {
			const found = tableCardsRef.find(c => c.id === id);
			if (!found) {
				}
			return found;
		}).filter(Boolean) as CardType[];
		
		if (selectedCards.length === 0) {
			return false;
		}
		
		for (const handValue of handValues) {
			const neededValue = targetValue - handValue;
			if (neededValue <= 0) continue;
			const canSum = canSumTo(selectedCards, neededValue);
			if (canSum) return true;
		}
		return false;
	}
	function canSumTo(cards: CardType[], target: number): boolean {
		for (let i = 1; i < (1 << cards.length); i++) {
			let sum = 0;
			for (let j = 0; j < cards.length; j++) {
				if (i & (1 << j)) sum += getCardValue(cards[j]);
			}
			if (sum === target) return true;
		}
		return false;
	}

	function handleCardClick(card: CardType) {
		if (!isMyTurn || isProcessing) return;
		actionError = '';
		if (selectedCard?.id === card.id) {
			selectedCard = null;
			selectedTableCards = [];
			selectedBuildIds = [];
		} else {
			selectedCard = card;
			selectedTableCards = [];
			selectedBuildIds = [];
		}
	}
	function handleTableCardClick(card: CardType) {
		if (!isMyTurn || !selectedCard || isProcessing) return;
		actionError = '';
		if (selectedTableCards.includes(card.id)) {
			selectedTableCards = selectedTableCards.filter(id => id !== card.id);
		} else {
			selectedTableCards = [...selectedTableCards, card.id];
		}
	}
	function handleBuildClick(build: any) {
		if (!isMyTurn || !selectedCard || isProcessing) return;
		actionError = '';
		if (selectedBuildIds.includes(build.id)) {
			selectedBuildIds = selectedBuildIds.filter(id => id !== build.id);
		} else {
			selectedBuildIds = [...selectedBuildIds, build.id];
		}
	}

	async function handleCapture() {
		if (!selectedCard || !roomId || !playerId) return;
		if (selectedTableCards.length === 0 && selectedBuildIds.length === 0) {
			actionError = 'Select cards or builds to capture';
			return;
		}
		isProcessing = true;
		actionError = '';
		try {
			const targetCards = [...selectedTableCards, ...selectedBuildIds];
			const response = await playCard(roomId, String(playerId), selectedCard.id, 'capture', targetCards);

			// Update game state with the response from the server

			if (response.game_state) {

			        gameStore.setGameState(response.game_state);

			}
			selectedCard = null;
			selectedTableCards = [];
			selectedBuildIds = [];
		} catch (err: any) {
			actionError = err.message || 'Capture failed';
		} finally {
			isProcessing = false;
		}
	}
	function handleBuildAction() {
		if (!selectedCard) return;
		if (selectedTableCards.length === 0) {
			actionError = 'Select table cards to combine into a build';
			return;
		}
		const handValue = getCardValue(selectedCard);
		const tableSum = selectedTableCards.reduce((sum, cardId) => {
			const card = tableCards.find(c => c.id === cardId);
			return sum + (card ? getCardValue(card) : 0);
		}, 0);
		buildValue = handValue + tableSum;
		if (possibleBuildValues.length === 0) {
			actionError = 'No valid build possible. You need a card in hand to capture the build.';
			return;
		}
		if (!possibleBuildValues.includes(buildValue)) buildValue = possibleBuildValues[0];
		showBuildModal = true;
	}

	async function confirmBuild() {
		if (!selectedCard || !roomId || !playerId) return;
		isProcessing = true;
		actionError = '';
		showBuildModal = false;
		try {
			const response = await playCard(roomId, String(playerId), selectedCard.id, 'build', selectedTableCards, buildValue);

			// Update game state with the response from the server

			if (response.game_state) {

			        gameStore.setGameState(response.game_state);

			}
			selectedCard = null;
			selectedTableCards = [];
			selectedBuildIds = [];
		} catch (err: any) {
			actionError = err.message || 'Build failed';
		} finally {
			isProcessing = false;
		}
	}
	async function handleTrail() {
		if (!selectedCard || !roomId || !playerId) return;
		isProcessing = true;
		actionError = '';
		try {
			const response = await playCard(roomId, String(playerId), selectedCard.id, 'trail');

			// Update game state with the response from the server

			if (response.game_state) {

			        gameStore.setGameState(response.game_state);

			}
			selectedCard = null;
			selectedTableCards = [];
			selectedBuildIds = [];
		} catch (err: any) {
			actionError = err.message || 'Trail failed';
		} finally {
			isProcessing = false;
		}
	}
	function handleExitClick() { showExitConfirm = true; }
	function handleExitConfirm() { connectionStore.disconnect(); gameStore.reset(); showExitConfirm = false; }
	function handleExitCancel() { showExitConfirm = false; }
	function cancelBuildModal() { showBuildModal = false; }
	function handleEndGame() { connectionStore.disconnect(); gameStore.reset(); }
</script>

<div class="game-board">
	<div class="exit-button-container">
		<button class="btn-exit" on:click={handleExitClick}>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Âª Exit Game</button>
	</div>
	<div class="opponent-area">
		<div class="player-info opponent">
			<span class="player-name">{opponentName || 'Opponent'}</span>
			<span class="player-stats">Score: {opponentScore} | Captured: {opponentCaptured}</span>
			{#if !isMyTurn}<span class="turn-indicator">Their Turn</span>{/if}
		</div>
		<div class="hand opponent-hand">
			{#each opponentHand as _, i}<div class="card-back"><div class="card-back-design">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â´</div></div>{/each}
		</div>
			<CapturedPile cards={opponentCapturedCards} playerName={opponentName || 'Opponent'} position="top" />
	</div>

	<div class="table-area">
		<h3 class="table-title">Table ({tableCards.length} cards)</h3>
		{#if selectedCard && isMyTurn}<p class="table-hint">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  Click or drag cards to select for capture/build</p>{/if}
		<div class="table-cards">
			{#if tableCards.length === 0 && builds.length === 0}
				<p class="empty-table">No cards on table</p>
			{:else}
				{#each tableCards as card}
					<button class="table-card-btn" class:selected={selectedTableCards.includes(card.id)} class:selectable={selectedCard && isMyTurn}
						on:click={() => handleTableCardClick(card)}
						disabled={!selectedCard || !isMyTurn || isProcessing}>
						<Card {card} size="medium" isPlayable={!!selectedCard && isMyTurn} isSelected={selectedTableCards.includes(card.id)} />
					</button>
				{/each}
			{/if}
		</div>
		{#if builds.length > 0}
			<div class="builds-area">
				<h4 class="builds-title">Builds</h4>
				<div class="builds">
					{#each builds as build}
						<button class="build-btn" class:my-build={build.owner === (isPlayer1 ? 1 : 2)} class:selected={selectedBuildIds.includes(build.id)}
							on:click={() => handleBuildClick(build)} disabled={!selectedCard || !isMyTurn || isProcessing}>
							<span class="build-value">Value: {build.value}</span>
							<div class="build-cards">{#each build.cards as card}<Card {card} size="small" isPlayable={false} />{/each}</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
		{#if selectedTableCards.length > 0 || selectedBuildIds.length > 0}
			<div class="selection-summary">
				<span class="selection-label">Selected:</span>
				{#if selectedTableCards.length > 0}<span class="selection-count">{selectedTableCards.length} card{selectedTableCards.length > 1 ? 's' : ''}</span>{/if}
				{#if selectedBuildIds.length > 0}<span class="selection-count">{selectedBuildIds.length} build{selectedBuildIds.length > 1 ? 's' : ''}</span>{/if}
			</div>
		{/if}
	</div>

	<div class="my-area">
		<div class="player-info me">
			<span class="player-name">{myName || 'You'}</span>
			<span class="player-stats">Score: {myScore} | Captured: {myCaptured}</span>
			{#if isMyTurn}<span class="turn-indicator my-turn">Your Turn!</span>{/if}
		</div>
			<CapturedPile cards={myCapturedCards} playerName={myName || 'You'} position="bottom" />
		<div class="hand my-hand">
			{#each myHand as card}
				<button class="hand-card" class:selected={selectedCard?.id === card.id} class:playable={isMyTurn && !isProcessing}
					on:click={() => handleCardClick(card)}
					disabled={!isMyTurn || isProcessing}>
					<Card {card} size="medium" isPlayable={isMyTurn && !isProcessing} isSelected={selectedCard?.id === card.id} />
				</button>
			{/each}
		</div>
		{#if actionError}<div class="action-error">ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â {actionError}</div>{/if}
		{#if selectedCard && isMyTurn}
			<div class="action-buttons">
				<p class="selected-info">Playing: <strong>{selectedCard.rank} of {selectedCard.suit}</strong>
					{#if selectedTableCards.length > 0}<span class="with-cards">+ {selectedTableCards.length} table card{selectedTableCards.length > 1 ? 's' : ''}</span>{/if}
				</p>
				<div class="buttons">
					<button class="btn-action btn-capture" on:click={handleCapture} disabled={isProcessing || (selectedTableCards.length === 0 && selectedBuildIds.length === 0)}>
						{#if isProcessing}<span class="spinner"></span>{:else}ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¯ Capture{/if}
					</button>
					<button class="btn-action btn-build" on:click={handleBuildAction} disabled={isProcessing || selectedTableCards.length === 0}>
						{#if isProcessing}<span class="spinner"></span>{:else}ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Build{/if}
					</button>
					<button class="btn-action btn-trail" on:click={handleTrail} disabled={isProcessing}>
						{#if isProcessing}<span class="spinner"></span>{:else}ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â¤ Trail{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showBuildModal}
<div class="modal-overlay" on:click={cancelBuildModal}>
	<div class="modal" on:click|stopPropagation>
		<h3 class="modal-title">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Create Build</h3>
		<p class="modal-desc">Combining <strong>{selectedCard?.rank} of {selectedCard?.suit}</strong> with {selectedTableCards.length} table card{selectedTableCards.length > 1 ? 's' : ''}</p>
		<div class="build-value-selector">
			<label for="build-value">Build Value:</label>
			<select id="build-value" bind:value={buildValue}>{#each possibleBuildValues as value}<option value={value}>{value}</option>{/each}</select>
		</div>
		<p class="modal-hint">You must have a card worth {buildValue} in your hand to capture this build later.</p>
		<div class="modal-buttons">
			<button class="btn-cancel" on:click={cancelBuildModal}>Cancel</button>
			<button class="btn-confirm" on:click={confirmBuild} disabled={isProcessing}>{#if isProcessing}<span class="spinner"></span>{:else}Confirm Build{/if}</button>
		</div>
	</div>
</div>
{/if}
{#if showExitConfirm}
<div class="modal-overlay" on:click={handleExitCancel}>
	<div class="modal" on:click|stopPropagation>
		<h3 class="modal-title">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Âª Leave Game?</h3>
		<p class="modal-desc">Are you sure you want to leave? The game will end.</p>
		<div class="modal-buttons">
			<button class="btn-cancel" on:click={handleExitCancel}>Stay</button>
			<button class="btn-confirm btn-exit-confirm" on:click={handleExitConfirm}>Leave Game</button>
		</div>
	</div>
</div>
{/if}

{#if isGameFinished}
<div class="game-finished-overlay">
	<div class="game-finished-content">
		<h2 class="finished-title">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  Game Over!</h2>
		{#if winner}<p class="winner-text">{winnerName || (winner === 1 ? 'Player 1' : 'Player 2')} Wins!</p>{:else}<p class="tie-text">It's a Tie!</p>{/if}
		<div class="final-scores">
			<div class="score-row"><span class="score-name">{players[0]?.name || 'Player 1'}</span><span class="score-value">{gameState?.player1Score || 0}</span></div>
			<div class="score-divider">vs</div>
			<div class="score-row"><span class="score-name">{players[1]?.name || 'Player 2'}</span><span class="score-value">{gameState?.player2Score || 0}</span></div>
		</div>
		<button class="btn-end-game" on:click={handleEndGame}>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Âª End Game</button>
	</div>
</div>
{/if}

<style>
.game-board { display: flex; flex-direction: column; gap: 1.5rem; max-width: 1200px; margin: 0 auto; padding: 1rem; }
.exit-button-container { display: flex; justify-content: flex-end; margin-bottom: -0.5rem; }
.btn-exit { padding: 0.5rem 1rem; border-radius: 0.5rem; border: 2px solid rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
.btn-exit:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; transform: translateY(-1px); }
.btn-exit-confirm { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important; }
.player-info { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: rgba(30, 41, 59, 0.8); border-radius: 0.5rem; margin-bottom: 0.5rem; }
.player-name { font-weight: 600; color: var(--text-primary); font-size: 1.125rem; }
.player-stats { color: var(--text-secondary); font-size: 0.875rem; }
.turn-indicator { margin-left: auto; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: rgba(107, 114, 128, 0.3); color: #9ca3af; }
.turn-indicator.my-turn { background: rgba(16, 185, 129, 0.2); color: #10b981; animation: pulse 2s infinite; }
.hand { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.25rem; min-height: 100px; }
.opponent-hand { gap: 0.125rem; }
.card-back { width: 60px; height: 84px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 0.375rem; border: 2px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
.card-back-design { opacity: 0.5; }

.hand-card { background: none; border: none; padding: 0; cursor: pointer; transition: transform 0.2s; position: relative; touch-action: none; }
.hand-card:disabled { cursor: not-allowed; opacity: 0.7; }
.hand-card.playable:hover { transform: translateY(-8px); }
.hand-card.selected { transform: translateY(-16px); }
.hand-card.playable:hover .table-area { background: rgba(22, 101, 52, 0.3); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 1rem; padding: 1.5rem; min-height: 200px; }
.table-title { text-align: center; color: var(--casino-gold); font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
.table-hint { text-align: center; color: #10b981; font-size: 0.875rem; margin-bottom: 1rem; animation: pulse 2s infinite; }
.table-cards { display: flex; justify-content: center; flex-wrap: wrap; gap: 0.5rem; }
.empty-table { text-align: center; color: var(--text-secondary); font-style: italic; }
.table-card-btn { background: none; border: 3px solid transparent; border-radius: 0.5rem; padding: 0; cursor: pointer; transition: all 0.2s; touch-action: none; }
.table-card-btn:disabled { cursor: default; }
.table-card-btn.selectable:hover { transform: scale(1.05); border-color: rgba(16, 185, 129, 0.5); }
.table-card-btn.selected { border-color: #10b981; transform: scale(1.08); box-shadow: 0 0 12px rgba(16, 185, 129, 0.5); }

.builds-area { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1); }
.builds-title { text-align: center; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
.builds { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; }
.build-btn { background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 0.5rem; padding: 0.5rem; cursor: pointer; transition: all 0.2s; }
.build-btn:disabled { cursor: default; }
.build-btn.my-build { border-color: var(--casino-gold); }
.build-btn.selected { border-color: #10b981; transform: scale(1.08); box-shadow: 0 0 12px rgba(16, 185, 129, 0.5); }
.build-value { display: block; text-align: center; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
.build-cards { display: flex; gap: 0.25rem; }
.selection-summary { display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 1rem; padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 0.5rem; }
.selection-label { color: var(--text-secondary); font-size: 0.875rem; }
.selection-count { color: #10b981; font-weight: 600; font-size: 0.875rem; }
.action-buttons { margin-top: 1rem; text-align: center; }
.selected-info { color: var(--casino-gold); font-size: 0.875rem; margin-bottom: 0.75rem; }
.with-cards { color: #10b981; margin-left: 0.5rem; }
.action-error { text-align: center; color: #ef4444; font-size: 0.875rem; padding: 0.5rem; margin-top: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 0.5rem; }
.buttons { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }

.btn-action { padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; min-width: 120px; justify-content: center; }
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
.btn-capture { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
.btn-build { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
.btn-trail { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; }
.btn-action:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid var(--casino-gold); border-radius: 1rem; padding: 2rem; max-width: 400px; width: 90%; }
.modal-title { color: var(--casino-gold); font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; text-align: center; }
.modal-desc { color: var(--text-secondary); text-align: center; margin-bottom: 1.5rem; }
.build-value-selector { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
.build-value-selector label { color: var(--text-primary); font-weight: 600; }
.build-value-selector select { padding: 0.5rem 1rem; border-radius: 0.5rem; border: 2px solid var(--casino-gold); background: rgba(0, 0, 0, 0.3); color: var(--text-primary); font-size: 1.25rem; font-weight: 700; cursor: pointer; }
.modal-hint { color: var(--text-secondary); font-size: 0.875rem; text-align: center; margin-bottom: 1.5rem; font-style: italic; }
.modal-buttons { display: flex; gap: 1rem; justify-content: center; }

.btn-cancel { padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: 2px solid rgba(255, 255, 255, 0.2); background: transparent; color: var(--text-secondary); font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { border-color: rgba(255, 255, 255, 0.4); color: var(--text-primary); }
.btn-confirm { padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
.btn-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
@keyframes menu-pop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.action-menu-close:hover { color: var(--text-primary); }
.action-menu-btn.capture { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.action-menu-btn.build { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.action-menu-btn.trail { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); }
.action-menu-btn:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
.game-finished-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 300; animation: fade-in 0.5s ease-out; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.game-finished-content { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 3px solid var(--casino-gold); border-radius: 1.5rem; padding: 3rem 2.5rem; text-align: center; max-width: 400px; width: 90%; animation: scale-in 0.5s ease-out; }
@keyframes scale-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
.finished-title { font-size: 2.5rem; font-weight: 700; color: var(--casino-gold); margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(212, 175, 55, 0.3); }
.winner-text { font-size: 1.75rem; font-weight: 700; color: #10b981; margin-bottom: 1.5rem; animation: pulse-glow 2s ease-in-out infinite; }
@keyframes pulse-glow { 0%, 100% { text-shadow: 0 0 10px rgba(16, 185, 129, 0.5); } 50% { text-shadow: 0 0 20px rgba(16, 185, 129, 0.8); } }
.tie-text { font-size: 1.5rem; color: var(--text-secondary); margin-bottom: 1.5rem; }
.final-scores { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 2rem; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 0.75rem; }
.score-row { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.score-name { font-size: 0.875rem; color: var(--text-secondary); }
.score-value { font-size: 2rem; font-weight: 700; color: var(--casino-gold); }
.score-divider { font-size: 1.25rem; color: var(--text-secondary); font-weight: 600; }
.btn-end-game { padding: 1rem 2rem; border-radius: 0.75rem; border: none; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; font-size: 1.125rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
.btn-end-game:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
</style>
