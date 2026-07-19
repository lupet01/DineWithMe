# Setup Admin User Script
# This script helps set up a user with RESTAURANT_ADMIN role

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Admin User" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Set password
$env:PGPASSWORD = 'postgres'

Write-Host "Step 1: Checking current users..." -ForegroundColor Yellow
$users = psql -U postgres -d dinewithme -t -c "SELECT email, role FROM users;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $users
    Write-Host ""
    
    $userCount = psql -U postgres -d dinewithme -t -c "SELECT COUNT(*) FROM users;" 2>&1
    $count = $userCount.Trim()
    
    if ($count -eq "0") {
        Write-Host "⚠️  No users found in database!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please follow these steps:" -ForegroundColor Cyan
        Write-Host "1. Visit http://localhost:3001/dashboard" -ForegroundColor White
        Write-Host "2. Wait for the page to load (this syncs your user)" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        Write-Host ""
        exit 0
    }
    
    Write-Host "Step 2: Enter the email address to make admin:" -ForegroundColor Yellow
    $email = Read-Host "Email"
    
    if ([string]::IsNullOrWhiteSpace($email)) {
        Write-Host "❌ Email cannot be empty" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Step 3: Updating user role to RESTAURANT_ADMIN..." -ForegroundColor Yellow
    
    $result = psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = '$email'; SELECT email, role FROM users WHERE email = '$email';" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $result
        Write-Host ""
        Write-Host "✅ User role updated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Refresh your browser" -ForegroundColor White
        Write-Host "2. Visit http://localhost:3001/admin" -ForegroundColor White
        Write-Host "3. You should now have access to the admin portal" -ForegroundColor White
    } else {
        Write-Host "❌ Error updating user role" -ForegroundColor Red
        Write-Host $result
    }
} else {
    Write-Host "❌ Error connecting to database" -ForegroundColor Red
    Write-Host $users
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
