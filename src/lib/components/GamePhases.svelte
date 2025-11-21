<script lang="ts">
	import { gameStore } from '$stores/gameStore';
	import { Button, Card } from '$components';
	import type { Card as CardType } from '$types/game';
	
	export let onReady: (() => void) | undefined = undefined;
	export let onStartShuffle: (() => void) | undefined = undefined;
	export let onSelectFaceUpCards: ((cardIds: string[]) => void) | undefined = undefined;
	
	let selectedFaceUpCards: string[] = [];
	
	$: gameState = $gameStore.gameState;
	$: phase = gameState?.phase || 'waiting';
	$: players = gameState?.players || [];
	$: player1 = players[0];
	$: player2 = players[1];
	$: isPlayer1 = player1?.id === $gameStore.playerId;
	$: myReady = isPlayer1 ? gameState?.player1_ready : gameState?.player2_ready;
	$: opponentReady = isPlayer1 ? gameState?.player2_ready : gameState?.player1_ready;
	
	function handleReady() {
		if (onReady) {
			onReady();
		}
	}
	
	function handleStartShuffle() {
		if (onStartShuffle) {
			onStartShuffle();
		}
	}
	
	function handleCardSelect(card: CardType) {
		const index = selectedFaceUpCards.indexOf(card.id);
		if (index > -1) {
			selectedFaceUpCards = selectedFaceUpCards.filter(id => id !== card.id);
		} else if (selectedFaceUpCards.length < 4) {
			selectedFaceUpCards = [...selectedFaceUpCards, card.id];
		}
	}
	
	function handleConfirmFaceUpCards() {
		if (selectedFaceUpCards.length === 4 && onSelectFaceUpCards) {
			onSelectFaceUpCards(selectedFaceUpCards);
		}
	}
	
	$: canConfirmFaceUp = selectedFaceUpCards.length === 4;
</script>

