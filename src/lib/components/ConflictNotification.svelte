<script lang="ts">
	import { AlertCircle, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		message: string;
		onDismiss?: () => void;
		autoDismiss?: boolean;
		dismissDelay?: number;
	}

	let { message, onDismiss, autoDismiss = true, dismissDelay = 5000 }: Props = $props();

	let visible = $state(true);

	// Auto-dismiss after delay
	if (autoDismiss) {
		setTimeout(() => {
			visible = false;
			if (onDismiss) {
				setTimeout(onDismiss, 300); // Wait for fade out animation
			}
		}, dismissDelay);
	}

	function handleDismiss() {
		visible = false;
		if (onDismiss) {
			setTimeout(onDismiss, 300);
		}
	}
</script>

{#if visible}
	<div
		class="fixed bottom-4 right-4 z-50 max-w-sm w-full mx-4"
		transition:fly={{ y: 50, duration: 300 }}
		data-testid="conflict-notification"
	>
		<div class="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-lg">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<AlertCircle class="h-5 w-5 text-red-400" />
				</div>
				<div class="ml-3 flex-1">
					<h3 class="text-sm font-medium text-red-800">Action Conflict</h3>
					<div class="mt-1 text-sm text-red-700">
						<p>{message}</p>
					</div>
				</div>
				<div class="ml-4 flex-shrink-0">
					<button
						type="button"
						onclick={handleDismiss}
						class="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors"
						data-testid="dismiss-conflict"
					>
						<span class="sr-only">Dismiss</span>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
