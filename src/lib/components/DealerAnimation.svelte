<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	
	export let onComplete: (() => void) | undefined = undefined;
	export let autoComplete: boolean = true;
	export let duration: number = 4000; // Total animation duration in ms
	
	let stage: 'enter' | 'shuffle' | 'ready' = 'enter';
	let shuffleCount = 0;
	const maxShuffles = 6;
	
	onMount(() => {
		// Stage 1: Dealer enters (1s)
		setTimeout(() => {
			stage = 'shuffle';
			startShuffleAnimation();
		}, 1000);
		
		// Auto-complete after duration
		if (autoComplete && onComplete) {
			setTimeout(() => {
				stage = 'ready';
				setTimeout(() => {
					onComplete?.();
				}, 500);
			}, duration);
		}
	});
	
	function startShuffleAnimation() {
		const shuffleInterval = setInterval(() => {
			shuffleCount++;
			if (shuffleCount >= maxShuffles) {
				clearInterval(shuffleInterval);
			}
		}, 400);
	}
</script>

<div class="dealer-animation-overlay" transition:fade={{ duration: 300 }}>
	<div class="dealer-scene">
		<!-- Casino Table Background -->
		<div class="table-felt"></div>
		
		<!-- Dealer Character -->
		{#if stage !== 'enter'}
			<div class="dealer" in:fly={{ y: -100, duration: 800 }}>
				<div class="dealer-body">
					<div class="dealer-head">
						<div class="dealer-face">
							<div class="dealer-eyes">
								<div class="eye left"></div>
								<div class="eye right"></div>
							</div>
							<div class="dealer-smile"></div>
						</div>
						<div class="dealer-hat">
							<div class="hat-band"></div>
						</div>
					</div>
					<div class="dealer-torso">
						<div class="bow-tie"></div>
						<div class="vest"></div>
					</div>
					<div class="dealer-arms">
						<div class="arm left {stage === 'shuffle' ? 'shuffling' : ''}"></div>
						<div class="arm right {stage === 'shuffle' ? 'shuffling' : ''}"></div>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Card Deck Animation -->
		<div class="deck-area">
			{#if stage === 'shuffle'}
				<div class="shuffle-container" in:scale={{ duration: 300 }}>
					<!-- Left deck half -->
					<div class="deck-half left">
						{#each Array(8) as _, i}
							<div 
								class="shuffle-card" 
								style="--i: {i}; --delay: {i * 50}ms"
							></div>
						{/each}
					</div>
					
					<!-- Right deck half -->
					<div class="deck-half right">
						{#each Array(8) as _, i}
							<div 
								class="shuffle-card" 
								style="--i: {i}; --delay: {i * 50 + 25}ms"
							></div>
						{/each}
					</div>
					
					<!-- Flying cards during shuffle -->
					{#each Array(6) as _, i}
						<div 
							class="flying-card"
							style="--fly-delay: {i * 300 + 500}ms; --fly-x: {(i % 2 === 0 ? 1 : -1) * (30 + i * 10)}px"
						></div>
					{/each}
				</div>
			{/if}
			
			{#if stage === 'ready'}
				<div class="ready-deck" in:scale={{ duration: 400 }}>
					{#each Array(5) as _, i}
						<div class="stacked-card" style="--stack-i: {i}"></div>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Status Text -->
		<div class="status-text">
			{#if stage === 'enter'}
				<h2 in:fade={{ duration: 300 }}>Both Players Ready!</h2>
				<p>The dealer is coming...</p>
			{:else if stage === 'shuffle'}
				<h2 in:fly={{ y: 20, duration: 300 }}>🎴 Shuffling the Deck</h2>
				<p>Preparing your cards...</p>
				<div class="shuffle-progress">
					{#each Array(maxShuffles) as _, i}
						<div class="progress-dot {i < shuffleCount ? 'active' : ''}"></div>
					{/each}
				</div>
			{:else if stage === 'ready'}
				<h2 in:scale={{ duration: 300 }}>✨ Ready to Deal!</h2>
				<p>Let the game begin</p>
			{/if}
		</div>
		
		<!-- Decorative Elements -->
		<div class="sparkles">
			{#each Array(12) as _, i}
				<div class="sparkle" style="--sparkle-i: {i}">✦</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.dealer-animation-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		overflow: hidden;
	}
	
	.dealer-scene {
		position: relative;
		width: 100%;
		max-width: 600px;
		height: 500px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	/* Table Felt Background */
	.table-felt {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, #1a472a 0%, #0d2818 70%, #061a0f 100%);
		border-radius: 50% / 30%;
		border: 8px solid #8b4513;
		box-shadow: 
			inset 0 0 100px rgba(0, 0, 0, 0.5),
			0 0 50px rgba(0, 0, 0, 0.8);
	}
	
	/* Dealer Character */
	.dealer {
		position: relative;
		z-index: 10;
		margin-bottom: 2rem;
	}
	
	.dealer-body {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.dealer-head {
		position: relative;
		width: 80px;
		height: 80px;
	}
	
	.dealer-face {
		width: 70px;
		height: 70px;
		background: linear-gradient(180deg, #ffd5b4 0%, #e8b796 100%);
		border-radius: 50%;
		position: relative;
		margin: 0 auto;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}
	
	.dealer-eyes {
		position: absolute;
		top: 25px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 15px;
	}
	
	.eye {
		width: 8px;
		height: 8px;
		background: #2d1810;
		border-radius: 50%;
		animation: blink 3s infinite;
	}
	
	.dealer-smile {
		position: absolute;
		bottom: 18px;
		left: 50%;
		transform: translateX(-50%);
		width: 20px;
		height: 10px;
		border: 3px solid #c9302c;
		border-top: none;
		border-radius: 0 0 20px 20px;
		background: #e74c3c;
	}
	
	.dealer-hat {
		position: absolute;
		top: -25px;
		left: 50%;
		transform: translateX(-50%);
		width: 90px;
		height: 35px;
		background: linear-gradient(180deg, #1a1a1a 0%, #333 100%);
		border-radius: 10px 10px 0 0;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
	}
	
	.dealer-hat::before {
		content: '';
		position: absolute;
		bottom: -8px;
		left: -10px;
		right: -10px;
		height: 12px;
		background: #1a1a1a;
		border-radius: 5px;
	}
	
	.hat-band {
		position: absolute;
		bottom: 5px;
		left: 5px;
		right: 5px;
		height: 8px;
		background: linear-gradient(90deg, #d4af37, #f4d03f, #d4af37);
		border-radius: 2px;
	}
	
	.dealer-torso {
		width: 100px;
		height: 60px;
		background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
		border-radius: 10px 10px 0 0;
		position: relative;
		margin-top: -5px;
	}
	
	.bow-tie {
		position: absolute;
		top: 5px;
		left: 50%;
		transform: translateX(-50%);
		width: 30px;
		height: 15px;
		background: #c9302c;
		clip-path: polygon(0 50%, 40% 0, 40% 100%, 60% 100%, 60% 0, 100% 50%, 60% 100%, 60% 0, 40% 0, 40% 100%);
	}
	
	.bow-tie::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: #a02020;
		border-radius: 50%;
	}
	
	.vest {
		position: absolute;
		top: 25px;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 35px;
		background: linear-gradient(180deg, #8b0000 0%, #5c0000 100%);
		clip-path: polygon(10% 0, 90% 0, 100% 100%, 0 100%);
	}
	
	.dealer-arms {
		position: absolute;
		top: 85px;
		width: 140px;
		display: flex;
		justify-content: space-between;
	}
	
	.arm {
		width: 20px;
		height: 50px;
		background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
		border-radius: 10px;
		transform-origin: top center;
	}
	
	.arm.left {
		transform: rotate(-20deg);
	}
	
	.arm.right {
		transform: rotate(20deg);
	}
	
	.arm.shuffling.left {
		animation: shuffle-arm-left 0.4s ease-in-out infinite;
	}
	
	.arm.shuffling.right {
		animation: shuffle-arm-right 0.4s ease-in-out infinite;
	}
	
	/* Deck Area */
	.deck-area {
		position: relative;
		z-index: 5;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.shuffle-container {
		position: relative;
		display: flex;
		gap: 20px;
		align-items: center;
	}
	
	.deck-half {
		position: relative;
		width: 70px;
		height: 100px;
	}
	
	.shuffle-card {
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		transform: translateY(calc(var(--i) * -3px));
	}
	
	.shuffle-card::before {
		content: '♠♥♦♣';
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.3);
		letter-spacing: 2px;
	}
	
	.deck-half.left .shuffle-card {
		animation: shuffle-left 0.8s ease-in-out infinite;
		animation-delay: var(--delay);
	}
	
	.deck-half.right .shuffle-card {
		animation: shuffle-right 0.8s ease-in-out infinite;
		animation-delay: var(--delay);
	}
	
	.flying-card {
		position: absolute;
		width: 50px;
		height: 70px;
		background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%);
		border-radius: 6px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		animation: fly-card 2s ease-in-out infinite;
		animation-delay: var(--fly-delay);
		opacity: 0;
	}
	
	.ready-deck {
		position: relative;
		width: 80px;
		height: 110px;
	}
	
	.stacked-card {
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%);
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		transform: translateY(calc(var(--stack-i) * -4px)) rotate(calc(var(--stack-i) * 1deg));
		animation: stack-settle 0.5s ease-out forwards;
		animation-delay: calc(var(--stack-i) * 100ms);
	}
	
	/* Status Text */
	.status-text {
		position: relative;
		z-index: 10;
		text-align: center;
		margin-top: 2rem;
	}
	
	.status-text h2 {
		font-size: 2rem;
		font-weight: 700;
		color: #f4d03f;
		text-shadow: 0 2px 10px rgba(244, 208, 63, 0.5);
		margin-bottom: 0.5rem;
	}
	
	.status-text p {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.shuffle-progress {
		display: flex;
		gap: 8px;
		justify-content: center;
		margin-top: 1rem;
	}
	
	.progress-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}
	
	.progress-dot.active {
		background: #f4d03f;
		box-shadow: 0 0 10px #f4d03f;
		transform: scale(1.2);
	}
	
	/* Sparkles */
	.sparkles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}
	
	.sparkle {
		position: absolute;
		color: #f4d03f;
		font-size: 1.5rem;
		opacity: 0;
		animation: sparkle 2s ease-in-out infinite;
		animation-delay: calc(var(--sparkle-i) * 200ms);
	}
	
	.sparkle:nth-child(1) { top: 10%; left: 10%; }
	.sparkle:nth-child(2) { top: 20%; left: 80%; }
	.sparkle:nth-child(3) { top: 30%; left: 20%; }
	.sparkle:nth-child(4) { top: 40%; left: 90%; }
	.sparkle:nth-child(5) { top: 50%; left: 5%; }
	.sparkle:nth-child(6) { top: 60%; left: 85%; }
	.sparkle:nth-child(7) { top: 70%; left: 15%; }
	.sparkle:nth-child(8) { top: 80%; left: 75%; }
	.sparkle:nth-child(9) { top: 15%; left: 50%; }
	.sparkle:nth-child(10) { top: 85%; left: 40%; }
	.sparkle:nth-child(11) { top: 45%; left: 60%; }
	.sparkle:nth-child(12) { top: 75%; left: 30%; }
	
	/* Animations */
	@keyframes blink {
		0%, 90%, 100% { transform: scaleY(1); }
		95% { transform: scaleY(0.1); }
	}
	
	@keyframes shuffle-arm-left {
		0%, 100% { transform: rotate(-20deg); }
		50% { transform: rotate(-40deg) translateX(-10px); }
	}
	
	@keyframes shuffle-arm-right {
		0%, 100% { transform: rotate(20deg); }
		50% { transform: rotate(40deg) translateX(10px); }
	}
	
	@keyframes shuffle-left {
		0%, 100% { transform: translateY(calc(var(--i) * -3px)) translateX(0); }
		50% { transform: translateY(calc(var(--i) * -3px - 20px)) translateX(30px) rotate(5deg); }
	}
	
	@keyframes shuffle-right {
		0%, 100% { transform: translateY(calc(var(--i) * -3px)) translateX(0); }
		50% { transform: translateY(calc(var(--i) * -3px - 20px)) translateX(-30px) rotate(-5deg); }
	}
	
	@keyframes fly-card {
		0%, 100% { 
			opacity: 0;
			transform: translateY(0) translateX(0) rotate(0deg);
		}
		10% { opacity: 1; }
		50% { 
			opacity: 1;
			transform: translateY(-60px) translateX(var(--fly-x)) rotate(180deg);
		}
		90% { opacity: 1; }
	}
	
	@keyframes stack-settle {
		0% {
			transform: translateY(-50px) rotate(calc(var(--stack-i) * 10deg));
			opacity: 0;
		}
		100% {
			transform: translateY(calc(var(--stack-i) * -4px)) rotate(calc(var(--stack-i) * 1deg));
			opacity: 1;
		}
	}
	
	@keyframes sparkle {
		0%, 100% { 
			opacity: 0;
			transform: scale(0) rotate(0deg);
		}
		50% { 
			opacity: 1;
			transform: scale(1) rotate(180deg);
		}
	}
	
	/* Responsive */
	@media (max-width: 480px) {
		.dealer-scene {
			height: 450px;
		}
		
		.status-text h2 {
			font-size: 1.5rem;
		}
		
		.dealer-head {
			width: 60px;
			height: 60px;
		}
		
		.dealer-face {
			width: 50px;
			height: 50px;
		}
		
		.dealer-torso {
			width: 80px;
			height: 50px;
		}
	}
</style>
