# Docker Stop Script for Intell Weave
# This script stops all Docker services

Write-Host "🛑 Stopping Intell Weave Docker services..." -ForegroundColor Yellow

# Stop all services
docker-compose -f docker-compose.dev.yml down

Write-Host "✅ All services stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To remove all data (reset everything):" -ForegroundColor Blue
Write-Host "docker-compose -f docker-compose.dev.yml down -v" -ForegroundColor White
Write-Host ""
Write-Host "🔄 To start again:" -ForegroundColor Blue
Write-Host ".\scripts\docker-setup.ps1" -ForegroundColor White
