<script lang="ts">
	import type { Card as CardType } from '$types/game';
	import { getCardColor } from '$utils/helpers';
	
	export let card: CardType;
	export let isHidden = false;
	export let isPlayable = false;
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let onClick: (() => void) | undefined = undefined;
	
	// Size classes
	const sizeClasses = {
		small: 'w-16 h-24 text-sm',
		medium: 'w-20 h-32 text-base',
		large: 'w-24 h-36 text-lg'
	};
	
	// Card color
	$: cardColor = getCardColor(card.suit);
	$: colorClass = cardColor === 'red' ? 'text-red-500' : 'text-gray-900';
	
	function handleClick() {
		if (isPlayable && onClick) {
			onClick();
		}
	}
</script>

<button
	class="card {sizeClasses[size]} {isPlayable ? 'playable' : ''} {isHidden ? 'hidden-card' : ''}"
	on:click={handleClick}
	disabled={!isPlayable}
	type="button"
>
	{#if isHidden}
		<!-- Card Back -->
		<div class="card-back">
			<div class="card-pattern"></div>
		</div>
	{:else}
		<!-- Card Front -->
		<div class="card-front">
			<!-- Top Left Corner -->
			<div class="corner top-left {colorClass}">
				<div class="rank">{card.rank}</div>
				<div class="suit">{card.suit}</div>
			</div>
			
			<!-- Center Suit -->
			<div class="center-suit {colorClass}">
				{card.suit}
			</div>
			
			<!-- Bottom Right Corner (rotated) -->
			<div class="corner bottom-right {colorClass}">
				<div class="rank">{card.rank}</div>
				<div class="suit">{card.suit}</div>
			</div>
		</div>
	{/if}
</button>

<style>
	.card {
		position: relative;
		border-radius: 0.5rem;
		background: white;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		cursor: default;
		border: 2px solid #e5e7eb;
		overflow: hidden;
	}
	
	.card:not(.hidden-card) {
		animation: card-deal 0.5s ease-out;
	}
	
	.card.playable {
		cursor: pointer;
		border-color: #10b981;
	}
	
	.card.playable:hover {
		transform: translateY(-8px) scale(1.05);
		box-shadow: 0 12px 24px rgba(16, 185, 129, 0.3);
		border-color: #059669;
	}
	
	.card.playable:active {
		transform: translateY(-4px) scale(1.02);
	}
	
	.card:disabled {
		cursor: not-allowed;
	}
	
	/* Card Back */
	.card-back {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}
	
	.card-pattern {
		width: 80%;
		height: 80%;
		background-image: 
			repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px),
			repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 0.25rem;
	}
	
	/* Card Front */
	.card-front {
		width: 100%;
		height: 100%;
		padding: 0.5rem;
		position: relative;
		background: white;
	}
	
	.corner {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		font-weight: bold;
		line-height: 1;
	}
	
	.corner.top-left {
		top: 0.25rem;
		left: 0.25rem;
	}
	
	.corner.bottom-right {
		bottom: 0.25rem;
		right: 0.25rem;
		transform: rotate(180deg);
	}
	
	.rank {
		font-size: 1.25em;
		margin-bottom: 0.1em;
	}
	
	.suit {
		font-size: 1em;
	}
	
	.center-suit {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 2.5em;
		font-weight: bold;
		opacity: 0.3;
	}
	
	/* Animations */
	@keyframes card-deal {
		from {
			opacity: 0;
			transform: translateY(-20px) rotateY(90deg);
		}
		to {
			opacity: 1;
			transform: translateY(0) rotateY(0deg);
		}
	}
	
	/* Hidden card animation */
	.hidden-card {
		animation: card-flip 0.6s ease-in-out;
	}
	
	@keyframes card-flip {
		0% {
			transform: rotateY(0deg);
		}
		50% {
			transform: rotateY(90deg);
		}
		100% {
			transform: rotateY(0deg);
		}
	}
	
	/* Responsive sizing */
	@media (max-width: 640px) {
		.card {
			transform-origin: center;
		}
		
		.card.playable:hover {
			transform: translateY(-4px) scale(1.02);
		}
	}
</style>
