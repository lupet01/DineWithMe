# Fix Prisma Generate Permission Error
# This script stops any running processes and regenerates Prisma client

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Fix Prisma Generate" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any Node processes that might be locking files
Write-Host "Step 1: Stopping Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ Node processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Remove the .prisma directory
Write-Host "Step 2: Removing old Prisma client..." -ForegroundColor Yellow
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Old Prisma client removed" -ForegroundColor Green
} else {
    Write-Host "✓ No old Prisma client found" -ForegroundColor Green
}
Write-Host ""

# Step 3: Generate Prisma client
Write-Host "Step 3: Generating Prisma client..." -ForegroundColor Yellow
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/dinewithme?schema=public'

# Change to apps/web directory and generate
Push-Location apps/web
npx prisma generate --schema=../../prisma/schema.prisma
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Prisma client generated successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Prisma generation failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative solution:" -ForegroundColor Yellow
    Write-Host "1. Close VS Code" -ForegroundColor White
    Write-Host "2. Stop OneDrive sync temporarily" -ForegroundColor White
    Write-Host "3. Run: npx prisma generate --schema=prisma/schema.prisma" -ForegroundColor White
    Write-Host "4. Restart OneDrive sync" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
