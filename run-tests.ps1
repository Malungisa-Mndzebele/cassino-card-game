# PowerShell script to run tests one by one
Write-Host "Running E2E tests one by one..." -ForegroundColor Green

$tests = @(
    "tests/e2e/simple-smoke-test.spec.ts",
    "tests/e2e/create-join.spec.ts",
    "tests/e2e/random-join.spec.ts",
    "tests/e2e/full-game-flow.spec.ts",
    "tests/e2e/comprehensive-game.spec.ts"
)

foreach ($test in $tests) {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "Running: $test" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Yellow
    
    npx playwright test $test --project=chromium --timeout=60000 --max-failures=1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Test failed: $test" -ForegroundColor Red
        Write-Host "Press Enter to continue to next test or Ctrl+C to stop..."
        Read-Host
    } else {
        Write-Host "`n✅ Test passed: $test" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow

