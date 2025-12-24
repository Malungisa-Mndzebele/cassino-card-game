<script lang="ts">
	import { gameStore } from '$stores/gameStore';
	import { connectionStore } from '$stores/connectionStore';
	import { Card } from '$components';
	import type { Card as CardType } from '$types/game';
	
	// Reactive state from store
	$: gameState = $gameStore.gameState;
	$: playerId = $gameStore.playerId;
	$: players = gameState?.players || [];
	
	// Compare as strings to handle type mismatch (API returns number, store has string)
	$: isPlayer1 = String(players[0]?.id) === String(playerId);
	
	// Get the correct hand based on which player we are
	$: myHand = isPlayer1 ? (gameState?.player1Hand || []) : (gameState?.player2Hand || []);
	$: opponentHand = isPlayer1 ? (gameState?.player2Hand || []) : (gameState?.player1Hand || []);
	$: tableCards = gameState?.tableCards || [];
	$: builds = gameState?.builds || [];
	
	// Turn info
	$: currentTurn = gameState?.currentTurn || 1;
	$: isMyTurn = (isPlayer1 && currentTurn === 1) || (!isPlayer1 && currentTurn === 2);
	
	// Player names
	$: myName = isPlayer1 ? players[0]?.name : players[1]?.name;
	$: opponentName = isPlayer1 ? players[1]?.name : players[0]?.name;
	
	// Scores
	$: myScore = isPlayer1 ? (gameState?.player1Score || 0) : (gameState?.player2Score || 0);
	$: opponentScore = isPlayer1 ? (gameState?.player2Score || 0) : (gameState?.player1Score || 0);
	
	// Captured cards count
	$: myCaptured = isPlayer1 ? (gameState?.player1Captured?.length || 0) : (gameState?.player2Captured?.length || 0);
	$: opponentCaptured = isPlayer1 ? (gameState?.player2Captured?.length || 0) : (gameState?.player1Captured?.length || 0);
	
	// Selected card for playing
	let selectedCard: CardType | null = null;
	let showExitConfirm = false;
	
	function handleCardClick(card: CardType) {
		if (!isMyTurn) return;
		selectedCard = selectedCard?.id === card.id ? null : card;
	}
	
	function handleExitClick() {
		showExitConfirm = true;
	}
	
	function handleExitConfirm() {
		// Disconnect WebSocket
		connectionStore.disconnect();
		// Clear game state and return to lobby
		gameStore.reset();
		showExitConfirm = false;
	}
	
	function handleExitCancel() {
		showExitConfirm = false;
	}
	
	// Debug logging
	$: if (playerId && players.length > 0) {
		console.log('GameBoard Debug:', {
			playerId,
			playerIdType: typeof playerId,
			player1Id: players[0]?.id,
			player1IdType: typeof players[0]?.id,
			isPlayer1,
			myHandCount: myHand.length,
			opponentHandCount: opponentHand.length
		});
	}
</script>

