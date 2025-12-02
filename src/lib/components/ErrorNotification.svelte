<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { ErrorType, type formatErrorForDisplay } from '$lib/utils/errorHandler';

	// Props
	let {
		error = $bindable(''),
		type = ErrorType.UNKNOWN,
		title = 'Error',
		dismissible = true,
		autoDismiss = true,
		dismissAfter = 5000,
		onDismiss = () => {}
	}: {
		error: string;
		type?: ErrorType;
		title?: string;
		dismissible?: boolean;
		autoDismiss?: boolean;
		dismissAfter?: number;
		onDismiss?: () => void;
	} = $props();

	// Auto-dismiss timer
	let dismissTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (error && autoDismiss) {
			dismissTimer = setTimeout(() => {
				handleDismiss();
			}, dismissAfter);
		}

		return () => {
			if (dismissTimer) {
				clearTimeout(dismissTimer);
			}
		};
	});

	function handleDismiss() {
		error = '';
		onDismiss();
	}

	// Get styling based on error type
	function getTypeStyles(errorType: ErrorType): {
		bg: string;
		border: string;
		text: string;
		icon: string;
	} {
		switch (errorType) {
			case ErrorType.NETWORK:
				return {
					bg: 'bg-orange-900/50',
					border: 'border-orange-500',
					text: 'text-orange-200',
					icon: '🌐'
				};
			case ErrorType.VALIDATION:
				return {
					bg: 'bg-yellow-900/50',
					border: 'border-yellow-500',
					text: 'text-yellow-200',
					icon: '⚠️'
				};
			case ErrorType.AUTH:
				return {
					bg: 'bg-red-900/50',
					border: 'border-red-500',
					text: 'text-red-200',
					icon: '🔒'
				};
			case ErrorType.NOT_FOUND:
				return {
					bg: 'bg-blue-900/50',
					border: 'border-blue-500',
					text: 'text-blue-200',
					icon: '🔍'
				};
			case ErrorType.SERVER:
				return {
					bg: 'bg-purple-900/50',
					border: 'border-purple-500',
					text: 'text-purple-200',
					icon: '🖥️'
				};
			default:
				return {
					bg: 'bg-red-900/50',
					border: 'border-red-500',
					text: 'text-red-200',
					icon: '❌'
				};
		}
	}

	$: styles = getTypeStyles(type);
</script>

{#if error}
	<div
		class="error-notification {styles.bg} border {styles.border} rounded-lg p-4 shadow-lg"
		transition:fly={{ y: -20, duration: 300 }}
		role="alert"
		aria-live="assertive"
	>
		<div class="flex items-start gap-3">
			<span class="text-2xl flex-shrink-0">{styles.icon}</span>

			<div class="flex-1 min-w-0">
				<h3 class="{styles.text} font-semibold text-sm mb-1">{title}</h3>
				<p class="{styles.text} text-sm opacity-90">{error}</p>
			</div>

			{#if dismissible}
				<button
					onclick={handleDismiss}
					class="{styles.text} hover:opacity-100 opacity-70 transition-opacity flex-shrink-0"
					aria-label="Dismiss error"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.error-notification {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
