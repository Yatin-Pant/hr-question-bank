@echo off
echo ============================================
echo   HR Question Bank - Starting Project
echo ============================================
echo.

echo [1/2] Starting Backend (Node.js API)...
cd backend
start cmd /k "echo Backend is starting... && npm install && node server.js"
cd ..

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (React App)...
cd frontend
start cmd /k "echo Frontend is starting... && npm install && npm start"
cd ..

echo.
echo ============================================
echo  Both servers are starting in new windows!
echo  Backend  -> http://localhost:3001
echo  Frontend -> http://localhost:3000
echo ============================================
pause
