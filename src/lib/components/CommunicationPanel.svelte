<script lang="ts">
	import { communication, type ChatMessage } from '$lib/stores/communication.svelte';
	import { gameStore } from '$stores/gameStore';
	import { connectionStore } from '$stores/connectionStore';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	// State
	let chatInput = $state('');
	let showPanel = $state(false);
	let showVideo = $state(false);
	// DOM reference - not reactive state, used for scrolling
	let chatContainer: HTMLDivElement | undefined;
	let initialized = $state(false);
	
	// Get session token for message ownership comparison
	// This matches the sender_id that the backend uses
	function getSessionToken(): string | null {
		if (!browser) return null;
		return sessionStorage.getItem('session_token');
	}
	
	// Check if a message is from the current user
	function isOwnMessage(senderId: string): boolean {
		const sessionToken = getSessionToken();
		// Compare with session token (backend sends session_id as sender_id)
		if (sessionToken && senderId === sessionToken) return true;
		// Fallback: compare with player ID
		if (senderId === $gameStore.playerId) return true;
		return false;
	}
	
	// Reactive initialization - runs when gameStore values become available
	$effect(() => {
		const roomId = $gameStore.roomId;
		const playerId = $gameStore.playerId;
		const playerName = $gameStore.playerName;
		
		// Get session token for sender identification (used by backend)
		const sessionToken = getSessionToken();
		
		if (roomId && playerId && playerName && !initialized) {
			const wsSend = (msg: any) => {
				connectionStore.send(msg);
			};
			// Use session token as the ID for message comparison (matches backend sender_id)
			communication.initialize(roomId, sessionToken || playerId, playerName, wsSend);
			initialized = true;
		}
	});
	
	onDestroy(() => {
		communication.cleanup();
		initialized = false;
	});
	
	// Auto-scroll chat
	$effect(() => {
		if (chatContainer && communication.messages.length > 0) {
			// Capture reference for use in setTimeout closure
			const container = chatContainer;
			setTimeout(() => {
				if (container) {
					container.scrollTop = container.scrollHeight;
				}
			}, 50);
		}
	});
	
	function handleSendMessage() {
		if (chatInput.trim()) {
			communication.sendMessage(chatInput);
			chatInput = '';
		}
	}
	
	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	}
	
	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
	
	function setSrcObject(node: HTMLVideoElement | HTMLAudioElement, stream: MediaStream | null) {
		if (stream) node.srcObject = stream;
		return {
			update(newStream: MediaStream | null) { node.srcObject = newStream; },
			destroy() { node.srcObject = null; }
		};
	}
</script>

