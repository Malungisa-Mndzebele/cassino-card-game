<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let disabled = false;
	export let loading = false;
	export let fullWidth = false;
	export let onClick: (() => void) | undefined = undefined;
	
	const variantClasses = {
		primary: 'bg-casino-gold hover:bg-yellow-600 text-gray-900',
		secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
		danger: 'bg-red-600 hover:bg-red-700 text-white',
		success: 'bg-green-600 hover:bg-green-700 text-white'
	};
	
	const sizeClasses = {
		small: 'px-3 py-1.5 text-sm',
		medium: 'px-4 py-2 text-base',
		large: 'px-6 py-3 text-lg'
	};
	
	function handleClick() {
		if (!disabled && !loading && onClick) {
			onClick();
		}
	}
</script>

<button
	class="btn {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''}"
	on:click={handleClick}
	{disabled}
	type="button"
>
	{#if loading}
		<span class="spinner"></span>
	{/if}
	<slot />
</button>

<style>
	.btn {
		font-weight: 600;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: none;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
	
	.btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}
	
	.btn:active:not(:disabled) {
		transform: translateY(0);
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
