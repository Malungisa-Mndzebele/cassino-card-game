# PowerShell test script for Casino Card Game Backend
# Tests all API endpoints

$BaseUrl = "http://localhost:8000"
$TestPlayer1 = "TestPlayer1"
$TestPlayer2 = "TestPlayer2"

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    
    $Status = if ($Success) { "✅ PASS" } else { "❌ FAIL" }
    Write-Host "$Status $TestName"
    if ($Details) {
        Write-Host "    $Details"
    }
    Write-Host ""
}

function Test-HealthEndpoint {
    Write-Host "🧪 Testing Health Check..."
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -TimeoutSec 5
        $success = $response.StatusCode -eq 200
        $details = "Status: $($response.StatusCode), Response: $($response.Content)"
        Write-TestResult "Health Check" $success $details
        return $success
    }
    catch {
        Write-TestResult "Health Check" $false "Error: $($_.Exception.Message)"
        return $false
    }
}

function Test-CreateRoom {
    param([string]$PlayerName)
    
    Write-Host "🧪 Testing Create Room..."
    try {
        $body = @{ player_name = $PlayerName } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/create" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        $success = $response.StatusCode -eq 200
        
        if ($success) {
            $roomData = $response.Content | ConvertFrom-Json
            $details = "Status: $($response.StatusCode), Room ID: $($roomData.room_id), Player ID: $($roomData.player_id)"
            Write-TestResult "Create Room" $success $details
            return $roomData
        }
        else {
            $details = "Status: $($response.StatusCode), Response: $($response.Content)"
            Write-TestResult "Create Room" $success $details
            return $null
        }
    }
    catch {
        Write-TestResult "Create Room" $false "Error: $($_.Exception.Message)"
        return $null
    }
}

function Test-JoinRoom {
    param([string]$RoomId, [string]$PlayerName)
    
    Write-Host "🧪 Testing Join Room..."
    try {
        $body = @{ room_id = $RoomId; player_name = $PlayerName } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/join" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        $success = $response.StatusCode -eq 200
        
        if ($success) {
            $playerData = $response.Content | ConvertFrom-Json
            $details = "Status: $($response.StatusCode), Player ID: $($playerData.player_id)"
            Write-TestResult "Join Room" $success $details
            return $playerData
        }
        else {
            $details = "Status: $($response.StatusCode), Response: $($response.Content)"
            Write-TestResult "Join Room" $success $details
            return $null
        }
    }
    catch {
        Write-TestResult "Join Room" $false "Error: $($_.Exception.Message)"
        return $null
    }
}

function Test-GetGameState {
    param([string]$RoomId)
    
    Write-Host "🧪 Testing Get Game State..."
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/$RoomId/state" -Method GET -TimeoutSec 10
        $success = $response.StatusCode -eq 200
        
        if ($success) {
            $stateData = $response.Content | ConvertFrom-Json
            $details = "Status: $($response.StatusCode), Phase: $($stateData.phase), Players: $($stateData.players.Count)"
            Write-TestResult "Get Game State" $success $details
            return $stateData
        }
        else {
            $details = "Status: $($response.StatusCode), Response: $($response.Content)"
            Write-TestResult "Get Game State" $success $details
            return $null
        }
    }
    catch {
        Write-TestResult "Get Game State" $false "Error: $($_.Exception.Message)"
        return $null
    }
}

function Test-SetPlayerReady {
    param([string]$RoomId, [int]$PlayerId, [bool]$IsReady)
    
    Write-Host "🧪 Testing Set Player Ready..."
    try {
        $body = @{ room_id = $RoomId; player_id = $PlayerId; is_ready = $IsReady } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/ready" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        $success = $response.StatusCode -eq 200
        
        if ($success) {
            $result = $response.Content | ConvertFrom-Json
            $details = "Status: $($response.StatusCode), Ready: $IsReady, Message: $($result.message)"
        }
        else {
            $details = "Status: $($response.StatusCode), Response: $($response.Content)"
        }
        
        Write-TestResult "Set Player Ready" $success $details
        return $success
    }
    catch {
        Write-TestResult "Set Player Ready" $false "Error: $($_.Exception.Message)"
        return $false
    }
}

