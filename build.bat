@echo off
rem Compila la edicion BetterDiscord, la prueba y deja los zips en el Escritorio.
rem Builds the BetterDiscord edition, self-checks it and drops both zips on the Desktop.
setlocal
cd /d "%~dp0"
if not defined ESBUILD (
  if exist "..\Vencord\node_modules\esbuild" (set "ESBUILD=%CD%\..\Vencord\node_modules\esbuild") else (
    if not exist "%TEMP%\whisper-esbuild\node_modules\esbuild" call npm i esbuild@0.21.5 --prefix "%TEMP%\whisper-esbuild" --silent || goto :fail
    set "ESBUILD=%TEMP%\whisper-esbuild\node_modules\esbuild"
  )
)
pushd betterdiscord
call node build.mjs || (popd & goto :fail)
call node test\selfcheck.mjs || (popd & goto :fail)
popd
powershell -NoProfile -Command ^
 "$d=[Environment]::GetFolderPath('Desktop'); $ErrorActionPreference='Stop';" ^
 "$b=@('betterdiscord\Whisper.plugin.js','betterdiscord\install.ps1','betterdiscord\Whisper.bat');" ^
 "Compress-Archive $b \"$d\Whisper-BetterDiscord.zip\" -Force;" ^
 "$v=Get-ChildItem vencord -Force | Where-Object { $_.Name -notin 'node_modules','.git','.claude' };" ^
 "Compress-Archive $v.FullName \"$d\Whisper-Vencord.zip\" -Force;" ^
 "Write-Host \"Zips en / in $d\"" || goto :fail
echo Listo / Done.
exit /b 0
:fail
echo FALLO / FAILED
exit /b 1
