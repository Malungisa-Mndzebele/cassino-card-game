$lines = Get-Content "src\lib\components\GameBoard.svelte"
# Line 301 (index 300) has the corrupted card-back-design
$lines[300] = '		{#each opponentHand as _, i}<div class="card-back"><div class="card-back-design"></div></div>{/each}'
Set-Content "src\lib\components\GameBoard.svelte" -Value $lines
Write-Host "Fixed line 301"
(Get-Content "src\lib\components\GameBoard.svelte")[300]
