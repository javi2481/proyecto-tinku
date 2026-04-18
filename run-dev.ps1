# Run Tinku in development mode
$ErrorActionPreference = "Continue"

Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
$proc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd C:\Users\Equipo\proyecto-tinku\frontend; npm run dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

if (!$proc.HasExited) {
    Write-Host "Server started! Access at: http://localhost:3000" -ForegroundColor Green
    Write-Host "Review exercises: http://localhost:3000/review-exercises" -ForegroundColor Yellow
} else {
    Write-Host "Failed to start server" -ForegroundColor Red
}