<script lang="ts">
	import { gameStore } from '$stores/gameStore';
	import { connectionStore } from '$stores/connectionStore';
	import { Button, Card, DealerAnimation } from '$components';
	import { startGame, leaveRoom } from '$lib/utils/api';
	import type { Card as CardType } from '$types/game';
	
	export let onReady: (() => void) | undefined = undefined;
	export let onStartShuffle: (() => void) | undefined = undefined;
	export let onSelectFaceUpCards: ((cardIds: string[]) => void) | undefined = undefined;
	export let onGameStarted: (() => void) | undefined = undefined;
	export let onQuit: (() => void) | undefined = undefined;
	
	let selectedFaceUpCards: string[] = [];
	let showDealerAnimation = false;
	let dealerAnimationComplete = false;
	let isStartingGame = false;
	let startGameError = '';
	let isQuitting = false;
	
	$: gameState = $gameStore.gameState;
	$: phase = gameState?.phase || 'waiting';
	$: players = gameState?.players || [];
	$: player1 = players[0];
	$: player2 = players[1];
	$: isPlayer1 = player1?.id === $gameStore.playerId;
	$: myReady = isPlayer1 ? gameState?.player1Ready : gameState?.player2Ready;
	$: opponentReady = isPlayer1 ? gameState?.player2Ready : gameState?.player1Ready;
	
	// Show dealer animation when phase changes to 'dealer' and animation hasn't been shown
	$: if (phase === 'dealer' && !dealerAnimationComplete && !showDealerAnimation) {
		showDealerAnimation = true;
	}
	
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
	
	async function handleQuit() {
		if (isQuitting) return;
		
		const confirmMessage = phase === 'waiting' 
			? 'Are you sure you want to leave the room?'
			: 'Are you sure you want to quit? You will forfeit the game.';
		
		if (!confirm(confirmMessage)) return;
		
		isQuitting = true;
		
		try {
			if ($gameStore.roomId && $gameStore.playerId) {
				await leaveRoom($gameStore.roomId, $gameStore.playerId);
			}
		} catch (err) {
			console.error('Failed to leave room:', err);
		} finally {
			// Always disconnect and reset, even if API call fails
			connectionStore.disconnect();
			gameStore.reset();
			isQuitting = false;
			
			if (onQuit) {
				onQuit();
			}
		}
	}
	
	async function handleDealerAnimationComplete() {
		showDealerAnimation = false;
		dealerAnimationComplete = true;
		
		// Automatically start the game after dealer animation
		if ($gameStore.roomId && $gameStore.playerId) {
			isStartingGame = true;
			startGameError = '';
			
			try {
				const response = await startGame($gameStore.roomId, $gameStore.playerId);
				
				if (response.success && response.game_state) {
					// Update game state with the new state from server
					await gameStore.setGameState(response.game_state);
					
					if (onGameStarted) {
						onGameStarted();
					}
				} else {
					startGameError = response.message || 'Failed to start game';
				}
			} catch (error) {
				console.error('Error starting game:', error);
				startGameError = error instanceof Error ? error.message : 'Failed to start game';
			} finally {
				isStartingGame = false;
			}
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

<!-- Dealer Animation Overlay -->
{#if showDealerAnimation}
	<DealerAnimation 
		onComplete={handleDealerAnimationComplete}
		autoComplete={true}
		duration={4000}
	/>
{/if}

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
					<span class="status-badge {gameState?.player1Ready ? 'ready' : 'not-ready'}">
						{gameState?.player1Ready ? '✓ Ready' : '⏳ Not Ready'}
					</span>
				</div>
				
				<div class="vs-divider">VS</div>
				
				<div class="player-status">
					<span class="player-name">{player2?.name || 'Player 2'}</span>
					<span class="status-badge {gameState?.player2Ready ? 'ready' : 'not-ready'}">
						{gameState?.player2Ready ? '✓ Ready' : '⏳ Not Ready'}
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
			
			<!-- Quit Button -->
			<button 
				class="quit-button"
				on:click={handleQuit}
				disabled={isQuitting}
			>
				{#if isQuitting}
					<span class="spinner-small"></span> Leaving...
				{:else}
					🚪 Leave Room
				{/if}
			</button>
		</div>
		
	{:else if phase === 'dealer'}
		<!-- Dealer Phase -->
		<div class="phase-container dealer-phase">
			{#if isStartingGame}
				<!-- Starting game after dealer animation -->
				<h2 class="phase-title">🎴 Starting Game...</h2>
				<div class="waiting-message">
					<p>Dealing cards to players...</p>
					<div class="spinner-large"></div>
				</div>
			{:else if startGameError}
				<!-- Error starting game -->
				<h2 class="phase-title">⚠️ Error</h2>
				<p class="phase-description error-text">{startGameError}</p>
				<Button variant="primary" size="large" fullWidth onClick={handleDealerAnimationComplete}>
					Try Again
				</Button>
				
				<!-- Quit Button -->
				<button 
					class="quit-button"
					on:click={handleQuit}
					disabled={isQuitting}
				>
					{#if isQuitting}
						<span class="spinner-small"></span> Leaving...
					{:else}
						🚪 Leave Room
					{/if}
				</button>
			{:else if dealerAnimationComplete}
				<!-- Waiting for game state update -->
				<h2 class="phase-title">🎴 Getting Ready...</h2>
				<div class="waiting-message">
					<p>Preparing the game...</p>
					<div class="spinner-large"></div>
				</div>
			{:else}
				<!-- Waiting for dealer animation to start -->
				<h2 class="phase-title">🎴 Both Players Ready!</h2>
				<div class="waiting-message">
					<p>The dealer is preparing...</p>
					<div class="spinner-large"></div>
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
						Final Score: {gameState.player1Score} - {gameState.player2Score}
					</p>
				</div>
			{:else}
				<p class="tie-text">It's a tie!</p>
			{/if}
			
			<div class="finished-buttons">
				<Button variant="primary" size="large" fullWidth>
					Play Again
				</Button>
				
				<!-- Quit Button -->
				<button 
					class="quit-button"
					on:click={handleQuit}
					disabled={isQuitting}
				>
					{#if isQuitting}
						<span class="spinner-small"></span> Leaving...
					{:else}
						🚪 Leave Room
					{/if}
				</button>
			</div>
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
	
	.error-text {
		color: #ef4444;
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
	}
	
	/* Quit Button */
	.quit-button {
		margin-top: 1.5rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		border: none;
		border-radius: 0.5rem;
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-width: 140px;
	}
	
	.quit-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
	}
	
	.quit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	/* Finished Buttons */
	.finished-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
</style>
