$lines = Get-Content "src\lib\components\GameBoard.svelte"
$lines[291] = '		<button class="btn-exit" on:click={handleExitClick}>Exit Game</button>'
Set-Content "src\lib\components\GameBoard.svelte" -Value $lines
Write-Host "Fixed line 292"
(Get-Content "src\lib\components\GameBoard.svelte")[291]
