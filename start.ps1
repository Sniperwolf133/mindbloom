# MindMate Startup Script
# Run this from the project root: .\start.ps1

Write-Host ""
Write-Host "🌸  MindMate — Student Wellness App" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Check .env
$envPath = Join-Path $PSScriptRoot "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ Missing backend\.env file!" -ForegroundColor Red
    Write-Host "   Copy backend\.env.example to backend\.env and add your GROQ_API_KEY" -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content $envPath -Raw
if ($envContent -match "your_groq_api_key_here") {
    Write-Host "⚠️  WARNING: GROQ_API_KEY not set in backend\.env" -ForegroundColor Yellow
    Write-Host "   The AI chatbot won't work without it." -ForegroundColor Yellow
    Write-Host "   Get a free key at: https://console.groq.com" -ForegroundColor Cyan
    Write-Host ""
}

# Start backend
Write-Host "🚀 Starting backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', @"
    Set-Location '$PSScriptRoot\backend'
    Write-Host '🐍 Activating Python venv...' -ForegroundColor Cyan
    .\.venv\Scripts\Activate.ps1
    Write-Host '✅ Backend starting on http://localhost:8000' -ForegroundColor Green
    Write-Host '📖 API docs at http://localhost:8000/docs' -ForegroundColor Cyan
    uvicorn main:app --reload --port 8000
"@

Start-Sleep 3

# Start frontend
Write-Host "🎨 Starting frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', @"
    Set-Location '$PSScriptRoot\frontend'
    Write-Host '⚡ Starting Vite dev server...' -ForegroundColor Cyan
    npm run dev
"@

Start-Sleep 4

Write-Host ""
Write-Host "✅ Both servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "   🌐 App:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "   📡 API:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "   📖 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to open the app in your browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"

