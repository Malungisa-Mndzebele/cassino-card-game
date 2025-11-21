<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { gameStore } from '$stores/gameStore';
	import { connectionStore } from '$stores/connectionStore';

	onMount(() => {
		// Initialize stores
		gameStore.initialize();
		connectionStore.initialize();

		// Cleanup on unmount
		return () => {
			connectionStore.disconnect();
		};
	});
</script>

<slot />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}
</style>
