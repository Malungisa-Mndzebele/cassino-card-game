<script lang="ts">
  let showModal = false;
  
  function openModal() {
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<button
  on:click={openModal}
  class="btn-instructions"
  aria-label="How to Play"
>
  📖 How to Play
</button>

{#if showModal}
  <!-- Modal Backdrop -->
  <div 
    class="modal-backdrop"
    on:click={closeModal}
    on:keydown={(e) => e.key === 'Enter' && closeModal()}
    role="button"
    tabindex="0"
    aria-label="Close modal"
  >
    <!-- Modal Content -->
    <div 
      class="modal-content"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabindex="-1"
    >
      <!-- Close Button -->
      <button
        on:click={closeModal}
        class="close-btn"
        aria-label="Close"
      >
        ✕
      </button>

      <!-- Header -->
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">🎴 How to Play Casino</h2>
        <p class="modal-subtitle">The Classic Card Capture Game</p>
      </div>

      <!-- Scrollable Content -->
      <div class="modal-body">
        <!-- Overview -->
        <section class="section">
          <h3 class="section-title">🎯 Objective</h3>
          <p class="section-text">
            Capture cards from the table to score points. First player to reach <strong>11 points</strong> wins!
          </p>
        </section>

        <!-- Game Setup -->
        <section class="section">
          <h3 class="section-title">🃏 Game Setup</h3>
          <ul class="list">
            <li>Standard 52-card deck, 2 players</li>
            <li>4 cards dealt face-up on the table</li>
            <li>Each player receives 4 cards per round</li>
            <li>Game consists of 2 rounds</li>
          </ul>
        </section>

        <!-- Actions -->
        <section class="section">
          <h3 class="section-title">🎮 Your Turn Actions</h3>
          <p class="section-text mb-3">On your turn, you must play one card from your hand. Choose one action:</p>
          
          <div class="action-card capture">
            <h4 class="action-title">⚡ Capture</h4>
            <p class="action-desc">
              Take cards from the table that match your card's value. You can capture:
            </p>
            <ul class="action-list">
              <li><strong>Single match:</strong> Play a 7 to capture a 7</li>
              <li><strong>Sum match:</strong> Play an 8 to capture 3 + 5</li>
              <li><strong>Multiple captures:</strong> Capture all matching combinations at once</li>
            </ul>
          </div>

          <div class="action-card build">
            <h4 class="action-title">🔨 Build</h4>
            <p class="action-desc">
              Combine your card with table cards to create a "build" for later capture:
            </p>
            <ul class="action-list">
              <li>Play a 3 on a 5 to make a "build of 8"</li>
              <li>You must have an 8 in hand to capture it later</li>
              <li>Opponent can steal your build if they have the matching card!</li>
            </ul>
          </div>

          <div class="action-card trail">
            <h4 class="action-title">📤 Trail</h4>
            <p class="action-desc">
              If you can't or don't want to capture/build, place your card face-up on the table.
            </p>
          </div>
        </section>

        <!-- Ace Special Rule -->
        <section class="section">
          <h3 class="section-title">🅰️ Ace Flexibility</h3>
          <p class="section-text">
            Aces are special! They can be played as <strong>1</strong> or <strong>14</strong>:
          </p>
          <ul class="list">
            <li>Use Ace as 1 to capture an Ace or build small combinations</li>
            <li>Use Ace as 14 to capture a King + Ace (13 + 1 = 14)</li>
          </ul>
        </section>

        <!-- Scoring -->
        <section class="section">
          <h3 class="section-title">🏆 Scoring</h3>
          <div class="scoring-grid">
            <div class="score-item">
              <span class="score-emoji">🂡</span>
              <span class="score-label">Each Ace</span>
              <span class="score-value">1 pt</span>
            </div>
            <div class="score-item special">
              <span class="score-emoji">🂢</span>
              <span class="score-label">2 of Spades</span>
              <span class="score-value">1 pt</span>
            </div>
            <div class="score-item special">
              <span class="score-emoji">🃊</span>
              <span class="score-label">10 of Diamonds</span>
              <span class="score-value">2 pts</span>
            </div>
            <div class="score-item bonus">
              <span class="score-emoji">🃏</span>
              <span class="score-label">Most Cards</span>
              <span class="score-value">2 pts</span>
            </div>
            <div class="score-item bonus">
              <span class="score-emoji">♠️</span>
              <span class="score-label">Most Spades</span>
              <span class="score-value">2 pts</span>
            </div>
          </div>
          <p class="section-text mt-3 text-sm text-gray-400">
            * If tied for most cards or spades, each player gets 1 point
          </p>
        </section>

        <!-- Tips -->
        <section class="section">
          <h3 class="section-title">💡 Pro Tips</h3>
          <ul class="tips-list">
            <li>🎯 Prioritize capturing Aces and special cards (2♠, 10♦)</li>
            <li>♠️ Collect Spades whenever possible for the bonus</li>
            <li>🔒 Build strategically to secure valuable captures</li>
            <li>👀 Watch what your opponent captures to predict their strategy</li>
            <li>🧮 Remember: capturing more cards = more chances for bonuses</li>
          </ul>
        </section>

        <!-- Controls -->
        <section class="section">
          <h3 class="section-title">🖱️ Controls</h3>
          <ul class="list">
            <li><strong>Click</strong> a card from your hand to select it</li>
            <li><strong>Click</strong> table cards to select them for capture/build</li>
            <li>Click the <strong>Capture</strong>, <strong>Build</strong>, or <strong>Trail</strong> button</li>
          </ul>
        </section>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button on:click={closeModal} class="btn-got-it">
          Got it! Let's Play 🎲
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .btn-instructions {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  }

  .btn-instructions:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -2px rgba(79, 70, 229, 0.4);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
    border: 2px solid #d4af37;
    border-radius: 1rem;
    max-width: 600px;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #9ca3af;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .modal-header {
    padding: 1.5rem 2rem 1rem;
    text-align: center;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  }

  .modal-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #d4af37;
    margin: 0;
  }

  .modal-subtitle {
    color: #9ca3af;
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 2rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #d4af37;
    margin: 0 0 0.75rem;
  }

  .section-text {
    color: #d1d5db;
    line-height: 1.6;
    margin: 0;
  }

  .list {
    color: #d1d5db;
    margin: 0;
    padding-left: 1.25rem;
    line-height: 1.8;
  }

  .action-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border-left: 3px solid;
  }

  .action-card.capture {
    border-color: #10b981;
  }

  .action-card.build {
    border-color: #f59e0b;
  }

  .action-card.trail {
    border-color: #6366f1;
  }

  .action-title {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    margin: 0 0 0.5rem;
  }

  .action-desc {
    color: #9ca3af;
    font-size: 0.9rem;
    margin: 0 0 0.5rem;
  }

  .action-list {
    color: #d1d5db;
    font-size: 0.85rem;
    margin: 0;
    padding-left: 1.25rem;
    line-height: 1.6;
  }

  .scoring-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .score-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.25rem;
  }

  .score-item.special {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .score-item.bonus {
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .score-emoji {
    font-size: 1.5rem;
  }

  .score-label {
    color: #9ca3af;
    font-size: 0.8rem;
  }

  .score-value {
    color: #d4af37;
    font-weight: 700;
    font-size: 1rem;
  }

  .tips-list {
    color: #d1d5db;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tips-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .tips-list li:last-child {
    border-bottom: none;
  }

  .modal-footer {
    padding: 1rem 2rem 1.5rem;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
    text-align: center;
  }

  .btn-got-it {
    background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
    color: #111827;
    font-weight: 700;
    padding: 0.875rem 2rem;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
  }

  .btn-got-it:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -2px rgba(212, 175, 55, 0.4);
  }

  /* Scrollbar styling */
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .modal-body::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .modal-body::-webkit-scrollbar-thumb {
    background: rgba(212, 175, 55, 0.3);
    border-radius: 3px;
  }

  .modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(212, 175, 55, 0.5);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .modal-content {
      max-height: 90vh;
    }

    .modal-header {
      padding: 1rem 1.5rem 0.75rem;
    }

    .modal-title {
      font-size: 1.5rem;
    }

    .modal-body {
      padding: 1rem 1.5rem;
    }

    .scoring-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
