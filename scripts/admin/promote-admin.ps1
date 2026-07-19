# Promote User to Platform Admin
# Run this after signing in to the app

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Promote User to Platform Admin" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from apps/web/.env
$envFile = "apps/web/.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^PLATFORM_ADMIN_EMAIL=(.+)$') {
            $env:PLATFORM_ADMIN_EMAIL = $matches[1]
        }
        if ($_ -match '^DATABASE_URL=(.+)$') {
            $env:DATABASE_URL = $matches[1]
        }
    }
}

if (-not $env:PLATFORM_ADMIN_EMAIL) {
    Write-Host "❌ PLATFORM_ADMIN_EMAIL not set in apps/web/.env" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add to apps/web/.env:" -ForegroundColor Yellow
    Write-Host "PLATFORM_ADMIN_EMAIL=your-email@example.com" -ForegroundColor White
    exit 1
}

Write-Host "📧 Admin email: $env:PLATFORM_ADMIN_EMAIL" -ForegroundColor Green
Write-Host ""

# Check if user exists in database
$env:PGPASSWORD = 'postgres'
$userExists = psql -U postgres -d dinewithme -t -c "SELECT COUNT(*) FROM users WHERE email = '$env:PLATFORM_ADMIN_EMAIL';" 2>&1

if ($userExists -match '1') {
    Write-Host "✅ User found in database" -ForegroundColor Green
    Write-Host ""
    Write-Host "Running seed script..." -ForegroundColor Yellow
    Write-Host ""
    
    npm run seed
    
    Write-Host ""
    Write-Host "Verifying role..." -ForegroundColor Yellow
    $role = psql -U postgres -d dinewithme -t -c "SELECT role FROM users WHERE email = '$env:PLATFORM_ADMIN_EMAIL';" 2>&1
    
    if ($role -match 'PLATFORM_ADMIN') {
        Write-Host ""
        Write-Host "✅ SUCCESS! User is now PLATFORM_ADMIN" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Role: $role" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  User not found in database" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps to complete:" -ForegroundColor Cyan
    Write-Host "1. Start dev server: npm run dev" -ForegroundColor White
    Write-Host "2. Sign in at http://localhost:3001 with: $env:PLATFORM_ADMIN_EMAIL" -ForegroundColor White
    Write-Host "3. Visit http://localhost:3001/dashboard" -ForegroundColor White
    Write-Host "4. Run this script again: .\promote-admin.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
