# Add Table Build UI elements to GameBoard.svelte

$content = Get-Content "src\lib\components\GameBoard.svelte" -Raw

# 1. Add Table Build button in the action area (when table cards selected but no hand card)
$selectionSummary = '{#if selectedTableCards.length > 0 || selectedBuildIds.length > 0}'
$newSelectionArea = @"
{#if selectedTableCards.length >= 2 && !selectedCard && isMyTurn}
		<div class="table-build-action">
			<p class="table-build-hint">You can create a table build from these {selectedTableCards.length} cards</p>
			<button class="btn-action btn-table-build" on:click={handleTableBuildAction} disabled={isProcessing || possibleTableBuildValues.length === 0}>
				{#if isProcessing}<span class="spinner"></span>{:else}Table Build{/if}
			</button>
			{#if possibleTableBuildValues.length === 0}
				<p class="no-build-hint">No valid build - you need a card in hand to capture</p>
			{/if}
		</div>
	{/if}
	{#if selectedTableCards.length > 0 || selectedBuildIds.length > 0}
"@
$content = $content -replace [regex]::Escape($selectionSummary), $newSelectionArea

# 2. Add Table Build Modal (after the drag build modal)
$dragModalEnd = '{/if showDragBuildModal && dragBuildCard && dragTargetCard}'
# Find a better marker - the closing of the drag build modal
$modalMarker = '</style>'
$tableBuildModal = @"

{#if showTableBuildModal}
<div class="modal-overlay" on:click={cancelTableBuildModal} on:keydown={(e) => e.key === 'Escape' && cancelTableBuildModal()} role="dialog" aria-modal="true" tabindex="-1">
	<div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="document">
		<h3 class="modal-title">Create Table Build</h3>
		<p class="modal-desc">Combining {selectedTableCards.length} table cards into a build (no hand card used)</p>
		<div class="build-value-selector">
			<label for="table-build-value">Build Value:</label>
			<select id="table-build-value" bind:value={tableBuildValue}>
				{#each possibleTableBuildValues as value}
					<option value={value}>{value}</option>
				{/each}
			</select>
		</div>
		<p class="modal-hint">You must have a card worth {tableBuildValue} in your hand to capture this build. This does NOT end your turn.</p>
		<div class="capturing-cards">
			<span class="capturing-label">Cards that can capture:</span>
			<div class="capturing-list">
				{#each myHand.filter(c => getCardValues(c).includes(tableBuildValue)) as capCard}
					<span class="capturing-card">{capCard.rank}{capCard.suit}</span>
				{/each}
			</div>
		</div>
		<div class="modal-buttons">
			<button class="btn-cancel" on:click={cancelTableBuildModal}>Cancel</button>
			<button class="btn-confirm" on:click={confirmTableBuild} disabled={isProcessing}>
				{#if isProcessing}<span class="spinner"></span>{:else}Create Table Build{/if}
			</button>
		</div>
	</div>
</div>
{/if}

</style>
"@
$content = $content -replace [regex]::Escape($modalMarker), $tableBuildModal

# 3. Add CSS for table build button
$styleEnd = '</style>'
$newStyles = @"
.table-build-action { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 0.5rem; }
.table-build-hint { color: #3b82f6; font-size: 0.875rem; text-align: center; }
.btn-table-build { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
.no-build-hint { color: #ef4444; font-size: 0.75rem; text-align: center; }
</style>
"@
$content = $content -replace [regex]::Escape($styleEnd), $newStyles

Set-Content "src\lib\components\GameBoard.svelte" -Value $content -NoNewline
Write-Host "Added Table Build UI elements"
