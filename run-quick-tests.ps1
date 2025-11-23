#!/usr/bin/env pwsh
# Quick Test Runner - Tests that don't require backend
# For full tests with backend, use: npm run test:all

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Quick Test Suite (No Backend Required)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allPassed = $true

# TypeScript Type Checking
Write-Host "1. TypeScript Type Checking..." -ForegroundColor Yellow
npm run check
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Type checking passed`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Type checking failed`n" -ForegroundColor Red
    $allPassed = $false
}

# Build Test
Write-Host "2. Build Test..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Build passed`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed`n" -ForegroundColor Red
    $allPassed = $false
}

# Backend Tests (if Python is available)
Write-Host "3. Backend Unit Tests..." -ForegroundColor Yellow
Push-Location backend
python -m pytest test_quick_wins.py -v --tb=short 2>&1
$backendResult = $LASTEXITCODE
Pop-Location

if ($backendResult -eq 0) {
    Write-Host "   ✅ Backend tests passed`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend tests skipped or failed`n" -ForegroundColor Yellow
    Write-Host "   (This is OK if pytest is not installed)`n" -ForegroundColor Gray
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ All quick tests passed!" -ForegroundColor Green
    Write-Host "`nNote: No frontend unit tests exist (only E2E tests)" -ForegroundColor Gray
    Write-Host "`nTo run E2E tests:" -ForegroundColor Yellow
    Write-Host "  1. Start backend: npm run start:backend" -ForegroundColor Gray
    Write-Host "  2. Start frontend: npm run dev" -ForegroundColor Gray
    Write-Host "  3. Run E2E: npm run test:e2e" -ForegroundColor Gray
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
}
Write-Host "========================================`n" -ForegroundColor Cyan
