# Run only local tests (exclude production/deployment tests)
Write-Host "🧪 Running Local Tests Only" -ForegroundColor Cyan
Write-Host ("=" * 60)

$totalPassed = 0
$totalFailed = 0

# Function to run a test
function Run-Test {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDir = $PWD
    )
    
    Write-Host "`n📋 $Name" -ForegroundColor Yellow
    Write-Host ("-" * 60)
    
    try {
        Push-Location $WorkingDir
        Invoke-Expression $Command | Out-Host
        if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
            Write-Host "✅ $Name - PASSED" -ForegroundColor Green
            $script:totalPassed++
            return $true
        } else {
            Write-Host "❌ $Name - FAILED (Exit code: $LASTEXITCODE)" -ForegroundColor Red
            $script:totalFailed++
            return $false
        }
    } catch {
        Write-Host "❌ $Name - FAILED: $_" -ForegroundColor Red
        $script:totalFailed++
        return $false
    } finally {
        Pop-Location
    }
}

# 1. Backend Game Logic Tests
Write-Host "`n🔧 Backend Tests" -ForegroundColor Cyan
Run-Test "Game Logic Tests" "python test_game_logic_simple.py" "$PSScriptRoot\backend"
Run-Test "API Comprehensive Tests" "python test_api_comprehensive.py" "$PSScriptRoot\backend"
Run-Test "API Simple Tests" "python test_main_simple.py" "$PSScriptRoot\backend"

# 2. Frontend Tests
Write-Host "`n`n⚛️  Frontend Tests" -ForegroundColor Cyan
Run-Test "Frontend Component Tests" "npm run test:frontend" "$PSScriptRoot"

# 3. Local E2E Tests (exclude production tests)
Write-Host "`n`n🎭 Local E2E Tests" -ForegroundColor Cyan
Write-Host "Note: E2E tests require backend to be running" -ForegroundColor Yellow
Write-Host "Start backend with: npm run start:backend`n" -ForegroundColor Yellow

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running - running E2E tests...`n" -ForegroundColor Green
        
        $localE2ETests = @(
            "tests/e2e/create-join.spec.ts",
            "tests/e2e/full-game-flow.spec.ts",
            "tests/e2e/complete-game-scenarios.spec.ts",
            "tests/e2e/random-join.spec.ts",
            "tests/e2e/websocket-test.spec.ts",
            "tests/e2e/fixed-smoke-test.spec.ts",
            "tests/performance/load-test.spec.ts"
        )
        
        foreach ($testFile in $localE2ETests) {
            $testName = Split-Path $testFile -Leaf
            Run-Test "E2E: $testName" "npx playwright test $testFile" "$PSScriptRoot"
        }
    }
} catch {
    Write-Host "⚠️  Backend not running - skipping E2E tests" -ForegroundColor Yellow
    Write-Host "   Start backend with: npm run start:backend" -ForegroundColor Yellow
    Write-Host "   Then run: npx playwright test tests/e2e/create-join.spec.ts tests/e2e/full-game-flow.spec.ts" -ForegroundColor Yellow
}

# Summary
Write-Host "`n`n" + ("=" * 60)
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "✅ Passed: $totalPassed" -ForegroundColor Green
Write-Host "❌ Failed: $totalFailed" -ForegroundColor Red
Write-Host "📈 Total:  $($totalPassed + $totalFailed)"
Write-Host "=" * 60

if ($totalFailed -gt 0) {
    exit 1
} else {
    exit 0
}

