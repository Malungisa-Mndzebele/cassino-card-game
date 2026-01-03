<script lang="ts">
	import type { Card as CardType } from '$types/game';
	import { getCardColor } from '$utils/helpers';
	
	export let card: CardType;
	export let isHidden = false;
	export let isPlayable = false;
	export let isSelected = false;
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let onClick: (() => void) | undefined = undefined;
	
	// Size classes - Microsoft Hearts style proportions
	const sizeClasses = {
		small: 'card-small',
		medium: 'card-medium',
		large: 'card-large'
	};
	
	// Card color
	$: cardColor = getCardColor(card.suit);
	$: isRed = cardColor === 'red';
	
	function handleClick() {
		if (isPlayable && onClick) {
			onClick();
		}
	}
	
	// Get suit symbol for display
	function getSuitSymbol(suit: string): string {
		return suit;
	}
</script>

<button
	class="card {sizeClasses[size]} {isPlayable ? 'playable' : ''} {isHidden ? 'hidden-card' : ''} {isSelected ? 'selected' : ''}"
	on:click={handleClick}
	disabled={!isPlayable}
	type="button"
>
	{#if isHidden}
		<!-- Card Back - Classic blue pattern -->
		<div class="card-back">
			<div class="card-back-border">
				<div class="card-back-pattern">
					<div class="card-back-diamond"></div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Card Front - Classic playing card style -->
		<div class="card-front" class:red={isRed}>
			<!-- Top Left Corner -->
			<div class="corner top-left">
				<span class="rank">{card.rank}</span>
				<span class="suit">{getSuitSymbol(card.suit)}</span>
			</div>
			
			<!-- Center Suit Display -->
			<div class="center-area">
				<span class="center-suit">{getSuitSymbol(card.suit)}</span>
			</div>
			
			<!-- Bottom Right Corner (rotated) -->
			<div class="corner bottom-right">
				<span class="rank">{card.rank}</span>
				<span class="suit">{getSuitSymbol(card.suit)}</span>
			</div>
		</div>
	{/if}
</button>

<style>
	.card {
		position: relative;
		border-radius: 6px;
		background: var(--card-bg, #fffef8);
		box-shadow: 
			0 1px 2px rgba(0, 0, 0, 0.2),
			0 2px 4px rgba(0, 0, 0, 0.15),
			0 4px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		cursor: default;
		border: 1px solid rgba(0, 0, 0, 0.15);
		overflow: hidden;
		flex-shrink: 0;
	}
	
	/* Card sizes - classic proportions */
	.card-small {
		width: 50px;
		height: 70px;
		font-size: 10px;
	}
	
	.card-medium {
		width: 70px;
		height: 98px;
		font-size: 14px;
	}
	
	.card-large {
		width: 90px;
		height: 126px;
		font-size: 18px;
	}
	
	.card:not(.hidden-card) {
		animation: card-appear 0.3s ease-out;
	}
	
	.card.playable {
		cursor: pointer;
	}
	
	.card.playable:hover {
		transform: translateY(-12px);
		box-shadow: 
			0 4px 8px rgba(0, 0, 0, 0.25),
			0 8px 16px rgba(0, 0, 0, 0.2),
			0 12px 24px rgba(0, 0, 0, 0.15);
	}
	
	.card.playable:active {
		transform: translateY(-6px);
	}
	
	.card.selected {
		transform: translateY(-20px);
		box-shadow: 
			0 8px 16px rgba(0, 0, 0, 0.3),
			0 16px 32px rgba(0, 0, 0, 0.2),
			0 0 0 3px rgba(255, 215, 0, 0.8);
	}
	
	.card:disabled {
		cursor: not-allowed;
	}
	
	/* Card Back - Classic blue diamond pattern */
	.card-back {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%);
		padding: 3px;
	}
	
	.card-back-border {
		width: 100%;
		height: 100%;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
	}
	
	.card-back-pattern {
		width: 70%;
		height: 80%;
		background: 
			repeating-linear-gradient(
				45deg,
				transparent,
				transparent 4px,
				rgba(255, 255, 255, 0.1) 4px,
				rgba(255, 255, 255, 0.1) 8px
			),
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 4px,
				rgba(255, 255, 255, 0.1) 4px,
				rgba(255, 255, 255, 0.1) 8px
			);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.card-back-diamond {
		width: 30%;
		height: 40%;
		background: rgba(255, 255, 255, 0.15);
		transform: rotate(45deg);
		border: 1px solid rgba(255, 255, 255, 0.3);
	}
	
	/* Card Front */
	.card-front {
		width: 100%;
		height: 100%;
		padding: 4px;
		position: relative;
		background: var(--card-bg, #fffef8);
		color: var(--card-black, #1a1a1a);
	}
	
	.card-front.red {
		color: var(--card-red, #c41e3a);
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
		top: 4px;
		left: 4px;
	}
	
	.corner.bottom-right {
		bottom: 4px;
		right: 4px;
		transform: rotate(180deg);
	}
	
	.rank {
		font-size: 1.3em;
		font-weight: 700;
		font-family: 'Georgia', 'Times New Roman', serif;
	}
	
	.suit {
		font-size: 1em;
		line-height: 1;
		margin-top: -2px;
	}
	
	.center-area {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	
	.center-suit {
		font-size: 2.5em;
		opacity: 0.9;
	}
	
	/* Animations */
	@keyframes card-appear {
		from {
			opacity: 0;
			transform: translateY(-15px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	
	/* Hidden card animation */
	.hidden-card {
		animation: none;
	}
	
	/* Responsive sizing */
	@media (max-width: 640px) {
		.card-medium {
			width: 60px;
			height: 84px;
			font-size: 12px;
		}
		
		.card.playable:hover {
			transform: translateY(-8px);
		}
		
		.card.selected {
			transform: translateY(-14px);
		}
	}
</style>
