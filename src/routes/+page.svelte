<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '$stores/gameStore';
  import { connectionStore } from '$stores/connectionStore';
  import { RoomManager, GameHeader, Card, GamePhases, GameBoard, CommunicationPanel } from '$components';

  // Reactive state
  $: inRoom = !!$gameStore.roomId;
  $: gameState = $gameStore.gameState;
  $: players = gameState?.players || [];
  $: hasOpponent = players.length >= 2;
  $: phase = gameState?.phase || 'waiting';

  // Initialize store and attempt reconnection on mount
  onMount(async () => {
    gameStore.initialize();
    
    // If we have a saved session, try to reconnect
    if ($gameStore.roomId && $gameStore.playerId) {
      console.log('Attempting to reconnect to room:', $gameStore.roomId);
      
      try {
        // Fetch current game state
        const { getGameState } = await import('$lib/utils/api');
        const response = await getGameState($gameStore.roomId);
        gameStore.setGameState(response.game_state);
        
        // Reconnect WebSocket
        connectionStore.connect($gameStore.roomId);
      } catch (err) {
        console.error('Failed to reconnect:', err);
        // Clear invalid session
        gameStore.reset();
      }
    }
  });

  // Handler functions for GamePhases
  async function handleReady() {
    try {
      console.log('Ready button clicked');
      
      if (!$gameStore.roomId || !$gameStore.playerId) {
        console.error('Missing roomId or playerId!');
        alert('Error: Missing room or player information. Please refresh and try again.');
        return;
      }
      
      const { setPlayerReady } = await import('$lib/utils/api');
      const isPlayer1 = players[0]?.id === $gameStore.playerId;
      const currentReady = isPlayer1 ? gameState?.player1Ready : gameState?.player2Ready;
      
      const response = await setPlayerReady($gameStore.roomId, $gameStore.playerId, !currentReady);
      
      if (response.success && response.game_state) {
        await gameStore.setGameState(response.game_state);
      }
    } catch (err: any) {
      console.error('Failed to set ready status:', err);
      alert(`Error: ${err.message || 'Failed to set ready status'}`);
    }
  }

  async function handleStartShuffle() {
    try {
      const { startShuffle } = await import('$lib/utils/api');
      const response = await startShuffle($gameStore.roomId, $gameStore.playerId) as { success: boolean; game_state?: any };
      
      if (response.success && response.game_state) {
        await gameStore.setGameState(response.game_state);
      }
    } catch (err: any) {
      console.error('Failed to start shuffle:', err);
      alert(`Error: ${err.message || 'Failed to start shuffle'}`);
    }
  }

  async function handleSelectFaceUpCards(cardIds: string[]) {
    try {
      const { selectFaceUpCards } = await import('$lib/utils/api');
      // Convert string IDs to numbers for the API
      const numericIds = cardIds.map(id => parseInt(id, 10));
      const response = await selectFaceUpCards($gameStore.roomId, $gameStore.playerId, numericIds) as { success: boolean; game_state?: any };
      
      if (response.success && response.game_state) {
        await gameStore.setGameState(response.game_state);
      }
    } catch (err: any) {
      console.error('Failed to select face-up cards:', err);
      alert(`Error: ${err.message || 'Failed to select cards'}`);
    }
  }
</script>

<svelte:head>
  <title>Casino</title>
  <meta name="description" content="Multiplayer Casino Card Game - Play with friends online!" />
</svelte:head>

<div class="app-container">
  {#if !inRoom}
    <!-- Room Manager (Create/Join) -->
    <RoomManager />
  {:else}
    <!-- Game UI -->
    <div class="game-container">
      <!-- Header with scores and status -->
      <GameHeader />

      <!-- Main Game Area -->
      <main class="game-main">
        {#if !hasOpponent}
          <!-- Waiting for Opponent -->
          <div class="waiting-screen">
            <div class="waiting-content">
              <h2 class="text-3xl font-bold text-casino-gold mb-4">Waiting for Opponent...</h2>
              <p class="text-gray-300 mb-6">Share this room code with a friend:</p>

              <div
                class="bg-gray-900 rounded-lg p-4 mb-6 border-2 border-casino-gold inline-block min-w-[200px]"
              >
                <p class="text-4xl font-bold tracking-widest text-casino-gold">
                  {$gameStore.roomId}
                </p>
              </div>

              <div class="animate-pulse text-6xl mb-6">🎴</div>

              <button
                on:click={() => {
                  connectionStore.disconnect();
                  gameStore.reset();
                }}
                class="btn-primary bg-red-600 hover:bg-red-700"
              >
                Leave Room
              </button>
            </div>
          </div>
        {:else if gameState?.phase === 'waiting'}
          <!-- Both Players Ready Check - Use GamePhases component -->
          <GamePhases 
            onReady={handleReady}
            onStartShuffle={handleStartShuffle}
            onSelectFaceUpCards={handleSelectFaceUpCards}
          />
        {:else if gameState?.phase === 'dealer'}
          <!-- Dealer Phase - Use GamePhases component with animation -->
          <GamePhases 
            onReady={handleReady}
            onStartShuffle={handleStartShuffle}
            onSelectFaceUpCards={handleSelectFaceUpCards}
          />
        {:else}
          <!-- Active Game (round1, round2, etc.) -->
          <GameBoard />
        {/if}
      </main>

      <!-- Footer -->
      <footer class="game-footer">
        <p class="text-gray-500 text-sm">Casino Card Game v2.0 - SvelteKit Migration in Progress</p>
      </footer>
      
      <!-- Communication Panel (Voice/Video/Chat) -->
      {#if hasOpponent}
        <CommunicationPanel />
      {/if}
    </div>
  {/if}
</div>

<style>
  .app-container {
    min-height: 100vh;
    background: var(--bg-primary);
  }

  .game-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .game-main {
    flex: 1;
    padding: 2rem;
  }

  /* Waiting Screen */
  .waiting-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .waiting-content {
    text-align: center;
    max-width: 500px;
  }

  /* Footer */
  .game-footer {
    text-align: center;
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .game-main {
      padding: 1rem;
    }
  }
</style>
