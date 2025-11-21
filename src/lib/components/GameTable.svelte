<script lang="ts">
	import { gameStore, currentPlayer, isMyTurn } from '$stores/gameStore';
	import { PlayerHand, TableCards, Card, Button } from '$components';
	import type { Card as CardType } from '$types/game';
	
	// Component state
	let selectedHandCard: CardType | null = null;
	let selectedTableCards: string[] = [];
	let actionType: 'capture' | 'build' | 'trail' | null = null;
	let buildValue: number | null = null;
	
	// Reactive state
	$: gameState = $gameStore.gameState;
	$: players = gameState?.players || [];
	$: player1 = players[0];
	$: player2 = players[1];
	$: myHand = $isMyTurn && player1?.id === $gameStore.playerId 
		? gameState?.player1_hand || []
		: player2?.id === $gameStore.playerId
		? gameState?.player2_hand || []
		: [];
	$: opponentHand = $isMyTurn && player1?.id === $gameStore.playerId
		? gameState?.player2_hand || []
		: gameState?.player1_hand || [];
	$: tableCards = gameState?.table_cards || [];
	$: builds = gameState?.builds || [];
	
	function handleHandCardClick(card: CardType) {
		if (selectedHandCard?.id === card.id) {
			selectedHandCard = null;
		} else {
			selectedHandCard = card;
		}
	}
	
	function handleTableCardClick(card: CardType) {
		const index = selectedTableCards.indexOf(card.id);
		if (index > -1) {
			selectedTableCards = selectedTableCards.filter(id => id !== card.id);
		} else {
			selectedTableCards = [...selectedTableCards, card.id];
		}
	}
	
	function handleCapture() {
		if (!selectedHandCard || selectedTableCards.length === 0) return;
		
		// TODO: Call API to play capture action
		console.log('Capture:', selectedHandCard, selectedTableCards);
		resetSelection();
	}
	
	function handleBuild() {
		if (!selectedHandCard) return;
		
		// TODO: Show build value input dialog
		console.log('Build:', selectedHandCard);
		resetSelection();
	}
	
	function handleTrail() {
		if (!selectedHandCard) return;
		
		// TODO: Call API to play trail action
		console.log('Trail:', selectedHandCard);
		resetSelection();
	}
	
	function resetSelection() {
		selectedHandCard = null;
		selectedTableCards = [];
		actionType = null;
		buildValue = null;
	}
	
	$: canCapture = selectedHandCard !== null && selectedTableCards.length > 0;
	$: canBuild = selectedHandCard !== null;
	$: canTrail = selectedHandCard !== null && selectedTableCards.length === 0;
</script>

<div class="game-table">
	<!-- Opponent Area -->
	<div class="opponent-area">
		<div class="opponent-info">
			<h3 class="player-name">
				{player2?.name || 'Opponent'}
				{#if !$isMyTurn}
					<span class="turn-badge">Playing...</span>
				{/if}
			</h3>
			<span class="card-count">{opponentHand.length} cards</span>
		</div>
		
		<!-- Opponent Hand (face-down) -->
		<div class="opponent-hand">
			{#each opponentHand as card, i (card.id || i)}
				<div class="opponent-card" style="--index: {i}">
					<Card card={card} isHidden={true} size="medium" />
				</div>
			{/each}
		</div>
	</div>
	
	<!-- Table Area -->
	<div class="table-area">
		<TableCards
			cards={tableCards}
			{builds}
			onCardClick={handleTableCardClick}
			selectedCardIds={selectedTableCards}
			isSelectable={$isMyTurn && selectedHandCard !== null}
		/>
	</div>
	
	<!-- Player Area -->
	<div class="player-area">
		<!-- Action Buttons -->
		{#if $isMyTurn && selectedHandCard}
			<div class="action-buttons">
				<Button
					variant="success"
					size="medium"
					disabled={!canCapture}
					onClick={handleCapture}
				>
					🎯 Capture
				</Button>
				<Button
					variant="primary"
					size="medium"
					disabled={!canBuild}
					onClick={handleBuild}
				>
					🏗️ Build
				</Button>
				<Button
					variant="secondary"
					size="medium"
					disabled={!canTrail}
					onClick={handleTrail}
				>
					🚶 Trail
				</Button>
				<Button
					variant="danger"
					size="small"
					onClick={resetSelection}
				>
					✕ Cancel
				</Button>
			</div>
		{/if}
		
		<!-- Player Hand -->
		<PlayerHand
			cards={myHand}
			isMyTurn={$isMyTurn}
			onCardClick={handleHandCardClick}
			selectedCardId={selectedHandCard?.id || null}
			label={`${player1?.name || 'Your'} Hand`}
		/>
	</div>
	
	<!-- Last Action Display -->
	{#if gameState?.last_action}
		<div class="last-action">
			<span class="last-action-label">Last Action:</span>
			<span class="last-action-text">{gameState.last_action}</span>
		</div>
	{/if}
</div>

<style>
	.game-table {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		position: relative;
	}
	
	/* Opponent Area */
	.opponent-area {
		background: rgba(30, 41, 59, 0.4);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.opponent-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.player-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.turn-badge {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		animation: pulse-glow 2s infinite;
	}
	
	.card-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
	}
	
	.opponent-hand {
		display: flex;
		gap: -2rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.opponent-card {
		transform: translateX(calc(var(--index) * -40px));
		transition: transform 0.3s ease;
	}
	
	.opponent-card:hover {
		transform: translateX(calc(var(--index) * -40px)) translateY(-10px);
	}
	
	/* Table Area */
	.table-area {
		min-height: 300px;
	}
	
	/* Player Area */
	.player-area {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.action-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		padding: 1rem;
		background: rgba(30, 41, 59, 0.6);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 2px solid var(--casino-gold);
		animation: slide-up 0.3s ease-out;
	}
	
	/* Last Action */
	.last-action {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.9);
		border: 2px solid var(--casino-gold);
		border-radius: 0.5rem;
		padding: 0.75rem 1.5rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		pointer-events: none;
		z-index: 10;
		animation: fade-in-out 3s ease-out forwards;
	}
	
	.last-action-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.last-action-text {
		font-size: 1rem;
		font-weight: 600;
		color: var(--casino-gold);
	}
	
	/* Animations */
	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
		}
		50% {
			box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
		}
	}
	
	@keyframes slide-up {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	@keyframes fade-in-out {
		0% {
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.game-table {
			gap: 1rem;
		}
		
		.opponent-area,
		.player-area {
			padding: 1rem;
		}
		
		.opponent-hand {
			gap: 0.5rem;
		}
		
		.opponent-card {
			transform: none;
		}
		
		.action-buttons {
			gap: 0.5rem;
		}
	}
</style>
