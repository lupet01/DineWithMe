# Script to run restaurant migration and regenerate Prisma client
Write-Host "Running restaurant migration..." -ForegroundColor Cyan

# Navigate to prisma directory
Set-Location prisma

# Run migration
Write-Host "`nApplying migration..." -ForegroundColor Yellow
npx prisma migrate deploy

# Generate Prisma client
Write-Host "`nGenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Return to root
Set-Location ..

Write-Host "`nMigration complete!" -ForegroundColor Green
Write-Host "Restaurant and RestaurantMember models are now available." -ForegroundColor Green
