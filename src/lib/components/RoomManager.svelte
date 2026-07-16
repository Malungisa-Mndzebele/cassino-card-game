<script lang="ts">
  import { onMount } from 'svelte';
  import { validatePlayerName, sanitizePlayerName, copyToClipboard } from '$utils';
  import { startHost, hostAcceptAnswer, startGuest } from '$lib/p2p/session';
  import { ErrorHandler, formatErrorForDisplay } from '$lib/utils/errorHandler';
  import ErrorNotification from '$lib/components/ErrorNotification.svelte';
  import GameInstructions from '$lib/components/GameInstructions.svelte';

  type Mode = 'menu' | 'host' | 'guest';

  let playerName = '';
  let mode: Mode = 'menu';
  let busy = false;
  let error = '';
  let errorType: any = undefined;
  let errorTitle = '';

  // Host flow
  let offerCode = '';
  let answerInput = '';
  let hostConnecting = false;

  // Guest flow
  let offerInput = '';
  let answerCode = '';

  let copiedOffer = false;
  let copiedAnswer = false;

  onMount(() => {
    const saved = localStorage.getItem('cassino_player_name');
    if (saved) playerName = saved;
  });

  $: playerNameValid = validatePlayerName(playerName).valid;

  function showError(err: any) {
    ErrorHandler.logError(err, 'RoomManager');
    const formatted = formatErrorForDisplay(err);
    error = formatted.message;
    errorType = formatted.type;
    errorTitle = formatted.title;
  }

  async function handleHost() {
    error = '';
    busy = true;
    try {
      const name = sanitizePlayerName(playerName);
      localStorage.setItem('cassino_player_name', name);
      const { offerCode: code } = await startHost(name);
      offerCode = code;
      mode = 'host';
    } catch (err) {
      showError(err);
    } finally {
      busy = false;
    }
  }

  async function handleHostConnect() {
    error = '';
    hostConnecting = true;
    try {
      await hostAcceptAnswer(answerInput.trim());
      // On success the peer opens, the session sets gameStore.roomId, and the
      // page swaps to the game view. If it never opens, the user can retry.
    } catch (err) {
      showError(err);
    } finally {
      hostConnecting = false;
    }
  }

  async function handleStartGuest() {
    error = '';
    busy = true;
    try {
      const name = sanitizePlayerName(playerName);
      localStorage.setItem('cassino_player_name', name);
      const { answerCode: code } = await startGuest(name, offerInput.trim());
      answerCode = code;
    } catch (err) {
      showError(err);
    } finally {
      busy = false;
    }
  }

  async function copy(text: string, which: 'offer' | 'answer') {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    if (which === 'offer') {
      copiedOffer = true;
      setTimeout(() => (copiedOffer = false), 2000);
    } else {
      copiedAnswer = true;
      setTimeout(() => (copiedAnswer = false), 2000);
    }
  }

  function backToMenu() {
    mode = 'menu';
    offerCode = '';
    answerInput = '';
    offerInput = '';
    answerCode = '';
    error = '';
  }
</script>

