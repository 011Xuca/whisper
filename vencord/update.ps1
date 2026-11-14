<#
.SYNOPSIS
  Actualiza Whisper (Vencord) a la ultima version de GitHub / Updates Whisper (Vencord) to the latest GitHub version.
.DESCRIPTION
  Baja el codigo de GitHub, reemplaza esta carpeta y ejecuta install.ps1 -Yes -NoInject (copia, compila). No cierra Discord: reinicialo despues.
  Downloads the code from GitHub, refreshes this folder and runs install.ps1 -Yes -NoInject (copy, build). Does not close Discord: restart it afterwards.
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\update.ps1
#>
$ErrorActionPreference = 'Stop'
$repo = '011Xuca/whisper'
$tmp = Join-Path ([IO.Path]::GetTempPath()) ('whisper-update-' + [guid]::NewGuid())
New-Item -ItemType Directory $tmp | Out-Null
try {
    Write-Host "Descargando / Downloading $repo ..."
    Invoke-WebRequest "https://github.com/$repo/archive/refs/heads/main.zip" -OutFile "$tmp\w.zip" -UseBasicParsing
    Expand-Archive "$tmp\w.zip" "$tmp\x"
    $new = Join-Path (Get-ChildItem "$tmp\x" | Select-Object -First 1).FullName 'vencord'
    if (-not (Test-Path (Join-Path $new 'index.ts'))) { throw 'index.ts no esta en la descarga / not in the download' }
    # copy over this folder (no /MIR: never delete the user's files); update.ps1 itself is skipped because it is running and replaced at the end
    $self = Get-Content (Join-Path $new 'update.ps1') -Raw
    robocopy $new $PSScriptRoot /E /XF update.ps1 | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy fallo/failed ($LASTEXITCODE)" }
} finally { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
& (Join-Path $PSScriptRoot 'install.ps1') -Yes -NoInject
# PowerShell parsed this whole script already, so rewriting it now is safe
if ($self) { Set-Content (Join-Path $PSScriptRoot 'update.ps1') $self -NoNewline -Encoding UTF8 }
Write-Host 'Reinicia Discord para cargar la version nueva / Restart Discord to load the new version.'
