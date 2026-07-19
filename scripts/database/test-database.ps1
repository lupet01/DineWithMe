# Test Database Script for DineWithMe
# Run this after visiting /dashboard while signed in

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "DineWithMe Database Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Set password
$env:PGPASSWORD = 'postgres'

Write-Host "Checking users table..." -ForegroundColor Yellow
Write-Host ""

# Query database
$result = psql -U postgres -d dinewithme -c "SELECT * FROM users;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $result
    Write-Host ""
    
    # Count users
    $count = psql -U postgres -d dinewithme -t -c "SELECT COUNT(*) FROM users;" 2>&1
    
    if ($count -match '\d+') {
        $userCount = $count.Trim()
        Write-Host "Total users in database: $userCount" -ForegroundColor Green
        
        if ($userCount -eq "0") {
            Write-Host ""
            Write-Host "⚠️  No users found!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "To sync your user:" -ForegroundColor Cyan
            Write-Host "1. Make sure dev server is running (npm run dev)" -ForegroundColor White
            Write-Host "2. Sign in at http://localhost:3001" -ForegroundColor White
            Write-Host "3. Visit http://localhost:3001/dashboard" -ForegroundColor White
            Write-Host "4. Run this script again" -ForegroundColor White
        } else {
            Write-Host ""
            Write-Host "✅ User sync successful!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ Error connecting to database" -ForegroundColor Red
    Write-Host $result
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
