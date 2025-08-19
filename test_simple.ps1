# Simple test script for backend
Write-Host "🧪 Testing Backend API..."

# Test 1: Health check
Write-Host "Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Health check passed: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)"
}

# Test 2: Create room
Write-Host "`nTesting create room..."
try {
    $body = @{ player_name = "TestPlayer" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:8000/rooms/create" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Create room passed: $($response.StatusCode)"
    $roomData = $response.Content | ConvertFrom-Json
    Write-Host "Room ID: $($roomData.room_id)"
    Write-Host "Player ID: $($roomData.player_id)"
    
    # Test 3: Get game state
    Write-Host "`nTesting get game state..."
    $stateResponse = Invoke-WebRequest -Uri "http://localhost:8000/rooms/$($roomData.room_id)/state" -Method GET -TimeoutSec 10
    Write-Host "✅ Get game state passed: $($stateResponse.StatusCode)"
    $stateData = $stateResponse.Content | ConvertFrom-Json
    Write-Host "Phase: $($stateData.phase)"
    Write-Host "Players: $($stateData.players.Count)"
    
} catch {
    Write-Host "❌ Create room failed: $($_.Exception.Message)"
}

Write-Host "`n🎉 Test completed!"
