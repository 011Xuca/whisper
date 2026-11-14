@echo off
rem Whisper (BetterDiscord): instala, repara o actualiza sin preguntas. Install, repair or update with no questions.
setlocal
cd /d "%~dp0" || goto :fail
if not exist "install.ps1" goto :unzip
if not exist "Whisper.plugin.js" goto :unzip
echo WHISPER (BetterDiscord)
echo   1) Instalar o reparar / Install or repair
echo   2) Actualizar a la ultima version / Update to the latest
echo (Cierra Discord solo y lo reabre / Closes Discord by itself and reopens it)
choice /c 12 /n /m "> "
set "UPD=0"
if errorlevel 2 set "UPD=1"
if "%UPD%"=="1" call :download || goto :fail
call :closediscord
rem -Yes: instala BetterDiscord si falta (su instalador oficial) y copia el plugin / installs BetterDiscord if missing and copies the plugin
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" -Yes
if errorlevel 1 goto :fail
call :reopen
echo.
echo Listo. Activa Whisper en Ajustes - Plugins. / Done. Enable Whisper in Settings - Plugins.
pause
exit /b 0
:download
rem Baja a un temporal y solo reemplaza si es valido / downloads to a temp file and replaces only if valid
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $t=Join-Path $env:TEMP 'Whisper.plugin.js.new'; Invoke-WebRequest 'https://raw.githubusercontent.com/011Xuca/whisper/main/betterdiscord/Whisper.plugin.js' -OutFile $t -UseBasicParsing; if ((Get-Item $t).Length -lt 1000 -or -not (Select-String -Path $t -Pattern '@name' -Quiet)) { throw 'descarga invalida / invalid download' }; Move-Item $t (Join-Path $PWD 'Whisper.plugin.js') -Force"
exit /b %errorlevel%
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
