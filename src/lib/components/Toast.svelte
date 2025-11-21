<script lang="ts">
	import { onMount } from 'svelte';
	
	export let message = '';
	export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
	export let duration = 3000;
	export let visible = false;
	
	let timeoutId: number;
	
	const typeConfig = {
		success: {
			icon: '✓',
			bg: 'bg-green-600',
			border: 'border-green-500'
		},
		error: {
			icon: '✕',
			bg: 'bg-red-600',
			border: 'border-red-500'
		},
		info: {
			icon: 'ℹ',
			bg: 'bg-blue-600',
			border: 'border-blue-500'
		},
		warning: {
			icon: '⚠',
			bg: 'bg-yellow-600',
			border: 'border-yellow-500'
		}
	};
	
	$: config = typeConfig[type];
	
	$: if (visible && duration > 0) {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => {
			visible = false;
		}, duration);
	}
	
	function handleClose() {
		visible = false;
		if (timeoutId) clearTimeout(timeoutId);
	}
</script>

{#if visible}
	<div class="toast {config.bg} {config.border}" role="alert">
		<div class="toast-icon">
			{config.icon}
		</div>
		<div class="toast-message">
			{message}
		</div>
		<button class="toast-close" on:click={handleClose} aria-label="Close">
			×
		</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 2rem;
		right: 2rem;
		min-width: 300px;
		max-width: 500px;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		border-width: 2px;
		display: flex;
		align-items: center;
		gap: 1rem;
		color: white;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		z-index: 2000;
		animation: slide-in 0.3s ease-out, fade-out 0.3s ease-out forwards;
		animation-delay: 0s, 2.7s;
	}
	
	.toast-icon {
		font-size: 1.5rem;
		font-weight: bold;
		flex-shrink: 0;
	}
	
	.toast-message {
		flex: 1;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	
	.toast-close {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: background 0.2s;
		flex-shrink: 0;
	}
	
	.toast-close:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	
	@keyframes slide-in {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	
	@keyframes fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.toast {
			top: 1rem;
			right: 1rem;
			left: 1rem;
			min-width: auto;
		}
	}
</style>
