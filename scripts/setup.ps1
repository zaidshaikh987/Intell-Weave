# Intell Weave Setup Script for Windows
# Run this script to set up the development environment

Write-Host "🚀 Setting up Intell Weave Development Environment..." -ForegroundColor Green

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version 2>&1
    Write-Host "✅ PostgreSQL found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL not found. Please install PostgreSQL 14+" -ForegroundColor Yellow
}

# Setup environment file
Write-Host "📝 Setting up environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your configuration!" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Setup backend
Write-Host "🐍 Setting up Python backend..." -ForegroundColor Yellow
Set-Location "backend"

# Create virtual environment
if (!(Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "✅ Created Python virtual environment" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment and install dependencies
& ".venv\Scripts\Activate.ps1"
pip install -r requirements.txt
Write-Host "✅ Installed Python dependencies" -ForegroundColor Green

# Download spaCy models
Write-Host "📚 Downloading NLP models..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm
Write-Host "✅ Downloaded English NLP model" -ForegroundColor Green

# Optional: Download additional language models
$downloadMore = Read-Host "Download additional language models? (y/N)"
if ($downloadMore -eq "y" -or $downloadMore -eq "Y") {
    python -m spacy download es_core_news_sm
    python -m spacy download fr_core_news_sm
    python -m spacy download de_core_news_sm
    Write-Host "✅ Downloaded additional language models" -ForegroundColor Green
}

Set-Location ".."

# Setup frontend
Write-Host "⚛️  Setting up React frontend..." -ForegroundColor Yellow
npm install
Write-Host "✅ Installed Node.js dependencies" -ForegroundColor Green

# Database setup
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
$setupDb = Read-Host "Set up database now? (requires PostgreSQL running) (y/N)"
if ($setupDb -eq "y" -or $setupDb -eq "Y") {
    $dbName = "intell_weave"
    
    # Create database
    createdb $dbName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Created database: $dbName" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database might already exist" -ForegroundColor Yellow
    }
    
    # Install pgvector extension
    psql -d $dbName -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>$null
    Write-Host "✅ Installed pgvector extension" -ForegroundColor Green
    
    # Apply schema
    psql -d $dbName -f "backend\app\models\sql_ddl.sql"
    Write-Host "✅ Applied database schema" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your configuration"
Write-Host "2. Start Redis server"
Write-Host "3. Run backend: cd backend && .venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --port 8000 --app-dir app"
Write-Host "4. Run frontend: npm run dev"
Write-Host ""
Write-Host "🌐 Access points:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend API: http://localhost:8000"
Write-Host "- API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "📖 For production deployment, see DEPLOYMENT.md" -ForegroundColor Blue
