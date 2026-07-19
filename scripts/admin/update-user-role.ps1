# Quick script to update user role to RESTAURANT_ADMIN

$env:PGPASSWORD = 'postgres'

Write-Host "Updating user role to RESTAURANT_ADMIN..." -ForegroundColor Cyan

$result = psql -U postgres -d dinewithme -c "UPDATE users SET role = 'RESTAURANT_ADMIN' WHERE email = 'luupetros@gmail.com'; SELECT email, role FROM users WHERE email = 'luupetros@gmail.com';" 2>&1

Write-Host $result
Write-Host ""
Write-Host "✅ Done! Refresh your browser and visit http://localhost:3001/admin" -ForegroundColor Green
