<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '$stores/gameStore';
  import { connectionStore } from '$stores/connectionStore';
  import { RoomManager, GameHeader, Card } from '$components';

  // Reactive state
  $: inRoom = !!$gameStore.roomId;
  $: gameState = $gameStore.gameState;
  $: players = gameState?.players || [];
  $: hasOpponent = players.length >= 2;

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
          <!-- Both Players Ready Check -->
          <div class="ready-screen">
            <div class="ready-content">
              <h2 class="text-3xl font-bold text-casino-gold mb-6">Get Ready!</h2>

              <div class="players-ready">
                <div class="player-ready-status">
                  <span class="player-name">{players[0]?.name}</span>
                  <span class="ready-indicator {gameState.player1Ready ? 'ready' : 'not-ready'}">
                    {gameState.player1Ready ? '✓ Ready' : '⏳ Not Ready'}
                  </span>
                </div>

                <div class="vs-divider">VS</div>

                <div class="player-ready-status">
                  <span class="player-name">{players[1]?.name}</span>
                  <span class="ready-indicator {gameState.player2Ready ? 'ready' : 'not-ready'}">
                    {gameState.player2Ready ? '✓ Ready' : '⏳ Not Ready'}
                  </span>
                </div>
              </div>

              <p class="text-gray-400 mt-6 text-sm mb-6">
                Game will start when both players are ready
              </p>

              <div class="flex gap-4 justify-center">
                <button
                  on:click={async () => {
                    try {
                      console.log('Ready button clicked');
                      const { setPlayerReady } = await import('$lib/utils/api');
                      const isPlayer1 = players[0]?.id === $gameStore.playerId;
                      const currentReady = isPlayer1 ? gameState.player1Ready : gameState.player2Ready;
                      
                      console.log('Setting ready state:', {
                        roomId: $gameStore.roomId,
                        playerId: $gameStore.playerId,
                        newReady: !currentReady
                      });
                      
                      const response = await setPlayerReady($gameStore.roomId, $gameStore.playerId, !currentReady);
                      
                      console.log('Ready state response:', response);
                      
                      // Update local state immediately
                      if (response.success && response.game_state) {
                        await gameStore.setGameState(response.game_state);
                      }
                    } catch (err) {
                      console.error('Failed to set ready status:', err);
                    }
                  }}
                  class="btn-primary"
                >
                  {#if players[0]?.id === $gameStore.playerId}
                    {gameState.player1Ready ? 'Not Ready' : 'Ready'}
                  {:else}
                    {gameState.player2Ready ? 'Not Ready' : 'Ready'}
                  {/if}
                </button>

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
          </div>
        {:else}
          <!-- Active Game -->
          <div class="game-active">
            <div class="game-board">
              <!-- Placeholder for game board -->
              <div class="placeholder-board">
                <h3 class="text-2xl font-bold text-casino-gold mb-4">Game Board</h3>
                <p class="text-gray-300 mb-4">
                  Phase: {gameState?.phase || 'unknown'}
                </p>
                <p class="text-gray-400 text-sm">Game components will be added here</p>

                <!-- Sample Cards Display -->
                {#if gameState?.player1Hand && gameState.player1Hand.length > 0}
                  <div class="mt-8">
                    <p class="text-gray-300 mb-4">Your Hand:</p>
                    <div class="flex gap-2 justify-center flex-wrap">
                      {#each gameState.player1Hand.slice(0, 4) as card}
                        <Card {card} size="medium" isPlayable={false} />
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </main>

      <!-- Footer -->
      <footer class="game-footer">
        <p class="text-gray-500 text-sm">Casino Card Game v2.0 - SvelteKit Migration in Progress</p>
      </footer>
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

  /* Ready Screen */
  .ready-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .ready-content {
    text-align: center;
    max-width: 600px;
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 3rem;
    border: 2px solid var(--casino-gold);
  }

  .players-ready {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .player-ready-status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 150px;
  }

  .player-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .ready-indicator {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .ready-indicator.ready {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid #10b981;
  }

  .ready-indicator.not-ready {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
    border: 1px solid #6b7280;
  }

  .vs-divider {
    font-size: 2rem;
    font-weight: 700;
    color: var(--casino-gold);
  }

  /* Game Active */
  .game-active {
    max-width: 1400px;
    margin: 0 auto;
  }

  .game-board {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .placeholder-board {
    text-align: center;
    padding: 3rem;
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

    .ready-content {
      padding: 2rem 1.5rem;
    }

    .players-ready {
      flex-direction: column;
      gap: 1rem;
    }

    .vs-divider {
      transform: rotate(90deg);
    }
  }
</style>
