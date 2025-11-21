<script lang="ts">
	import { page } from '$app/stores';

	$: status = $page.status;
	$: message = $page.error?.message || 'Page not found';
</script>

<div class="min-h-screen casino-bg flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		<div class="backdrop-casino-dark rounded-2xl p-8 border-2 border-red-500/30 shadow-casino-lg text-center">
			<div class="text-6xl font-black text-red-500 mb-4">{status}</div>
			<h1 class="text-2xl font-bold text-white mb-2">Oops!</h1>
			<p class="text-slate-400 mb-6">{message}</p>
			<a href="/cassino" class="btn-primary inline-block">
				Return to Game
			</a>
		</div>
	</div>
</div>
