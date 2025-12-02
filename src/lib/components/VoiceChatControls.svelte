<script lang="ts">
	import { voiceChat } from '$lib/stores/voiceChat.svelte';
	import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-svelte';

	// Props
	let { position = 'bottom-right' as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' } =
		$props();

	// Position classes
	const positionClasses = {
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4'
	};

	// Show/hide volume slider
	let showVolumeSlider = $state(false);

	// Handle mute toggle
	async function handleMuteToggle() {
		await voiceChat.toggleMute();
	}

	// Handle volume change
	function handleVolumeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		voiceChat.setVolume(Number(target.value));
	}

	// Toggle volume slider visibility
	function toggleVolumeSlider() {
		showVolumeSlider = !showVolumeSlider;
	}
</script>

<div
	class="voice-chat-controls fixed {positionClasses[position]} z-50 flex flex-col gap-2 items-end"
>
	<!-- Volume Control -->
	{#if showVolumeSlider}
		<div
			class="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-700 flex items-center gap-3"
		>
			<button
				onclick={toggleVolumeSlider}
				class="p-2 rounded-lg hover:bg-gray-700 transition-colors"
				title="Hide volume"
			>
				{#if voiceChat.volume === 0}
					<VolumeX class="w-5 h-5 text-gray-400" />
				{:else}
					<Volume2 class="w-5 h-5 text-casino-gold" />
				{/if}
			</button>

			<input
				type="range"
				min="0"
				max="100"
				value={voiceChat.volume}
				oninput={handleVolumeChange}
				class="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-casino-gold"
				title="Opponent volume: {voiceChat.volume}%"
			/>

			<span class="text-sm text-gray-400 w-10 text-right">{voiceChat.volume}%</span>
		</div>
	{/if}

	<!-- Main Controls -->
	<div
		class="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-700 flex items-center gap-3"
	>
		<!-- Volume Button -->
		<button
			onclick={toggleVolumeSlider}
			class="p-2 rounded-lg hover:bg-gray-700 transition-colors"
			title={showVolumeSlider ? 'Hide volume' : 'Show volume'}
		>
			{#if voiceChat.volume === 0}
				<VolumeX class="w-5 h-5 text-gray-400" />
			{:else}
				<Volume2 class="w-5 h-5 text-gray-400 hover:text-casino-gold" />
			{/if}
		</button>

		<!-- Mute/Unmute Button -->
		<button
			onclick={handleMuteToggle}
			disabled={voiceChat.isConnecting || !!voiceChat.connectionError}
			class="relative p-3 rounded-lg transition-all {voiceChat.isMuted
				? 'bg-gray-700 hover:bg-gray-600'
				: 'bg-casino-gold hover:bg-yellow-600'} disabled:opacity-50 disabled:cursor-not-allowed"
			title={voiceChat.isMuted ? 'Unmute microphone' : 'Mute microphone'}
		>
			{#if voiceChat.isConnecting}
				<Loader2 class="w-6 h-6 text-gray-400 animate-spin" />
			{:else if voiceChat.isMuted}
				<MicOff class="w-6 h-6 text-gray-400" />
			{:else}
				<Mic class="w-6 h-6 text-gray-900" />
			{/if}

			<!-- Speaking Indicator -->
			{#if voiceChat.isSpeaking && !voiceChat.isMuted}
				<span
					class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"
					title="You are speaking"
				></span>
			{/if}
		</button>

		<!-- Connection Status Indicator -->
		{#if voiceChat.isConnected}
			<div class="w-2 h-2 bg-green-500 rounded-full" title="Voice chat connected"></div>
		{:else if voiceChat.isConnecting}
			<div
				class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
				title="Connecting voice chat..."
			></div>
		{:else if voiceChat.connectionError}
			<div class="w-2 h-2 bg-red-500 rounded-full" title={voiceChat.connectionError}></div>
		{/if}
	</div>

	<!-- Error Message -->
	{#if voiceChat.connectionError}
		<div
			class="bg-red-900/90 backdrop-blur-sm text-red-200 px-4 py-2 rounded-lg shadow-lg border border-red-700 text-sm max-w-xs"
		>
			{voiceChat.connectionError}
		</div>
	{/if}

	<!-- Opponent Status -->
	{#if voiceChat.isConnected}
		<div
			class="bg-gray-800/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-700 flex items-center gap-2 text-sm"
		>
			{#if voiceChat.isOpponentMuted}
				<MicOff class="w-4 h-4 text-gray-500" />
				<span class="text-gray-400">Opponent muted</span>
			{:else}
				<Mic class="w-4 h-4 text-casino-gold" />
				<span class="text-gray-300">Opponent unmuted</span>
				{#if voiceChat.isOpponentSpeaking}
					<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<!-- Hidden audio element for remote stream -->
{#if voiceChat.remoteStream}
	<audio
		data-voice-chat
		autoplay
		playsinline
		srcObject={voiceChat.remoteStream}
		class="hidden"
	></audio>
{/if}

<style>
	/* Custom range slider styling */
	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #d4af37; /* casino-gold */
		cursor: pointer;
	}

	input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #d4af37; /* casino-gold */
		cursor: pointer;
		border: none;
	}
</style>
