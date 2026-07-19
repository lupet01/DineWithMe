# Regenerate Prisma Client
Write-Host "Regenerating Prisma client..." -ForegroundColor Yellow

# Set DATABASE_URL
$env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/dinewithme?schema=public'

# Generate from project root
npx prisma generate --schema=prisma/schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma client regenerated successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to regenerate Prisma client" -ForegroundColor Red
}
