<script lang="ts">
	import { gameStore, currentPlayer, player1Score, player2Score } from '$stores/gameStore';
	import { connectionStore } from '$stores/connectionStore';
	import { copyToClipboard, formatElapsedTime } from '$utils/helpers';
	import { onMount, onDestroy } from 'svelte';
	
	let copied = false;
	let elapsedTime = '0:00';
	let interval: number;
	
	onMount(() => {
		// Update elapsed time every second
		interval = window.setInterval(() => {
			if ($gameStore.gameState?.lastUpdate) {
				const start = new Date($gameStore.gameState.lastUpdate);
				const now = new Date();
				const seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
				elapsedTime = formatElapsedTime(seconds);
			}
		}, 1000);
	});
	
	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
	
	async function handleCopyRoomCode() {
		if ($gameStore.roomId) {
			const success = await copyToClipboard($gameStore.roomId);
			if (success) {
				copied = true;
				setTimeout(() => copied = false, 2000);
			}
		}
	}
	
	$: players = $gameStore.gameState?.players || [];
	$: player1 = players[0];
	$: player2 = players[1];
	$: isMyTurn = $currentPlayer?.id === $gameStore.playerId;
	$: gamePhase = $gameStore.gameState?.phase || 'waiting';
	$: roundNumber = $gameStore.gameState?.round || 0;
</script>

<header class="game-header">
	<div class="header-container">
		<!-- Left: Room Info -->
		<div class="room-info">
			<div class="room-code-display">
				<span class="label">Room:</span>
				<button
					on:click={handleCopyRoomCode}
					class="room-code"
					title="Click to copy"
				>
					{$gameStore.roomId || '------'}
					{#if copied}
						<span class="copied-indicator">✓</span>
					{/if}
				</button>
			</div>
			
			<!-- Connection Status -->
			<div class="connection-status">
				{#if $connectionStore.status === 'connected'}
					<span class="status-dot connected"></span>
					<span class="status-text">Connected</span>
				{:else if $connectionStore.status === 'connecting'}
					<span class="status-dot connecting"></span>
					<span class="status-text">Connecting...</span>
				{:else if $connectionStore.status === 'disconnected'}
					<span class="status-dot disconnected"></span>
					<span class="status-text">Disconnected</span>
				{:else}
					<span class="status-dot error"></span>
					<span class="status-text">Error</span>
				{/if}
				
				{#if $connectionStore.latency !== null}
					<span class="latency">{$connectionStore.latency}ms</span>
				{/if}
			</div>
		</div>
		
		<!-- Center: Game Status -->
		<div class="game-status">
			<div class="phase-indicator">
				{#if gamePhase === 'waiting'}
					⏳ Waiting for Players
				{:else if gamePhase === 'dealer'}
					🎴 Dealer Phase
				{:else if gamePhase === 'round1' || gamePhase === 'round2'}
					🎮 Round {roundNumber}
				{:else if gamePhase === 'finished'}
					🏆 Game Over
				{:else}
					🎲 {gamePhase}
				{/if}
			</div>
			
			{#if isMyTurn && (gamePhase === 'round1' || gamePhase === 'round2')}
				<div class="turn-indicator">
					Your Turn!
				</div>
			{/if}
		</div>
		
		<!-- Right: Scores -->
		<div class="scores">
			<!-- Player 1 Score -->
			<div class="player-score {player1?.id === $gameStore.playerId ? 'is-you' : ''}">
				<div class="player-name">
					{player1?.name || 'Player 1'}
					{#if player1?.id === $gameStore.playerId}
						<span class="you-badge">(You)</span>
					{/if}
				</div>
				<div class="score">{$player1Score}</div>
			</div>
			
			<div class="score-divider">-</div>
			
			<!-- Player 2 Score -->
			<div class="player-score {player2?.id === $gameStore.playerId ? 'is-you' : ''}">
				<div class="player-name">
					{player2?.name || 'Player 2'}
					{#if player2?.id === $gameStore.playerId}
						<span class="you-badge">(You)</span>
					{/if}
				</div>
				<div class="score">{$player2Score}</div>
			</div>
		</div>
	</div>
</header>

<style>
	.game-header {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border-bottom: 2px solid var(--casino-gold);
		padding: 1rem 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	}
	
	.header-container {
		max-width: 1400px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 2rem;
		align-items: center;
	}
	
	/* Room Info */
	.room-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.room-code-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.label {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.room-code {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		padding: 0.25rem 0.75rem;
		color: var(--casino-gold);
		font-weight: 600;
		font-size: 1.125rem;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}
	
	.room-code:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: var(--casino-gold);
	}
	
	.copied-indicator {
		position: absolute;
		right: -1.5rem;
		color: #10b981;
		font-size: 1rem;
	}
	
	.connection-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	
	.status-dot.connected {
		background: #10b981;
		box-shadow: 0 0 8px #10b981;
	}
	
	.status-dot.connecting {
		background: #f59e0b;
		animation: pulse 2s infinite;
	}
	
	.status-dot.disconnected {
		background: #6b7280;
	}
	
	.status-dot.error {
		background: #ef4444;
	}
	
	.status-text {
		color: var(--text-secondary);
	}
	
	.latency {
		color: var(--text-tertiary);
		font-size: 0.75rem;
	}
	
	/* Game Status */
	.game-status {
		text-align: center;
	}
	
	.phase-indicator {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.turn-indicator {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		padding: 0.25rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		display: inline-block;
		animation: pulse-glow 2s infinite;
	}
	
	/* Scores */
	.scores {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
	}
	
	.player-score {
		text-align: center;
	}
	
	.player-score.is-you {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: 0.5rem;
		padding: 0.5rem 1rem;
	}
	
	.player-name {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
	}
	
	.you-badge {
		color: var(--casino-gold);
		font-weight: 600;
	}
	
	.score {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	
	.score-divider {
		font-size: 1.5rem;
		color: var(--text-tertiary);
	}
	
	/* Animations */
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	
	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
		}
		50% {
			box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
		}
	}
	
	/* Responsive */
	@media (max-width: 768px) {
		.game-header {
			padding: 0.75rem 1rem;
		}
		
		.header-container {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.room-info,
		.game-status,
		.scores {
			justify-content: center;
		}
		
		.scores {
			justify-content: center;
		}
	}
</style>
