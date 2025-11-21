<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$components';
	
	export let open = false;
	export let title = '';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let confirmVariant: 'primary' | 'danger' | 'success' = 'primary';
	export let showCancel = true;
	
	const dispatch = createEventDispatcher();
	
	function handleConfirm() {
		dispatch('confirm');
		open = false;
	}
	
	function handleCancel() {
		dispatch('cancel');
		open = false;
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<div class="dialog-backdrop" on:click={handleBackdropClick} role="presentation">
		<div class="dialog-container" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
			{#if title}
				<div class="dialog-header">
					<h2 id="dialog-title" class="dialog-title">{title}</h2>
				</div>
			{/if}
			
			<div class="dialog-content">
				<slot />
			</div>
			
			<div class="dialog-footer">
				{#if showCancel}
					<Button variant="secondary" onClick={handleCancel}>
						{cancelText}
					</Button>
				{/if}
				<Button variant={confirmVariant} onClick={handleConfirm}>
					{confirmText}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fade-in 0.2s ease-out;
	}
	
	.dialog-container {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border: 2px solid var(--casino-gold);
		border-radius: 1rem;
		max-width: 500px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		animation: slide-up 0.3s ease-out;
	}
	
	.dialog-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.dialog-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--casino-gold);
		margin: 0;
	}
	
	.dialog-content {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
		color: var(--text-primary);
	}
	
	.dialog-footer {
		padding: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}
	
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	@keyframes slide-up {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	/* Responsive */
	@media (max-width: 640px) {
		.dialog-container {
			max-width: 100%;
			margin: 0;
		}
		
		.dialog-header,
		.dialog-content,
		.dialog-footer {
			padding: 1rem;
		}
		
		.dialog-footer {
			flex-direction: column-reverse;
		}
	}
</style>
