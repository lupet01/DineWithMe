# Quick Role Update Script
# Run this after syncing your user

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Update User Role" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Set password
$env:PGPASSWORD = 'postgres'

Write-Host "Your email: lu.petros@outlook.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose role:" -ForegroundColor Yellow
Write-Host "1. RESTAURANT_ADMIN (manage your restaurant and dinners)" -ForegroundColor White
Write-Host "2. PLATFORM_ADMIN (full platform access including ops)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter 1 or 2"

$role = ""
if ($choice -eq "1") {
    $role = "RESTAURANT_ADMIN"
} elseif ($choice -eq "2") {
    $role = "PLATFORM_ADMIN"
} else {
    Write-Host "❌ Invalid choice" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Updating role to $role..." -ForegroundColor Yellow

$result = psql -U postgres -d dinewithme -c "UPDATE users SET role = '$role' WHERE email = 'lu.petros@outlook.com'; SELECT email, role FROM users WHERE email = 'lu.petros@outlook.com';" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $result
    Write-Host ""
    Write-Host "✅ Role updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Sign out completely from the app" -ForegroundColor White
    Write-Host "2. Sign back in" -ForegroundColor White
    Write-Host "3. Visit http://localhost:3001/admin" -ForegroundColor White
    Write-Host ""
    if ($role -eq "PLATFORM_ADMIN") {
        Write-Host "As PLATFORM_ADMIN you can also access:" -ForegroundColor Cyan
        Write-Host "- http://localhost:3001/admin/ops" -ForegroundColor White
    }
} else {
    Write-Host "❌ Error updating role" -ForegroundColor Red
    Write-Host $result
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