<div class="game-phases">
	{#if phase === 'waiting'}
		<!-- Waiting Phase -->
		<div class="phase-container waiting-phase">
			<h2 class="phase-title">Ready to Play?</h2>
			<p class="phase-description">
				Both players must be ready to start the game
			</p>
			
			<div class="ready-status">
				<div class="player-status">
					<span class="player-name">{player1?.name || 'Player 1'}</span>
					<span class="status-badge {gameState?.player1_ready ? 'ready' : 'not-ready'}">
						{gameState?.player1_ready ? '✓ Ready' : '⏳ Not Ready'}
					</span>
				</div>
				
				<div class="vs-divider">VS</div>
				
				<div class="player-status">
					<span class="player-name">{player2?.name || 'Player 2'}</span>
					<span class="status-badge {gameState?.player2_ready ? 'ready' : 'not-ready'}">
						{gameState?.player2_ready ? '✓ Ready' : '⏳ Not Ready'}
					</span>
				</div>
			</div>
			
			{#if !myReady}
				<Button variant="success" size="large" fullWidth onClick={handleReady}>
					I'm Ready!
				</Button>
			{:else}
				<div class="waiting-message">
					<p>Waiting for opponent...</p>
					<div class="spinner-large"></div>
				</div>
			{/if}
		</div>
		
	{:else if phase === 'dealer'}
		<!-- Dealer Phase -->
		<div class="phase-container dealer-phase">
			<h2 class="phase-title">Dealer Phase</h2>
			
			{#if !gameState?.shuffle_complete}
				<!-- Shuffle Step -->
				<div class="shuffle-step">
					<p class="phase-description">
						{isPlayer1 ? 'Shuffle the deck to begin' : 'Player 1 is shuffling the deck'}
					</p>
					
					{#if isPlayer1}
						<div class="shuffle-animation">
							<div class="deck-stack">
								{#each Array(5) as _, i}
									<div class="deck-card" style="--index: {i}"></div>
								{/each}
							</div>
						</div>
						
						<Button variant="primary" size="large" fullWidth onClick={handleStartShuffle}>
							🎴 Shuffle Deck
						</Button>
					{:else}
						<div class="waiting-message">
							<div class="spinner-large"></div>
						</div>
					{/if}
				</div>
				
			{:else if !gameState?.card_selection_complete}
				<!-- Card Selection Step -->
				<div class="card-selection-step">
					<p class="phase-description">
						{isPlayer1 
							? 'Select 4 cards to place face-up on the table' 
							: 'Player 1 is selecting face-up cards'}
					</p>
					
					{#if isPlayer1}
						<div class="selection-info">
							<span class="selected-count">
								{selectedFaceUpCards.length} / 4 cards selected
							</span>
						</div>
						
						<!-- Show deck cards for selection -->
						<div class="deck-selection">
							{#if gameState?.deck && gameState.deck.length > 0}
								<div class="cards-grid">
									{#each gameState.deck.slice(0, 12) as card (card.id)}
										<div class="selectable-card {selectedFaceUpCards.includes(card.id) ? 'selected' : ''}">
											<Card
												{card}
												size="medium"
												isPlayable={true}
												onClick={() => handleCardSelect(card)}
											/>
											{#if selectedFaceUpCards.includes(card.id)}
												<div class="selection-number">
													{selectedFaceUpCards.indexOf(card.id) + 1}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
						
						<Button
							variant="success"
							size="large"
							fullWidth
							disabled={!canConfirmFaceUp}
							onClick={handleConfirmFaceUpCards}
						>
							Confirm Selection
						</Button>
					{:else}
						<div class="waiting-message">
							<div class="spinner-large"></div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
		
	{:else if phase === 'finished'}
		<!-- Game Finished -->
		<div class="phase-container finished-phase">
			<h2 class="phase-title">🏆 Game Over!</h2>
			
			{#if gameState?.winner}
				<div class="winner-announcement">
					<p class="winner-text">
						{gameState.winner === 1 ? player1?.name : player2?.name} Wins!
					</p>
					<p class="final-score">
						Final Score: {gameState.player1_score} - {gameState.player2_score}
					</p>
				</div>
			{:else}
				<p class="tie-text">It's a tie!</p>
			{/if}
			
			<Button variant="primary" size="large" fullWidth>
				Play Again
			</Button>
		</div>
	{/if}
</div>

<style>
	.game-phases {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.phase-container {
		background: rgba(30, 41, 59, 0.8);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 3rem 2rem;
		border: 2px solid var(--casino-gold);
		text-align: center;
		animation: fade-in 0.5s ease-out;
	}
	
	.phase-title {
		font-size: 2rem;
		font-weight: 700;
		color: var(--casino-gold);
		margin-bottom: 1rem;
	}
	
	.phase-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
	}
	
	/* Ready Status */
	.ready-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
	}
	
	.player-status {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.player-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.875rem;
	}
	
	.status-badge.ready {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
		border: 1px solid #10b981;
	}
	
	.status-badge.not-ready {
		background: rgba(107, 114, 128, 0.2);
		color: #9ca3af;
		border: 1px solid #6b7280;
	}
	
	.vs-divider {
		font-size: 2rem;
		font-weight: 700;
		color: var(--casino-gold);
	}
	
	/* Waiting Message */
	.waiting-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: var(--text-secondary);
	}
	
	.spinner-large {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-top-color: var(--casino-gold);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	/* Shuffle Animation */
	.shuffle-animation {
		margin: 2rem 0;
		display: flex;
		justify-content: center;
	}
	
	.deck-stack {
		position: relative;
		width: 100px;
		height: 140px;
	}
	
	.deck-card {
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
		border-radius: 0.5rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		transform: translateY(calc(var(--index) * -4px)) rotate(calc(var(--index) * 2deg));
		animation: card-shuffle 2s ease-in-out infinite;
		animation-delay: calc(var(--index) * 0.1s);
	}
	
	/* Card Selection */
	.selection-info {
		margin-bottom: 1.5rem;
	}
	
	.selected-count {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--casino-gold);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.5rem 1rem;
		border-radius: 9999px;
	}
	
	.deck-selection {
		margin-bottom: 2rem;
		max-height: 400px;
		overflow-y: auto;
	}
	
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 1rem;
		padding: 1rem;
	}
	
	.selectable-card {
		position: relative;
		transition: transform 0.2s;
	}
	
	.selectable-card.selected {
		transform: translateY(-10px);
	}
	
	.selection-number {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 28px;
		height: 28px;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 0.875rem;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
	}
	
	/* Winner Announcement */
	.winner-announcement {
		margin: 2rem 0;
	}
	
	.winner-text {
		font-size: 2rem;
		font-weight: 700;
		color: var(--casino-gold);
		margin-bottom: 1rem;
		animation: pulse-scale 2s ease-in-out infinite;
	}
	
	.final-score {
		font-size: 1.5rem;
		color: var(--text-primary);
	}
	
	.tie-text {
		font-size: 1.5rem;
		color: var(--text-secondary);
		margin: 2rem 0;
	}
	
	/* Animations */
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	@keyframes card-shuffle {
		0%, 100% {
			transform: translateY(calc(var(--index) * -4px)) rotate(calc(var(--index) * 2deg));
		}
		50% {
			transform: translateY(calc(var(--index) * -8px)) rotate(calc(var(--index) * -2deg));
		}
	}
	
	@keyframes pulse-scale {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.phase-container {
			padding: 2rem 1.5rem;
		}
		
		.ready-status {
			flex-direction: column;
			gap: 1rem;
		}
		
		.vs-divider {
			transform: rotate(90deg);
		}
		
		.cards-grid {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: 0.5rem;
		}
	}
</style>