<div class="room-manager">
  <div class="casino-bg backdrop-casino rounded-xl p-8 max-w-lg mx-auto shadow-2xl w-full">
    <h1 class="text-4xl font-bold text-center mb-2 text-casino-gold">Casino Card Game</h1>
    <p class="text-center text-gray-300 mb-4">Play head-to-head — no server, no sign-up.</p>

    <div class="flex justify-center gap-3 mb-6">
      <GameInstructions />
      <a
        href="/cassino/rules"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        target="_blank"
      >
        📖 Full Rules & Strategy
      </a>
    </div>

    <!-- Name -->
    <div class="mb-6">
      <label for="playerName" class="block text-sm font-medium text-gray-200 mb-2">Your Name</label>
      <input
        id="playerName"
        data-testid="player-name-input-create-test"
        type="text"
        bind:value={playerName}
        placeholder="Enter your name"
        maxlength="20"
        class="input-field"
        disabled={mode !== 'menu'}
      />
      {#if playerName && !playerNameValid}
        <p class="text-red-400 text-sm mt-1">Name must be 1-20 characters (letters, numbers, spaces only)</p>
      {/if}
    </div>

    {#if mode === 'menu'}
      <!-- Connection instructions -->
      <div class="bg-black/20 rounded-lg p-4 mb-6 text-sm text-gray-300 leading-relaxed">
        <p class="mb-1">
          One player <strong>hosts</strong> and gets an <em>invite code</em> to share (chat, email, etc.).
          The other player <strong>joins</strong> with that code and sends back a <em>reply code</em>.
        </p>
        <p>Once both codes are exchanged, you're connected directly — peer to peer.</p>
      </div>

      <button
        data-testid="create-room-test"
        on:click={handleHost}
        disabled={!playerNameValid || busy}
        class="btn-primary w-full mb-3"
      >
        {busy ? 'Preparing…' : '🎲 Host a Game'}
      </button>

      <button
        data-testid="join-room-test"
        on:click={() => (mode = 'guest')}
        disabled={!playerNameValid}
        class="btn-secondary w-full"
      >
        🔗 Join a Game
      </button>
    {:else if mode === 'host'}
      <!-- Step 1: share invite code -->
      <section class="mb-5">
        <h2 class="text-lg font-semibold text-casino-gold mb-2">1. Send this invite code to your friend</h2>
        <textarea readonly rows="4" class="input-field font-mono text-xs resize-none" bind:value={offerCode}></textarea>
        <button on:click={() => copy(offerCode, 'offer')} class="btn-secondary w-full mt-2">
          {copiedOffer ? '✅ Copied!' : '📋 Copy invite code'}
        </button>
      </section>

      <!-- Step 2: paste reply code -->
      <section class="mb-2">
        <h2 class="text-lg font-semibold text-casino-gold mb-2">2. Paste their reply code</h2>
        <textarea
          rows="4"
          bind:value={answerInput}
          placeholder="Paste the reply code from your friend here…"
          class="input-field font-mono text-xs resize-none"
        ></textarea>
        <button on:click={handleHostConnect} disabled={!answerInput.trim() || hostConnecting} class="btn-primary w-full mt-2">
          {hostConnecting ? 'Connecting…' : '🤝 Connect'}
        </button>
      </section>

      <button on:click={backToMenu} class="text-gray-400 text-sm mt-4 hover:text-gray-200">← Back</button>
    {:else if mode === 'guest'}
      {#if !answerCode}
        <!-- Step 1: paste invite code -->
        <section>
          <h2 class="text-lg font-semibold text-casino-gold mb-2">1. Paste your friend's invite code</h2>
          <textarea
            rows="4"
            bind:value={offerInput}
            placeholder="Paste the invite code here…"
            class="input-field font-mono text-xs resize-none"
          ></textarea>
          <button on:click={handleStartGuest} disabled={!offerInput.trim() || busy} class="btn-primary w-full mt-2">
            {busy ? 'Generating reply…' : '➡️ Generate reply code'}
          </button>
        </section>
      {:else}
        <!-- Step 2: send back reply code -->
        <section>
          <h2 class="text-lg font-semibold text-casino-gold mb-2">2. Send this reply code back to your friend</h2>
          <textarea readonly rows="4" class="input-field font-mono text-xs resize-none" bind:value={answerCode}></textarea>
          <button on:click={() => copy(answerCode, 'answer')} class="btn-secondary w-full mt-2">
            {copiedAnswer ? '✅ Copied!' : '📋 Copy reply code'}
          </button>
          <p class="text-center text-gray-400 text-sm mt-3">Waiting for your friend to connect…</p>
        </section>
      {/if}

      <button on:click={backToMenu} class="text-gray-400 text-sm mt-4 hover:text-gray-200">← Back</button>
    {/if}

    {#if error}
      <div class="mt-4">
        <ErrorNotification bind:error type={errorType} title={errorTitle} dismissible={true} autoDismiss={true} />
      </div>
    {/if}
  </div>
</div>

<style>
  .room-manager {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
