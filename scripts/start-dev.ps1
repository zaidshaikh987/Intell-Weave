# Development startup script for Intell Weave
# This script starts both backend and frontend in development mode

Write-Host "🚀 Starting Intell Weave Development Environment..." -ForegroundColor Green

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Function to start backend
function Start-Backend {
    Write-Host "🐍 Starting backend server..." -ForegroundColor Yellow
    Set-Location "backend"
    & ".venv\Scripts\Activate.ps1"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "uvicorn app.main:app --reload --port 8000 --app-dir app"
    Set-Location ".."
    Write-Host "✅ Backend server starting on http://localhost:8000" -ForegroundColor Green
}

# Function to start frontend
function Start-Frontend {
    Write-Host "⚛️  Starting frontend server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Write-Host "✅ Frontend server starting on http://localhost:5173" -ForegroundColor Green
}

# Start services
Start-Backend
Start-Sleep -Seconds 3
Start-Frontend

Write-Host ""
Write-Host "🎉 Development environment started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access points:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend API: http://localhost:8000"
Write-Host "- API Documentation: http://localhost:8000/docs"
Write-Host "- Health Check: http://localhost:8000/healthz"
Write-Host "- Metrics: http://localhost:8000/metrics"
Write-Host ""
Write-Host "📝 Note: Make sure PostgreSQL and Redis are running!" -ForegroundColor Yellow
Write-Host "💡 Press Ctrl+C in each terminal window to stop the servers" -ForegroundColor Blue
