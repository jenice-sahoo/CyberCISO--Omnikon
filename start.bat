@echo off
echo Starting CyberCISO...

REM Start backend
start "CyberCISO Backend" cmd /c "cd /d backend && python -m venv venv 2>nul && call venv\Scripts\activate.bat && pip install -r requirements.txt -q && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Start frontend
start "CyberCISO Frontend" cmd /c "cd /d frontend && npm install --silent && npm run dev"

echo.
echo CyberCISO is starting...
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Close this window or press Ctrl+C to stop.
pause >nul