<!-- Floating Controls -->
<div class="comm-controls">
	<!-- Toggle Panel Button -->
	<button
		onclick={() => showPanel = !showPanel}
		class="control-btn main-toggle"
		class:active={showPanel}
		title="Communication Panel"
	>
		💬
		{#if communication.unreadCount > 0 && !showPanel}
			<span class="badge">{communication.unreadCount}</span>
		{/if}
	</button>
	
	<!-- Quick Audio Toggle -->
	<button
		onclick={() => communication.toggleAudio()}
		class="control-btn"
		class:active={!communication.isAudioMuted}
		class:speaking={communication.isSpeaking}
		title={communication.isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
	>
		{communication.isAudioMuted ? '🎤' : '🔊'}
	</button>
	
	<!-- Quick Video Toggle -->
	<button
		onclick={() => { communication.toggleVideo(); showVideo = !communication.isVideoMuted; }}
		class="control-btn"
		class:active={!communication.isVideoMuted}
		title={communication.isVideoMuted ? 'Enable Camera' : 'Disable Camera'}
	>
		{communication.isVideoMuted ? '📷' : '🎥'}
	</button>
</div>

<!-- Communication Panel -->
{#if showPanel}
	<div class="comm-panel">
		<div class="panel-header">
			<h3>💬 Communication</h3>
			<button onclick={() => showPanel = false} class="close-btn">✕</button>
		</div>
		
		<!-- Video Section -->
		{#if showVideo || !communication.isVideoMuted || !communication.isOpponentVideoMuted}
			<div class="video-section">
				<!-- Remote Video -->
				{#if communication.remoteStream && !communication.isOpponentVideoMuted}
					<div class="video-container remote">
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							data-comm-video
							autoplay
							playsinline
							use:setSrcObject={communication.remoteStream}
						></video>
						<span class="video-label">Opponent</span>
						{#if communication.isOpponentSpeaking}
							<span class="speaking-indicator"></span>
						{/if}
					</div>
				{:else}
					<div class="video-placeholder remote">
						<span class="avatar">👤</span>
						<span class="label">
							{communication.isOpponentVideoMuted ? 'Camera Off' : 'Waiting...'}
						</span>
					</div>
				{/if}
				
				<!-- Local Video (Picture-in-Picture) -->
				{#if communication.localStream && !communication.isVideoMuted}
					<div class="video-container local">
						<video
							autoplay
							playsinline
							muted
							use:setSrcObject={communication.localStream}
						></video>
						<span class="video-label">You</span>
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Media Controls -->
		<div class="media-controls">
			<button
				onclick={() => communication.toggleAudio()}
				class="media-btn"
				class:active={!communication.isAudioMuted}
				class:speaking={communication.isSpeaking}
			>
				{#if communication.isAudioMuted}
					🎤 Unmute
				{:else}
					🔊 Muted
				{/if}
			</button>
			
			<button
				onclick={() => { communication.toggleVideo(); showVideo = true; }}
				class="media-btn"
				class:active={!communication.isVideoMuted}
			>
				{#if communication.isVideoMuted}
					📷 Start Video
				{:else}
					🎥 Stop Video
				{/if}
			</button>
			
			<!-- Volume Slider -->
			<div class="volume-control">
				<span>🔈</span>
				<input
					type="range"
					min="0"
					max="100"
					value={communication.audioVolume}
					oninput={(e) => communication.setVolume(Number((e.target as HTMLInputElement).value))}
				/>
				<span class="volume-value">{communication.audioVolume}%</span>
			</div>
		</div>
		
		<!-- Opponent Status -->
		<div class="opponent-status">
			<span class="status-item">
				{communication.isOpponentAudioMuted ? '🔇' : '🔊'} 
				Opponent {communication.isOpponentAudioMuted ? 'muted' : 'unmuted'}
			</span>
			{#if communication.isOpponentSpeaking}
				<span class="speaking-badge">Speaking...</span>
			{/if}
		</div>
		
		<!-- Chat Section -->
		<div class="chat-section">
			<div class="chat-messages" bind:this={chatContainer}>
				{#each communication.messages as msg (msg.id)}
					<div 
						class="message"
						class:own={isOwnMessage(msg.senderId)}
						class:system={msg.isSystem}
					>
						{#if !msg.isSystem}
							<span class="sender">{msg.senderName}</span>
						{/if}
						<span class="content">{msg.content}</span>
						<span class="time">{formatTime(msg.timestamp)}</span>
					</div>
				{/each}
				
				{#if communication.messages.length === 0}
					<div class="no-messages">
						No messages yet. Say hi! 👋
					</div>
				{/if}
			</div>
			
			<div class="chat-input">
				<input
					type="text"
					bind:value={chatInput}
					onkeypress={handleKeyPress}
					placeholder="Type a message..."
					maxlength="500"
				/>
				<button onclick={handleSendMessage} disabled={!chatInput.trim()}>
					Send
				</button>
			</div>
		</div>
		
		<!-- Connection Status -->
		{#if communication.connectionError}
			<div class="error-banner">
				⚠️ {communication.connectionError}
			</div>
		{/if}
	</div>
{/if}

<!-- Hidden audio for remote stream -->
{#if communication.remoteStream}
	<audio
		data-comm-audio
		autoplay
		playsinline
		use:setSrcObject={communication.remoteStream}
		class="hidden"
	></audio>
{/if}

<style>
	.comm-controls {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 100;
	}
	
	.control-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		background: #1f2937;
		color: white;
		font-size: 1.25rem;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	}
	
	.control-btn:hover {
		transform: scale(1.1);
		background: #374151;
	}
	
	.control-btn.active {
		background: #d4af37;
		color: #111;
	}
	
	.control-btn.speaking {
		box-shadow: 0 0 0 3px #10b981, 0 4px 12px rgba(0,0,0,0.3);
	}
	
	.main-toggle {
		width: 56px;
		height: 56px;
		font-size: 1.5rem;
	}
	
	.badge {
		position: absolute;
		top: -4px;
		right: -4px;
		background: #ef4444;
		color: white;
		font-size: 0.75rem;
		padding: 2px 6px;
		border-radius: 9999px;
		font-weight: 600;
	}
	
	.comm-panel {
		position: fixed;
		bottom: 5rem;
		right: 1rem;
		width: 360px;
		max-height: 80vh;
		background: #1f2937;
		border: 2px solid #d4af37;
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		z-index: 99;
		box-shadow: 0 10px 40px rgba(0,0,0,0.5);
		overflow: hidden;
	}
	
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #111827;
		border-bottom: 1px solid #374151;
	}
	
	.panel-header h3 {
		margin: 0;
		font-size: 1rem;
		color: #d4af37;
	}
	
	.close-btn {
		background: none;
		border: none;
		color: #9ca3af;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
	}
	
	.close-btn:hover {
		color: white;
	}
	
	.video-section {
		position: relative;
		background: #000;
		aspect-ratio: 16/9;
		max-height: 200px;
	}
	
	.video-container {
		position: relative;
	}
	
	.video-container.remote {
		width: 100%;
		height: 100%;
	}
	
	.video-container.local {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		width: 80px;
		height: 60px;
		border: 2px solid #d4af37;
		border-radius: 0.5rem;
		overflow: hidden;
	}
	
	.video-container video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.video-label {
		position: absolute;
		bottom: 0.25rem;
		left: 0.5rem;
		background: rgba(0,0,0,0.7);
		color: white;
		font-size: 0.7rem;
		padding: 2px 6px;
		border-radius: 4px;
	}
	
	.speaking-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 12px;
		height: 12px;
		background: #10b981;
		border-radius: 50%;
		animation: pulse 1s infinite;
	}
	
	.video-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #111827;
		color: #6b7280;
	}
	
	.video-placeholder .avatar {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}
	
	.media-controls {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #111827;
		flex-wrap: wrap;
	}
	
	.media-btn {
		flex: 1;
		min-width: 100px;
		padding: 0.5rem;
		border: 1px solid #374151;
		border-radius: 0.5rem;
		background: #1f2937;
		color: #d1d5db;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.media-btn:hover {
		background: #374151;
	}
	
	.media-btn.active {
		background: #d4af37;
		color: #111;
		border-color: #d4af37;
	}
	
	.media-btn.speaking {
		box-shadow: 0 0 0 2px #10b981;
	}
	
	.volume-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.25rem 0;
	}
	
	.volume-control input {
		flex: 1;
		height: 4px;
		accent-color: #d4af37;
	}
	
	.volume-value {
		font-size: 0.75rem;
		color: #9ca3af;
		min-width: 35px;
	}
	
	.opponent-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #111827;
		border-bottom: 1px solid #374151;
		font-size: 0.8rem;
		color: #9ca3af;
	}
	
	.speaking-badge {
		background: #10b981;
		color: white;
		padding: 2px 8px;
		border-radius: 9999px;
		font-size: 0.7rem;
		animation: pulse 1s infinite;
	}
	
	.chat-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 200px;
		max-height: 300px;
	}
	
	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.message {
		max-width: 85%;
		padding: 0.5rem 0.75rem;
		border-radius: 1rem;
		background: #374151;
		align-self: flex-start;
	}
	
	.message.own {
		background: #d4af37;
		color: #111;
		align-self: flex-end;
	}
	
	.message.system {
		background: transparent;
		color: #6b7280;
		font-size: 0.75rem;
		text-align: center;
		align-self: center;
		font-style: italic;
	}
	
	.message .sender {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		color: #d4af37;
		margin-bottom: 2px;
	}
	
	.message.own .sender {
		color: #92400e;
	}
	
	.message .content {
		display: block;
		word-break: break-word;
		font-size: 0.875rem;
	}
	
	.message .time {
		display: block;
		font-size: 0.65rem;
		opacity: 0.7;
		text-align: right;
		margin-top: 2px;
	}
	
	.no-messages {
		text-align: center;
		color: #6b7280;
		padding: 2rem;
		font-size: 0.875rem;
	}
	
	.chat-input {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		border-top: 1px solid #374151;
		background: #111827;
	}
	
	.chat-input input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #374151;
		border-radius: 9999px;
		background: #1f2937;
		color: white;
		font-size: 0.875rem;
	}
	
	.chat-input input:focus {
		outline: none;
		border-color: #d4af37;
	}
	
	.chat-input button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 9999px;
		background: #d4af37;
		color: #111;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.chat-input button:hover:not(:disabled) {
		background: #b8860b;
	}
	
	.chat-input button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.error-banner {
		padding: 0.5rem 0.75rem;
		background: #7f1d1d;
		color: #fecaca;
		font-size: 0.8rem;
		text-align: center;
	}
	
	.hidden {
		display: none;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	
	/* Responsive */
	@media (max-width: 480px) {
		.comm-panel {
			width: calc(100vw - 2rem);
			right: 1rem;
			left: 1rem;
			bottom: 4.5rem;
		}
	}
</style>
