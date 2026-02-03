#!/usr/bin/env pwsh
# Comprehensive Test Runner for Casino Card Game
# Runs backend tests, local E2E tests, and production E2E tests

Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Casino Card Game - Comprehensive Test Suite" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

$results = @()

# ============================================================================
# 1. Backend Tests
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Yellow
Write-Host "BACKEND TESTS" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Yellow

Push-Location backend

Write-Host "`nRunning backend unit tests..." -ForegroundColor Cyan
$backendResult = python -m pytest test_quick_wins.py test_session_manager_full.py test_cache_manager_full.py -v --tb=short
$backendSuccess = $LASTEXITCODE -eq 0

if ($backendSuccess) {
    Write-Host "✅ Backend tests PASSED" -ForegroundColor Green
    $results += @{ Name = "Backend Tests"; Status = "PASS"; Environment = "Local" }
} else {
    Write-Host "❌ Backend tests FAILED" -ForegroundColor Red
    $results += @{ Name = "Backend Tests"; Status = "FAIL"; Environment = "Local" }
}

Pop-Location

# ============================================================================
# 2. Check Backend is Running
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Yellow
Write-Host "BACKEND HEALTH CHECK" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "✅ Backend is running: $($health.status)" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor Gray
    Write-Host "   Redis: $($health.redis)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend is not running!" -ForegroundColor Red
    Write-Host "   Please start backend: npm run start:backend" -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# 3. Local E2E Tests
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Yellow
Write-Host "LOCAL E2E TESTS (http://localhost:5173)" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Yellow

Write-Host "`nRunning live tests..." -ForegroundColor Cyan
$localResult = npx playwright test tests/e2e/live.spec.ts --reporter=list --timeout=60000
$localSuccess = $LASTEXITCODE -eq 0

if ($localSuccess) {
    Write-Host "✅ Local E2E tests PASSED" -ForegroundColor Green
    $results += @{ Name = "Local E2E Tests"; Status = "PASS"; Environment = "Local" }
} else {
    Write-Host "❌ Local E2E tests FAILED" -ForegroundColor Red
    $results += @{ Name = "Local E2E Tests"; Status = "FAIL"; Environment = "Local" }
}

# ============================================================================
# 4. Production E2E Tests
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Yellow
Write-Host "PRODUCTION E2E TESTS (https://khasinogaming.com)" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Yellow

Write-Host "`nRunning production smoke test..." -ForegroundColor Cyan
$prodResult = npx playwright test tests/e2e/production-smoke-test.spec.ts --config=playwright.production.config.ts --reporter=list --timeout=60000
$prodSuccess = $LASTEXITCODE -eq 0

if ($prodSuccess) {
    Write-Host "✅ Production E2E tests PASSED" -ForegroundColor Green
    $results += @{ Name = "Production E2E Tests"; Status = "PASS"; Environment = "Production" }
} else {
    Write-Host "❌ Production E2E tests FAILED" -ForegroundColor Red
    $results += @{ Name = "Production E2E Tests"; Status = "FAIL"; Environment = "Production" }
}

# ============================================================================
# Test Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "`nResults:" -ForegroundColor White
foreach ($result in $results) {
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    $icon = if ($result.Status -eq "PASS") { "✅" } else { "❌" }
    Write-Host "  $icon $($result.Name) [$($result.Environment)]" -ForegroundColor $color
}

Write-Host "`n" -NoNewline
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Total: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=" * 70 -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
}
