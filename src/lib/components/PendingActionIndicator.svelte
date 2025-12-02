<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		isPending: boolean;
		message?: string;
	}

	let { isPending, message = 'Processing...' }: Props = $props();
</script>

{#if isPending}
	<div
		class="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center pointer-events-none z-10"
		data-testid="pending-indicator"
	>
		<div class="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
			<Loader2 class="h-4 w-4 animate-spin text-blue-600" />
			<span class="text-sm font-medium text-gray-700">{message}</span>
		</div>
	</div>
{/if}
