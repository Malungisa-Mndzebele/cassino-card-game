<script lang="ts">
	import type { Card as CardType } from '$types/game';
	import { Card } from '$components';
	
	export let cards: CardType[] = [];
	export let builds: any[] = [];
	export let onCardClick: ((card: CardType) => void) | undefined = undefined;
	export let selectedCardIds: string[] = [];
	export let isSelectable = false;
	
	function handleCardClick(card: CardType) {
		if (isSelectable && onCardClick) {
			onCardClick(card);
		}
	}
	
	function isCardSelected(cardId: string): boolean {
		return selectedCardIds.includes(cardId);
	}
</script>

<div class="table-cards">
	<div class="table-header">
		<h3 class="table-label">Table</h3>
		<span class="card-count">
			{cards.length} {cards.length === 1 ? 'card' : 'cards'}
			{#if builds.length > 0}
				+ {builds.length} {builds.length === 1 ? 'build' : 'builds'}
			{/if}
		</span>
	</div>
	
	<div class="table-area">
		{#if cards.length === 0 && builds.length === 0}
			<div class="empty-table">
				<p class="text-gray-400">No cards on table</p>
			</div>
		{:else}
			<!-- Regular Cards -->
			{#if cards.length > 0}
				<div class="table-cards-grid">
					{#each cards as card (card.id)}
						<div class="card-wrapper {isCardSelected(card.id) ? 'selected' : ''}">
							<Card
								{card}
								size="medium"
								isPlayable={isSelectable}
								onClick={() => handleCardClick(card)}
							/>
							{#if isCardSelected(card.id)}
								<div class="selected-indicator">
									<span>✓</span>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			
			<!-- Builds -->
			{#if builds.length > 0}
				<div class="builds-container">
					<h4 class="builds-label">Builds</h4>
					<div class="builds-grid">
						{#each builds as build (build.id)}
							<div class="build-stack">
								<div class="build-header">
									<span class="build-value">Value: {build.value}</span>
									<span class="build-owner">
										{build.owner === 1 ? 'P1' : 'P2'}
									</span>
								</div>
								<div class="build-cards">
									{#each build.cards as card (card.id)}
										<div class="build-card">
											<Card {card} size="small" />
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.table-cards {
		background: rgba(21, 128, 61, 0.3);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 1.5rem;
		border: 2px solid rgba(34, 197, 94, 0.3);
		min-height: 300px;
	}
	
	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.table-label {
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
	
	.table-area {
		min-height: 200px;
	}
	
	.empty-table {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
	}
	
	.table-cards-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 1.5rem;
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
	
	/* Builds */
	.builds-container {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.builds-label {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}
	
	.builds-grid {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.build-stack {
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem;
		min-width: 150px;
	}
	
	.build-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.build-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--casino-gold);
	}
	
	.build-owner {
		font-size: 0.75rem;
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}
	
	.build-cards {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.build-card {
		transform: scale(0.9);
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
		.table-cards {
			padding: 1rem;
		}
		
		.table-cards-grid {
			gap: 0.5rem;
		}
		
		.builds-grid {
			gap: 0.5rem;
		}
	}
</style>
