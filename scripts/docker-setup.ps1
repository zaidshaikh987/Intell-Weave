# Docker Setup Script for Intell Weave
# This script sets up and runs the entire application using Docker

Write-Host "Setting up Intell Weave with Docker..." -ForegroundColor Green

# Check if Docker is running
try {
    docker --version | Out-Null
    Write-Host "Docker is available" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env file" -ForegroundColor Green
    Write-Host "Please edit .env file with your API keys if needed!" -ForegroundColor Yellow
}

# Stop any existing containers
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down 2>$null

# Build and start all services
Write-Host "Building and starting all services..." -ForegroundColor Green
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml ps

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Create database schema
docker-compose -f docker-compose.dev.yml exec -T db psql -U postgres -d intell_weave -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>$null

# Apply database schema if SQL file exists
if (Test-Path "backend\app\models\sql_ddl.sql") {
    Write-Host "Applying database schema..." -ForegroundColor Yellow
    Get-Content "backend\app\models\sql_ddl.sql" | docker-compose -f docker-compose.dev.yml exec -T db psql -U postgres -d intell_weave
    Write-Host "Database schema applied" -ForegroundColor Green
}

Write-Host ""
Write-Host "Intell Weave is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "- API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host "- Database: localhost:5432 (postgres/postgres)" -ForegroundColor White
Write-Host "- Redis: localhost:6379" -ForegroundColor White
Write-Host "- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "- View logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "- Stop services: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "- Restart services: docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "If you encounter issues:" -ForegroundColor Blue
Write-Host "1. Check Docker Desktop is running" -ForegroundColor White
Write-Host "2. Run: docker-compose -f docker-compose.dev.yml logs" -ForegroundColor White
Write-Host "3. Restart: docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White
