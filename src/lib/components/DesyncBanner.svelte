<script lang="ts">
	import { syncStateManager } from '$lib/stores/syncState.svelte';
	import { AlertTriangle, RefreshCw } from 'lucide-svelte';

	interface Props {
		onResync: () => Promise<void>;
	}

	let { onResync }: Props = $props();

	let isResyncing = $state(false);

	async function handleResync() {
		isResyncing = true;
		try {
			await onResync();
		} catch (error) {
			console.error('Resync failed:', error);
		} finally {
			isResyncing = false;
		}
	}
</script>

{#if syncStateManager.isDesynced}
	<div
		class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
		data-testid="desync-banner"
	>
		<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg">
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<AlertTriangle class="h-5 w-5 text-yellow-400" />
				</div>
				<div class="ml-3 flex-1">
					<h3 class="text-sm font-medium text-yellow-800">Game State Out of Sync</h3>
					<div class="mt-2 text-sm text-yellow-700">
						<p>
							Your game state may be out of sync with the server. Click "Resync" to refresh your
							view.
						</p>
						{#if syncStateManager.consecutiveChecksumMismatches > 0}
							<p class="mt-1 text-xs">
								Mismatches detected: {syncStateManager.consecutiveChecksumMismatches}
							</p>
						{/if}
					</div>
					<div class="mt-4">
						<button
							type="button"
							onclick={handleResync}
							disabled={isResyncing}
							class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							data-testid="resync-button"
						>
							<RefreshCw class="h-4 w-4 mr-2 {isResyncing ? 'animate-spin' : ''}" />
							{isResyncing ? 'Resyncing...' : 'Resync Now'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
