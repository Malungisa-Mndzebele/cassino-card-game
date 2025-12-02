# Production End-to-End Test Runner
# Tests the live deployed application at khasinogaming.com

Write-Host "🎮 Casino Card Game - Production E2E Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Playwright is installed
Write-Host "📦 Checking Playwright installation..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules/@playwright/test")) {
    Write-Host "❌ Playwright not found. Installing..." -ForegroundColor Red
    npm install
}

# Install Playwright browsers if needed
Write-Host "🌐 Ensuring Playwright browsers are installed..." -ForegroundColor Yellow
npx playwright install chromium

Write-Host ""
Write-Host "🚀 Running production tests against https://khasinogaming.com/cassino/" -ForegroundColor Green
Write-Host ""

# Run the tests
npx playwright test --config=playwright.production.config.ts

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All production tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 View detailed report:" -ForegroundColor Cyan
    Write-Host "   npx playwright show-report playwright-report/production" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed. Check the report for details." -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 View detailed report:" -ForegroundColor Cyan
    Write-Host "   npx playwright show-report playwright-report/production" -ForegroundColor White
    exit 1
}
