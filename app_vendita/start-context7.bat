@echo off
echo Avvio Context 7 con MCP...
echo.

REM Verifica se Context 7 è installato
npx context7 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installa Context 7...
    npm install -g context7
)

REM Avvia Context 7 server MCP
start "Context 7 MCP Server" cmd /k "npx context7 serve --port 3001"

REM Attendi un momento per l'avvio
timeout /t 3 /nobreak > nul

echo Context 7 MCP avviato su http://localhost:3001
echo.
echo Per utilizzare Context 7 con MCP:
echo 1. Il server è ora disponibile per l'AI assistant
echo 2. Context 7 analizzerà automaticamente il codice
echo 3. Riceverai suggerimenti tramite MCP
echo.
pause 