<div class="game-board">
	<!-- Opponent Area -->
	<div class="opponent-area">
		<div class="player-info opponent">
			<span class="player-name">{opponentName || 'Opponent'}</span>
			<span class="player-stats">
				Score: {opponentScore} | Captured: {opponentCaptured}
			</span>
			{#if !isMyTurn}
				<span class="turn-indicator">Their Turn</span>
			{/if}
		</div>
		
		<!-- Opponent's hand (face down) -->
		<div class="hand opponent-hand">
			{#each opponentHand as _, i}
				<div class="card-back" style="--index: {i}">
					<div class="card-back-design">🎴</div>
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Table Area -->
	<div class="table-area">
		<h3 class="table-title">Table ({tableCards.length} cards)</h3>
		
		<div class="table-cards">
			{#if tableCards.length === 0}
				<p class="empty-table">No cards on table</p>
			{:else}
				{#each tableCards as card}
					<Card {card} size="medium" isPlayable={false} />
				{/each}
			{/if}
		</div>
		
		<!-- Builds -->
		{#if builds.length > 0}
			<div class="builds-area">
				<h4 class="builds-title">Builds</h4>
				<div class="builds">
					{#each builds as build}
						<div class="build" class:my-build={build.owner === (isPlayer1 ? 1 : 2)}>
							<span class="build-value">Value: {build.value}</span>
							<div class="build-cards">
								{#each build.cards as card}
									<Card {card} size="small" isPlayable={false} />
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- My Area -->
	<div class="my-area">
		<div class="player-info me">
			<span class="player-name">{myName || 'You'}</span>
			<span class="player-stats">
				Score: {myScore} | Captured: {myCaptured}
			</span>
			{#if isMyTurn}
				<span class="turn-indicator my-turn">Your Turn!</span>
			{/if}
		</div>
		
		<!-- My hand -->
		<div class="hand my-hand">
			{#each myHand as card}
				<button
					class="hand-card"
					class:selected={selectedCard?.id === card.id}
					class:playable={isMyTurn}
					on:click={() => handleCardClick(card)}
					disabled={!isMyTurn}
				>
					<Card {card} size="medium" isPlayable={isMyTurn} isSelected={selectedCard?.id === card.id} />
				</button>
			{/each}
		</div>
		
		{#if selectedCard && isMyTurn}
			<div class="action-buttons">
				<p class="selected-info">Selected: {selectedCard.rank} of {selectedCard.suit}</p>
				<div class="buttons">
					<button class="btn-action btn-capture">Capture</button>
					<button class="btn-action btn-build">Build</button>
					<button class="btn-action btn-trail">Trail</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.game-board {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	/* Player Info */
	.player-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(30, 41, 59, 0.8);
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.player-name {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1.125rem;
	}
	
	.player-stats {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.turn-indicator {
		margin-left: auto;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(107, 114, 128, 0.3);
		color: #9ca3af;
	}
	
	.turn-indicator.my-turn {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
		animation: pulse 2s infinite;
	}
	
	/* Hands */
	.hand {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		min-height: 100px;
	}
	
	.opponent-hand {
		gap: 0.125rem;
	}
	
	.card-back {
		width: 60px;
		height: 84px;
		background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
		border-radius: 0.375rem;
		border: 2px solid rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	
	.card-back-design {
		opacity: 0.5;
	}
	
	.hand-card {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: transform 0.2s;
	}
	
	.hand-card:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}
	
	.hand-card.playable:hover {
		transform: translateY(-8px);
	}
	
	.hand-card.selected {
		transform: translateY(-16px);
	}
	
	/* Table Area */
	.table-area {
		background: rgba(22, 101, 52, 0.3);
		border: 2px solid rgba(34, 197, 94, 0.3);
		border-radius: 1rem;
		padding: 1.5rem;
		min-height: 200px;
	}
	
	.table-title {
		text-align: center;
		color: var(--casino-gold);
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}
	
	.table-cards {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.empty-table {
		text-align: center;
		color: var(--text-secondary);
		font-style: italic;
	}
	
	/* Builds */
	.builds-area {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.builds-title {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
	
	.builds {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.build {
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		padding: 0.5rem;
	}
	
	.build.my-build {
		border-color: var(--casino-gold);
	}
	
	.build-value {
		display: block;
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}
	
	.build-cards {
		display: flex;
		gap: 0.25rem;
	}
	
	/* Action Buttons */
	.action-buttons {
		margin-top: 1rem;
		text-align: center;
	}
	
	.selected-info {
		color: var(--casino-gold);
		font-weight: 600;
		margin-bottom: 0.5rem;
	}
	
	.buttons {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}
	
	.btn-action {
		padding: 0.5rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.btn-capture {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
	}
	
	.btn-build {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
	}
	
	.btn-trail {
		background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
		color: white;
	}
	
	.btn-action:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	
	/* Animations */
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.game-board {
			padding: 0.5rem;
		}
		
		.player-info {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
		
		.turn-indicator {
			margin-left: 0;
		}
		
		.card-back {
			width: 45px;
			height: 63px;
			font-size: 1rem;
		}
	}
</style>
