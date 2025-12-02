#!/usr/bin/env pwsh
# Test runner for bug fix verification

Write-Host "🧪 Running Bug Fix Tests" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "📡 Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running!" -ForegroundColor Red
    Write-Host "   Please start the backend with: npm run start:backend" -ForegroundColor Yellow
    exit 1
}

# Check if frontend dev server is running
Write-Host "🌐 Checking frontend dev server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend dev server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend dev server is not running!" -ForegroundColor Red
    Write-Host "   Please start the frontend with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🧪 Running Unit Tests" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Run unit tests for gameStore
Write-Host "Testing gameStore (session persistence)..." -ForegroundColor Yellow
npm run test -- src/lib/stores/gameStore.test.ts --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ gameStore tests failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ gameStore tests passed" -ForegroundColor Green
Write-Host ""

# Run unit tests for API utils
Write-Host "Testing API utils (data transformation)..." -ForegroundColor Yellow
npm run test -- src/lib/utils/api.test.ts --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API utils tests failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API utils tests passed" -ForegroundColor Green
Write-Host ""

Write-Host "🎭 Running E2E Tests" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Run E2E tests for bug fixes
Write-Host "Testing bug fixes (player sync, session persistence)..." -ForegroundColor Yellow
npx playwright test tests/e2e/bug-fixes.spec.ts --reporter=list
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ E2E tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "To view the test report, run:" -ForegroundColor Yellow
    Write-Host "  npx playwright show-report" -ForegroundColor Cyan
    exit 1
}
Write-Host "✅ E2E tests passed" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 All Bug Fix Tests Passed!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✅ BUG #1: Player join synchronization - FIXED" -ForegroundColor Green
Write-Host "  ✅ BUG #2: Session persistence - FIXED" -ForegroundColor Green
Write-Host "  ✅ BUG #3: Data format transformation - FIXED" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review test results" -ForegroundColor White
Write-Host "  2. Perform manual testing using TESTING_GUIDE_BUG_FIXES.md" -ForegroundColor White
Write-Host "  3. Commit changes to git" -ForegroundColor White
Write-Host "  4. Deploy to staging/production" -ForegroundColor White
Write-Host ""
