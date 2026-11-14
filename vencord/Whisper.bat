@echo off
rem Whisper (Vencord): instala, repara o actualiza sin preguntas. Install, repair or update with no questions.
setlocal
cd /d "%~dp0" || goto :fail
if not exist "install.ps1" goto :unzip
if not exist "update.ps1" goto :unzip
echo WHISPER (Vencord)
echo   1) Instalar o reparar / Install or repair
echo   2) Actualizar a la ultima version / Update to the latest
echo (Cierra Discord solo y lo reabre / Closes Discord by itself and reopens it)
choice /c 12 /n /m "> "
set "UPD=0"
if errorlevel 2 set "UPD=1"
call :closediscord
if "%UPD%"=="1" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update.ps1" -Inject
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" -Yes
)
if errorlevel 1 goto :fail
call :reopen
echo.
echo Listo. Activa Whisper en Ajustes - Vencord - Plugins. / Done. Enable Whisper in Settings - Vencord - Plugins.
pause
exit /b 0
:closediscord
set "RUN="
for %%D in (Discord DiscordPTB DiscordCanary) do (
  tasklist /fi "imagename eq %%D.exe" 2>nul | find /i "%%D.exe" >nul && (set "RUN=%%D" & taskkill /f /im %%D.exe >nul 2>&1)
)
exit /b 0
:reopen
if not defined RUN if exist "%LOCALAPPDATA%\Discord\Update.exe" set "RUN=Discord"
if defined RUN if exist "%LOCALAPPDATA%\%RUN%\Update.exe" start "" "%LOCALAPPDATA%\%RUN%\Update.exe" --processStart %RUN%.exe
exit /b 0
:unzip
echo Faltan archivos. Extrae TODO el zip a una carpeta y ejecuta Whisper.bat desde ahi.
echo Files are missing. Extract the WHOLE zip to a folder and run Whisper.bat from there.
:fail
call :reopen
echo.
echo FALLO / FAILED
pause
exit /b 1
