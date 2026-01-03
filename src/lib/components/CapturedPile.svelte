<script lang="ts">
	import type { Card as CardType } from '$types/game';
	import { Card } from '$components';
	
	export let cards: CardType[] = [];
	export let playerName: string = 'Player';
	export let position: 'top' | 'bottom' = 'bottom';
	
	let showModal = false;
	
	// Calculate special cards for display
	$: aceCount = cards.filter(c => c.rank === 'A').length;
	$: spadesCount = cards.filter(c => c.suit === '♠').length;
	$: hasBigCasino = cards.some(c => c.rank === '2' && c.suit === '♠');
	$: hasLittleCasino = cards.some(c => c.rank === '10' && c.suit === '♦');
	
	function toggleModal() {
		showModal = !showModal;
	}
	
	function closeModal() {
		showModal = false;
	}
</script>

<div class="captured-pile" class:top={position === 'top'} class:bottom={position === 'bottom'}>
	<button 
		class="pile-button" 
		on:click={toggleModal}
		disabled={cards.length === 0}
		data-testid="captured-pile-button"
	>
		<div class="pile-stack">
			{#if cards.length > 0}
				<div class="card-stack">
					{#each cards.slice(-3) as card, i}
						<div class="stacked-card" style="--offset: {i * 4}px">
							<div class="mini-card {card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}">
								<span class="mini-rank">{card.rank}</span>
								<span class="mini-suit">{card.suit}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-pile">
					<span class="empty-icon">📥</span>
				</div>
			{/if}
		</div>
		<div class="pile-info">
			<span class="pile-label">Home</span>
			<span class="pile-count" data-testid="captured-count">{cards.length}</span>
		</div>
	</button>
	
	{#if cards.length > 0}
		<div class="pile-badges">
			{#if aceCount > 0}
				<span class="badge badge-ace" title="Aces captured">A×{aceCount}</span>
			{/if}
			{#if hasBigCasino}
				<span class="badge badge-big" title="Big Casino (2♠)">2♠</span>
			{/if}
			{#if hasLittleCasino}
				<span class="badge badge-little" title="Little Casino (10♦)">10♦</span>
			{/if}
			{#if spadesCount > 0}
				<span class="badge badge-spades" title="Spades captured">♠×{spadesCount}</span>
			{/if}
		</div>
	{/if}
</div>

{#if showModal}
<div 
	class="modal-overlay" 
	on:click={closeModal} 
	on:keydown={(e) => e.key === 'Escape' && closeModal()}
	role="dialog"
	aria-modal="true"
	aria-labelledby="captured-modal-title"
	tabindex="-1"
	data-testid="captured-modal"
>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="document">
		<div class="modal-header">
			<h3 class="modal-title" id="captured-modal-title">📥 {playerName}'s Captured Cards</h3>
			<button class="modal-close" on:click={closeModal}>✕</button>
		</div>
		
		<div class="modal-stats">
			<div class="stat">
				<span class="stat-value">{cards.length}</span>
				<span class="stat-label">Total Cards</span>
			</div>
			<div class="stat">
				<span class="stat-value">{spadesCount}</span>
				<span class="stat-label">Spades</span>
			</div>
			<div class="stat">
				<span class="stat-value">{aceCount}</span>
				<span class="stat-label">Aces</span>
			</div>
		</div>
		
		{#if hasBigCasino || hasLittleCasino}
			<div class="special-cards">
				{#if hasBigCasino}
					<span class="special-badge">🎰 Big Casino (2♠)</span>
				{/if}
				{#if hasLittleCasino}
					<span class="special-badge">💎 Little Casino (10♦)</span>
				{/if}
			</div>
		{/if}
		
		<div class="cards-grid" data-testid="captured-cards-grid">
			{#each cards as card}
				<Card {card} size="small" isPlayable={false} />
			{/each}
		</div>
		
		{#if cards.length === 0}
			<p class="empty-message">No cards captured yet</p>
		{/if}
	</div>
</div>
{/if}

<style>
.captured-pile {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
}

.captured-pile.top {
	flex-direction: column-reverse;
}

.pile-button {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
	padding: 0.5rem;
	background: rgba(0, 0, 0, 0.25);
	border: 2px solid rgba(255, 255, 255, 0.15);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.15s;
	min-width: 65px;
}

.pile-button:hover:not(:disabled) {
	border-color: var(--casino-gold, #d4af37);
	background: rgba(0, 0, 0, 0.35);
	transform: scale(1.05);
}

.pile-button:disabled {
	cursor: default;
	opacity: 0.6;
}

.pile-stack {
	position: relative;
	width: 45px;
	height: 36px;
}

.card-stack {
	position: relative;
	width: 100%;
	height: 100%;
}

.stacked-card {
	position: absolute;
	left: 0;
	top: calc(var(--offset) * -1);
	transform: rotate(calc(var(--offset) * 0.5deg));
}

.mini-card {
	width: 32px;
	height: 45px;
	background: #fffef8;
	border-radius: 3px;
	border: 1px solid rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 0.5rem;
	font-weight: 700;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.mini-card.red {
	color: #c41e3a;
}

.mini-card.black {
	color: #1a1a1a;
}

.mini-rank {
	font-size: 0.625rem;
	line-height: 1;
}

.mini-suit {
	font-size: 0.5rem;
	line-height: 1;
}

.empty-pile {
	width: 32px;
	height: 45px;
	background: rgba(0, 0, 0, 0.2);
	border: 2px dashed rgba(255, 255, 255, 0.15);
	border-radius: 3px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-icon {
	font-size: 0.875rem;
	opacity: 0.4;
}

.pile-info {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.125rem;
}

.pile-label {
	font-size: 0.5rem;
	color: rgba(255, 255, 255, 0.6);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.pile-count {
	font-size: 0.75rem;
	font-weight: 700;
	color: var(--casino-gold, #d4af37);
}

.pile-badges {
	display: flex;
	flex-wrap: wrap;
	gap: 0.2rem;
	justify-content: center;
	max-width: 75px;
}

.badge {
	font-size: 0.45rem;
	padding: 0.1rem 0.2rem;
	border-radius: 3px;
	font-weight: 600;
}

.badge-ace {
	background: rgba(212, 175, 55, 0.25);
	color: var(--casino-gold, #d4af37);
}

.badge-big {
	background: rgba(16, 185, 129, 0.25);
	color: #10b981;
}

.badge-little {
	background: rgba(196, 30, 58, 0.25);
	color: #ef4444;
}

.badge-spades {
	background: rgba(59, 130, 246, 0.25);
	color: #60a5fa;
}

/* Modal styles */
.modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
	animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

.modal {
	background: linear-gradient(135deg, #1a4d2e 0%, #0d3320 100%);
	border: 2px solid var(--casino-gold, #d4af37);
	border-radius: 12px;
	padding: 1.25rem;
	max-width: 420px;
	width: 90%;
	max-height: 75vh;
	overflow-y: auto;
	animation: scale-in 0.2s ease-out;
}

@keyframes scale-in {
	from { opacity: 0; transform: scale(0.95); }
	to { opacity: 1; transform: scale(1); }
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.75rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
	color: var(--casino-gold, #d4af37);
	font-size: 1.1rem;
	font-weight: 700;
}

.modal-close {
	background: none;
	border: none;
	color: rgba(255, 255, 255, 0.6);
	font-size: 1.1rem;
	cursor: pointer;
	padding: 0.25rem;
	line-height: 1;
	transition: color 0.15s;
}

.modal-close:hover {
	color: white;
}

.modal-stats {
	display: flex;
	justify-content: center;
	gap: 1.5rem;
	margin-bottom: 0.75rem;
	padding: 0.5rem;
	background: rgba(0, 0, 0, 0.25);
	border-radius: 6px;
}

.stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.125rem;
}

.stat-value {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--casino-gold, #d4af37);
}

.stat-label {
	font-size: 0.65rem;
	color: rgba(255, 255, 255, 0.6);
}

.special-cards {
	display: flex;
	justify-content: center;
	gap: 0.5rem;
	margin-bottom: 0.75rem;
}

.special-badge {
	padding: 0.25rem 0.5rem;
	background: rgba(16, 185, 129, 0.15);
	border: 1px solid rgba(16, 185, 129, 0.3);
	border-radius: 6px;
	font-size: 0.7rem;
	font-weight: 600;
	color: #10b981;
}

.cards-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
	gap: 0.375rem;
	justify-items: center;
}

.empty-message {
	text-align: center;
	color: rgba(255, 255, 255, 0.5);
	font-style: italic;
	padding: 1.5rem;
	font-size: 0.875rem;
}
</style>
