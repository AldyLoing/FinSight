# FinSight Setup Script for Windows PowerShell
# Run this after cloning the repository

Write-Host "🚀 FinSight Setup Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    
    if (-not ($nodeVersion -match "v18|v20|v21")) {
        Write-Host "⚠️  Warning: Node.js 18+ recommended. Current: $nodeVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "⚠️  Please edit .env.local with your actual credentials!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
    Write-Host ""
}

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local with your Supabase and OpenRouter credentials" -ForegroundColor White
Write-Host "2. Run SQL scripts in Supabase (see QUICKSTART.md)" -ForegroundColor White
Write-Host "3. Start dev server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- Quick Start: QUICKSTART.md" -ForegroundColor White
Write-Host "- Full Guide: README.md" -ForegroundColor White
Write-Host "- API Docs: API_DOCS.md" -ForegroundColor White
Write-Host "- Deployment: DEPLOYMENT.md" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Green

# Pause to let user read the output
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
