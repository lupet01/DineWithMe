# Quick script to manually expire seat holds
# Run this anytime: .\expire-holds-now.ps1

$token = "dev-secret-token-change-in-production"
$url = "http://localhost:3001/api/cron/expire-holds?token=$token"

Write-Host "Expiring seat holds..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "   Expired seats: $($result.data.expiredCount)" -ForegroundColor Cyan
    Write-Host "   Duration: $($result.data.duration)" -ForegroundColor Cyan
    Write-Host "   Timestamp: $($result.data.timestamp)" -ForegroundColor Cyan
    
    if ($result.data.expiredSeats.Count -gt 0) {
        Write-Host ""
        Write-Host "Expired seats:" -ForegroundColor Yellow
        foreach ($seat in $result.data.expiredSeats) {
            Write-Host "   - Seat: $($seat.seatId.Substring(0,8))... Dinner: $($seat.dinnerId.Substring(0,8))..." -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. Dev server is running (npm run dev)" -ForegroundColor Gray
    Write-Host "  2. Database is accessible" -ForegroundColor Gray
}

Write-Host ""
