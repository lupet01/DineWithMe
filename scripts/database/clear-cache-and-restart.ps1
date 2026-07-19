# Clear Next.js Cache and Restart Dev Server

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Clear Cache and Restart" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Node processes
Write-Host "Step 1: Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ Node processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Next.js cache
Write-Host "Step 2: Clearing Next.js cache..." -ForegroundColor Yellow
$nextCache = "apps\web\.next"
if (Test-Path $nextCache) {
    Remove-Item -Path $nextCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Next.js cache cleared" -ForegroundColor Green
}
else {
    Write-Host "✓ No cache found" -ForegroundColor Green
}
Write-Host ""

# Step 3: Clear Turbo cache
Write-Host "Step 3: Clearing Turbo cache..." -ForegroundColor Yellow
$turboCache = ".turbo"
if (Test-Path $turboCache) {
    Remove-Item -Path $turboCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Turbo cache cleared" -ForegroundColor Green
}
else {
    Write-Host "✓ No Turbo cache found" -ForegroundColor Green
}
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Cache cleared successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Yellow
Write-Host ""