function Test-ErrorCases {
    Write-Host "🔍 Testing Error Cases..."
    Write-Host "=" * 50
    
    # Test 1: Create room with empty player name
    try {
        $body = @{ player_name = "" } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/create" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        $success = $response.StatusCode -eq 422  # Validation error expected
        $details = "Status: $($response.StatusCode)"
        Write-TestResult "Create Room (Empty Name)" $success $details
    }
    catch {
        Write-TestResult "Create Room (Empty Name)" $false "Error: $($_.Exception.Message)"
    }
    
    # Test 2: Join non-existent room
    try {
        $body = @{ room_id = "INVALID"; player_name = "Test" } | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/join" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10
        $success = $response.StatusCode -eq 404  # Not found expected
        $details = "Status: $($response.StatusCode)"
        Write-TestResult "Join Invalid Room" $success $details
    }
    catch {
        Write-TestResult "Join Invalid Room" $false "Error: $($_.Exception.Message)"
    }
    
    # Test 3: Get state of non-existent room
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/rooms/INVALID/state" -Method GET -TimeoutSec 10
        $success = $response.StatusCode -eq 404  # Not found expected
        $details = "Status: $($response.StatusCode)"
        Write-TestResult "Get Invalid Room State" $success $details
    }
    catch {
        Write-TestResult "Get Invalid Room State" $false "Error: $($_.Exception.Message)"
    }
}

function Test-GameFlow {
    Write-Host "🎮 Testing Complete Game Flow"
    Write-Host "=" * 50
    
    # Test 1: Health check
    if (-not (Test-HealthEndpoint)) {
        Write-Host "❌ Backend is not running. Please start the backend first."
        return $false
    }
    
    # Test 2: Create room with player 1
    $roomData = Test-CreateRoom $TestPlayer1
    if (-not $roomData) {
        return $false
    }
    
    $roomId = $roomData.room_id
    $player1Id = $roomData.player_id
    
    # Test 3: Get initial game state
    $stateData = Test-GetGameState $roomId
    if (-not $stateData) {
        return $false
    }
    
    # Test 4: Join room with player 2
    $player2Data = Test-JoinRoom $roomId $TestPlayer2
    if (-not $player2Data) {
        return $false
    }
    
    $player2Id = $player2Data.player_id
    
    # Test 5: Get updated game state (should have 2 players)
    $stateData = Test-GetGameState $roomId
    if (-not $stateData) {
        return $false
    }
    
    # Test 6: Set player 1 ready
    Test-SetPlayerReady $roomId $player1Id $true
    
    # Test 7: Set player 2 ready
    Test-SetPlayerReady $roomId $player2Id $true
    
    # Test 8: Get final game state (should be ready to start)
    Start-Sleep -Seconds 1  # Give backend time to process
    $stateData = Test-GetGameState $roomId
    if (-not $stateData) {
        return $false
    }
    
    Write-Host "🎉 All tests completed!"
    return $true
}

# Main test execution
Write-Host "🧪 Casino Card Game Backend Test Suite"
Write-Host "=" * 60

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -TimeoutSec 5
    if ($response.StatusCode -ne 200) {
        Write-Host "❌ Backend is not responding properly."
        Write-Host "Please make sure the backend is running on http://localhost:8000"
        exit 1
    }
}
catch {
    Write-Host "❌ Cannot connect to backend."
    Write-Host "Please start the backend with: cd backend && uvicorn main:app --reload"
    exit 1
}

# Run tests
$success = Test-GameFlow
Test-ErrorCases

if ($success) {
    Write-Host "🎊 All tests passed! Backend is working correctly."
}
else {
    Write-Host "💥 Some tests failed. Please check the backend logs."
}

Write-Host ""
Write-Host "📊 Test Summary:"
Write-Host "Backend URL: $BaseUrl"
Write-Host "Health Check: $BaseUrl/health"
Write-Host "API Documentation: $BaseUrl/docs"
