$content = Get-Content "src\lib\utils\api.ts" -Raw

$newFunction = @'

export async function tableBuild(
    roomId: string,
    playerId: string,
    targetCards: string[],
    buildValue: number
) {
    const response = await fetchAPI<any>('/game/table-build', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: parseInt(playerId, 10),
            target_cards: targetCards,
            build_value: buildValue
        })
    });

    return {
        success: response.success,
        message: response.message,
        game_state: transformGameState(response.game_state)
    };
}
'@

# Insert after playCard function (before resetGame)
$insertMarker = "export async function resetGame"
$content = $content -replace $insertMarker, "$newFunction`n`n$insertMarker"

Set-Content "src\lib\utils\api.ts" -Value $content -NoNewline
Write-Host "Added tableBuild function to api.ts"
