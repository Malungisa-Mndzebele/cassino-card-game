<script lang="ts">
	import type { Card as CardType } from '$types/game';
	import { Card } from '$components';
	
	export let cards: CardType[] = [];
	export let isMyTurn = false;
	export let onCardClick: ((card: CardType) => void) | undefined = undefined;
	export let selectedCardId: string | null = null;
	export let label = 'Your Hand';
	
	function handleCardClick(card: CardType) {
		if (isMyTurn && onCardClick) {
			onCardClick(card);
		}
	}
</script>

<div class="player-hand">
	<div class="hand-header">
		<h3 class="hand-label">{label}</h3>
		<span class="card-count">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</span>
	</div>
	
	<div class="cards-container">
		{#if cards.length === 0}
			<div class="empty-hand">
				<p class="text-gray-400">No cards in hand</p>
			</div>
		{:else}
			<div class="cards-grid">
				{#each cards as card (card.id)}
					<div class="card-wrapper {selectedCardId === card.id ? 'selected' : ''}">
						<Card
							{card}
							size="medium"
							isPlayable={isMyTurn}
							onClick={() => handleCardClick(card)}
						/>
						{#if selectedCardId === card.id}
							<div class="selected-indicator">
								<span>✓</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.player-hand {
		background: rgba(30, 41, 59, 0.6);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.hand-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.hand-label {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.card-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
	}
	
	.cards-container {
		min-height: 150px;
	}
	
	.empty-hand {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 150px;
	}
	
	.cards-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	
	.card-wrapper {
		position: relative;
		transition: transform 0.2s ease;
	}
	
	.card-wrapper.selected {
		transform: translateY(-10px);
	}
	
	.selected-indicator {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 0.875rem;
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
		animation: pop-in 0.3s ease-out;
	}
	
	@keyframes pop-in {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.player-hand {
			padding: 1rem;
		}
		
		.cards-grid {
			gap: 0.5rem;
		}
	}
</style>
