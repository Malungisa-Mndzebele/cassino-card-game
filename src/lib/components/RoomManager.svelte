<script lang="ts">
  import { gameStore } from '$stores/gameStore';
  import { connectionStore } from '$stores/connectionStore';
  import {
    createRoom,
    joinRoom,
    joinRandomRoom,
    validatePlayerName,
    validateRoomCode,
    formatRoomCode,
    sanitizePlayerName,
    copyToClipboard,
  } from '$utils';
  import { ErrorHandler, formatErrorForDisplay } from '$lib/utils/errorHandler';
  import ErrorNotification from '$lib/components/ErrorNotification.svelte';
  import { onMount } from 'svelte';

  // Component state
  let playerName = '';
  let roomCode = '';
  let isCreating = false;
  let isJoining = false;
  let error = '';
  let errorType = undefined;
  let errorTitle = '';
  let showRoomCode = false;
  let copied = false;

  // Load saved player name
  onMount(() => {
    const saved = localStorage.getItem('cassino_player_name');
    if (saved) {
      playerName = saved;
    }
  });

  // Reactive validation
  $: playerNameValid = validatePlayerName(playerName).valid;
  $: roomCodeValid = roomCode.length === 0 || validateRoomCode(roomCode).valid;
  $: canCreateOrJoinRandom = playerNameValid && !isCreating && !isJoining;
  $: canJoinRoom =
    playerNameValid && roomCodeValid && roomCode.length === 6 && !isCreating && !isJoining;

  async function handleCreateRoom() {
    error = '';
    isCreating = true;

    try {
      const sanitized = sanitizePlayerName(playerName);
      localStorage.setItem('cassino_player_name', sanitized);

      const response = await createRoom(sanitized);

      gameStore.setRoomId(response.room_id);
      gameStore.setPlayerId(response.player_id);
      gameStore.setPlayerName(sanitized);
      gameStore.setGameState(response.game_state);

      showRoomCode = true;

      // Connect WebSocket
      await connectionStore.connect(response.room_id);
    } catch (err: any) {
      ErrorHandler.logError(err, 'handleCreateRoom');
      const formatted = formatErrorForDisplay(err);
      error = formatted.message;
      errorType = formatted.type;
      errorTitle = formatted.title;
    } finally {
      isCreating = false;
    }
  }

  async function handleJoinRoom() {
    error = '';
    isJoining = true;

    try {
      let sanitized = sanitizePlayerName(playerName);
      const formatted = formatRoomCode(roomCode);

      localStorage.setItem('cassino_player_name', sanitized);

      // Try to join, if name is taken, append a number
      let attempts = 0;
      while (attempts < 5) {
        try {
          const response = await joinRoom(formatted, sanitized);

          gameStore.setRoomId(formatted);
          gameStore.setPlayerId(response.player_id);
          gameStore.setPlayerName(sanitized);
          gameStore.setGameState(response.game_state);

          // Connect WebSocket
          await connectionStore.connect(formatted);
          return;
        } catch (err: any) {
          if (err.message?.includes('Player name already taken') && attempts < 4) {
            // Append a random number and try again
            attempts++;
            sanitized = `${sanitizePlayerName(playerName)}${Math.floor(Math.random() * 1000)}`;
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      ErrorHandler.logError(err, 'handleJoinRoom');
      const formatted = formatErrorForDisplay(err);
      error = formatted.message;
      errorType = formatted.type;
      errorTitle = formatted.title;
    } finally {
      isJoining = false;
    }
  }

  async function handleJoinRandom() {
    error = '';
    isJoining = true;

    try {
      let sanitized = sanitizePlayerName(playerName);
      localStorage.setItem('cassino_player_name', sanitized);

      // Try to join, if name is taken, append a number
      let attempts = 0;
      while (attempts < 5) {
        try {
          const response = await joinRandomRoom(sanitized);

          gameStore.setRoomId(response.game_state.roomId);
          gameStore.setPlayerId(response.player_id);
          gameStore.setPlayerName(sanitized);
          gameStore.setGameState(response.game_state);

          // Connect WebSocket
          await connectionStore.connect(response.game_state.roomId);
          return;
        } catch (err: any) {
          if (err.message?.includes('Player name already taken') && attempts < 4) {
            // Append a random number and try again
            attempts++;
            sanitized = `${sanitizePlayerName(playerName)}${Math.floor(Math.random() * 1000)}`;
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      ErrorHandler.logError(err, 'handleJoinRandom');
      const formatted = formatErrorForDisplay(err);
      error = formatted.message;
      errorType = formatted.type;
      errorTitle = formatted.title;
    } finally {
      isJoining = false;
    }
  }

  async function handleCopyRoomCode() {
    if ($gameStore.roomId) {
      const success = await copyToClipboard($gameStore.roomId);
      if (success) {
        copied = true;
        setTimeout(() => (copied = false), 2000);
      }
    }
  }

  function handleRoomCodeInput(e: Event) {
    const input = e.target as HTMLInputElement;
    roomCode = formatRoomCode(input.value);
  }
</script>

<div class="room-manager">
  {#if !$gameStore.roomId}
    <!-- Room Creation/Joining UI -->
    <div class="casino-bg backdrop-casino rounded-xl p-8 max-w-md mx-auto shadow-2xl">
      <h1 class="text-4xl font-bold text-center mb-2 text-casino-gold">Casino Card Game</h1>
      <p class="text-center text-gray-300 mb-8">Create or join a game room to start playing</p>

      <!-- Create New Room Section -->
      <section class="mb-6">
        <h2 class="text-2xl font-semibold text-casino-gold mb-4">Create New Room</h2>

        <!-- Player Name Input -->
        <div class="mb-4">
          <label for="playerName" class="block text-sm font-medium text-gray-200 mb-2">
            Your Name
          </label>
          <input
            id="playerName"
            data-testid="player-name-input-create-test"
            type="text"
            bind:value={playerName}
            placeholder="Enter your name"
            maxlength="20"
            class="input-field"
            disabled={isCreating || isJoining}
          />
          {#if playerName && !playerNameValid}
            <p class="text-red-400 text-sm mt-1">
              Name must be 1-20 characters (letters, numbers, spaces only)
            </p>
          {/if}
        </div>

        <!-- Create Room Button -->
        <button
          data-testid="create-room-test"
          on:click={handleCreateRoom}
          disabled={!canCreateOrJoinRandom}
          class="btn-primary w-full mb-4"
        >
          {#if isCreating}
            <span class="inline-block animate-spin mr-2">⚙</span>
            Creating Room...
          {:else}
            🎲 Create Room
          {/if}
        </button>

        <!-- Join Random Button -->
        <button
          data-testid="join-random-test"
          on:click={handleJoinRandom}
          disabled={!canCreateOrJoinRandom}
          class="btn-primary w-full bg-purple-600 hover:bg-purple-700"
        >
          {#if isJoining}
            <span class="inline-block animate-spin mr-2">⚙</span>
            Joining...
          {:else}
            🎯 Quick Match
          {/if}
        </button>
      </section>

      <!-- Divider -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-gray-800 text-gray-400">OR</span>
        </div>
      </div>

      <!-- Join Existing Room Section -->
      <section>
        <h2 class="text-2xl font-semibold text-casino-gold mb-4">Join Existing Room</h2>

        <!-- Player Name Input for Join -->
        <div class="mb-4">
          <label for="playerNameJoin" class="block text-sm font-medium text-gray-200 mb-2">
            Your Name
          </label>
          <input
            id="playerNameJoin"
            data-testid="player-name-input-join"
            type="text"
            bind:value={playerName}
            placeholder="Enter your name"
            maxlength="20"
            class="input-field"
            disabled={isCreating || isJoining}
          />
        </div>

        <!-- Join Room Input -->
        <div class="mb-4">
          <label for="roomCode" class="block text-sm font-medium text-gray-200 mb-2">
            Room Code
          </label>
          <input
            id="roomCode"
            data-testid="room-code-input"
            type="text"
            bind:value={roomCode}
            on:input={handleRoomCodeInput}
            placeholder="ABC123"
            maxlength="6"
            class="input-field uppercase"
            disabled={isCreating || isJoining}
          />
          {#if roomCode && !roomCodeValid}
            <p class="text-red-400 text-sm mt-1">Room code must be exactly 6 characters</p>
          {/if}
        </div>

        <!-- Join Room Button -->
        <button
          data-testid="join-room-test"
          on:click={handleJoinRoom}
          disabled={!canJoinRoom}
          class="btn-primary w-full bg-green-600 hover:bg-green-700"
        >
          {#if isJoining}
            <span class="inline-block animate-spin mr-2">⚙</span>
            Joining...
          {:else}
            🚪 Join Room
          {/if}
        </button>
      </section>

      <!-- Error Message -->
      {#if error}
        <div class="mt-4">
          <ErrorNotification
            bind:error
            type={errorType}
            title={errorTitle}
            dismissible={true}
            autoDismiss={true}
          />
        </div>
      {/if}
    </div>
  {:else}
    <!-- Room Created - Show Code -->
    <div class="casino-bg backdrop-casino rounded-xl p-8 max-w-md mx-auto shadow-2xl">
      <h2 class="text-3xl font-bold text-center mb-4 text-casino-gold">Room Created!</h2>

      <p class="text-center text-gray-300 mb-6">Share this code with your opponent:</p>

      <!-- Room Code Display -->
      <div class="bg-gray-900 rounded-lg p-6 mb-6 border-2 border-casino-gold">
        <p class="text-center text-5xl font-bold tracking-widest text-casino-gold">
          {$gameStore.roomId}
        </p>
      </div>

      <!-- Copy Button -->
      <button on:click={handleCopyRoomCode} class="btn-primary w-full mb-4">
        {#if copied}
          ✅ Copied!
        {:else}
          📋 Copy Room Code
        {/if}
      </button>

      <p class="text-center text-gray-400 text-sm">Waiting for opponent to join...</p>

      <!-- Connection Status -->
      <div class="mt-4 text-center">
        {#if $connectionStore.status === 'connected'}
          <span class="text-green-400">🟢 Connected</span>
        {:else if $connectionStore.status === 'connecting'}
          <span class="text-yellow-400">🟡 Connecting...</span>
        {:else}
          <span class="text-red-400">🔴 Disconnected</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .room-manager {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  /* Additional component-specific styles */
  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
