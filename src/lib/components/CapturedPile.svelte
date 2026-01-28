<script lang="ts">
  import type { Card as CardType } from '$types/game';
  import { Card } from '$components';

  export let cards: CardType[] = [];
  export let playerName: string = 'Player';
  export let position: 'top' | 'bottom' = 'bottom';
  export let isSelectable = false;
  export let selectedCardIds: string[] = [];
  export let onCardClick: ((card: CardType) => void) | undefined = undefined;

  let showModal = false;

  // Calculate special cards for display
  $: aceCount = cards.filter((c) => c.rank === 'A').length;
  $: spadesCount = cards.filter((c) => c.suit === '♠').length;
  $: hasBigCasino = cards.some((c) => c.rank === '2' && c.suit === '♠');
  $: hasLittleCasino = cards.some((c) => c.rank === '10' && c.suit === '♦');

  function toggleModal() {
    showModal = !showModal;
  }

  function closeModal() {
    showModal = false;
  }
</script>

<div class="captured-pile" class:top={position === 'top'} class:bottom={position === 'bottom'}>
  {#if cards.length > 0}
    <!-- Top Card (Interactive if selectable) -->
    <div class="pile-container">
      <div class="top-card-wrapper" class:selectable={isSelectable}>
        <Card
          card={cards[cards.length - 1]}
          size="medium"
          isPlayable={isSelectable}
          isSelected={selectedCardIds.includes(cards[cards.length - 1].id)}
          onClick={() =>
            isSelectable && onCardClick ? onCardClick(cards[cards.length - 1]) : toggleModal()}
        />
      </div>

      <!-- Visual stack effect underneath -->
      {#if cards.length > 1}
        <div class="pile-underlay layer-1"></div>
        {#if cards.length > 2}
          <div class="pile-underlay layer-2"></div>
        {/if}
      {/if}

      <!-- Clickable area for modal if top card is selecting -->
      {#if isSelectable}
        <button class="view-pile-btn" on:click={toggleModal} title="View all captured cards">
          <span>View Pile ({cards.length})</span>
        </button>
      {/if}
    </div>
  {:else}
    <div
      class="empty-pile-slot"
      on:click={toggleModal}
      role="button"
      tabindex="0"
      on:keypress={toggleModal}
    >
      <div class="empty-icon">📥</div>
      <span class="empty-text">Empty</span>
    </div>
  {/if}

  <div class="pile-info">
    <span class="pile-label">{playerName}</span>
    {#if !isSelectable}<span class="pile-count" data-testid="captured-count"
        >{cards.length} cards</span
      >{/if}
  </div>

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
    gap: 0.5rem;
  }

  .captured-pile.top {
    flex-direction: column-reverse;
  }

  .pile-container {
    position: relative;
    width: 70px; /* Match medium card width */
    height: 98px; /* Match medium card height */
    z-index: 1;
  }

  .top-card-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    transition: transform 0.2s;
  }

  .top-card-wrapper.selectable:hover {
    transform: translateY(-5px);
  }

  .pile-underlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      #1e3a8a 0%,
      #2563eb 50%,
      #1e3a8a 100%
    ); /* Blue card back color */
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .pile-underlay.layer-1 {
    z-index: 5;
    transform: rotate(3deg) translate(2px, 2px);
  }

  .pile-underlay.layer-2 {
    z-index: 4;
    transform: rotate(-2deg) translate(-2px, 4px);
  }

  .view-pile-btn {
    position: absolute;
    bottom: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    font-size: 0.6rem;
    padding: 2px 6px;
    white-space: nowrap;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 20;
  }

  .pile-container:hover .view-pile-btn {
    opacity: 1;
  }

  .empty-pile-slot {
    width: 70px;
    height: 98px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .empty-pile-slot:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(0, 0, 0, 0.2);
  }

  .empty-icon {
    font-size: 1.5rem;
    opacity: 0.5;
    margin-bottom: 0.25rem;
  }

  .empty-text {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .pile-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
  }

  .pile-label {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .pile-count {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--casino-gold, #d4af37);
  }

  .pile-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    justify-content: center;
    max-width: 90px;
  }

  .badge {
    font-size: 0.55rem;
    padding: 1px 4px;
    border-radius: 4px;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .badge-ace {
    background: rgba(212, 175, 55, 0.2);
    color: #fbbf24;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .badge-big {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-little {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
    border: 1px solid rgba(248, 113, 113, 0.3);
  }

  .badge-spades {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  /* Maintain Modal Styles */
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
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
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
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
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
