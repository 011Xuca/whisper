<#
.SYNOPSIS
  Instala Whisper (edicion BetterDiscord) / Installs Whisper (BetterDiscord edition). Solo Windows / Windows only.
.DESCRIPTION
  Comprueba BetterDiscord; si falta, descarga su instalador oficial y espera a que lo uses. Despues copia Whisper.plugin.js
  a %APPDATA%\BetterDiscord\plugins. Seguro de repetir para actualizar.
  Checks BetterDiscord; if missing, downloads the official installer and waits for you to use it. Then copies Whisper.plugin.js
  to %APPDATA%\BetterDiscord\plugins. Safe to re-run to update.
.PARAMETER Yes     Acepta las confirmaciones (descargar el instalador) / Accept prompts (download the installer).
.PARAMETER DryRun  Solo muestra lo que haria; no descarga ni copia nada / Only prints what it would do.
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
#>
param(
    [switch]$Yes,
    [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
# Mensajes en ASCII: Windows PowerShell 5.1 lee mal los .ps1 sin BOM con acentos.
$es = (Get-UICulture).TwoLetterISOLanguageName -eq 'es'
function T($e, $n) { if ($es) { $e } else { $n } }
function Say($m) { Write-Host $m }
function Step($m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "AVISO/WARNING: $m" -ForegroundColor Yellow }
function Ask($q) {
    if ($Yes -or $DryRun) { Say "$q -> $(T 'si (automatico)' 'yes (automatic)')"; return $true }
    return (Read-Host "$q [$(T 's/N' 'y/N')]") -match '^(s|si|y|yes)$'
}

$plugin = Join-Path $PSScriptRoot 'Whisper.plugin.js'
if (-not (Test-Path $plugin)) { throw (T "No encuentro Whisper.plugin.js junto al script ($PSScriptRoot)." "Whisper.plugin.js not found next to the script ($PSScriptRoot).") }
$bdDir = Join-Path $env:APPDATA 'BetterDiscord'
$plugins = Join-Path $bdDir 'plugins'
if ($DryRun) { Say (T '*** MODO DryRun: no se cambia nada ***' '*** DryRun mode: nothing is changed ***') }

# --- 1. Discord ---
Step 'Discord'
$dirs = 'Discord', 'DiscordPTB', 'DiscordCanary' | Where-Object { Test-Path (Join-Path $env:LOCALAPPDATA $_) }
if ($dirs) { Say ((T 'Encontrado: ' 'Found: ') + ($dirs -join ', ')) } else {
    Warn (T 'No se encontro Discord en %LOCALAPPDATA%. Instalalo desde https://discord.com/download, inicia sesion una vez y cierralo.' 'Discord was not found in %LOCALAPPDATA%. Install it from https://discord.com/download, sign in once and close it.')
    if (-not $DryRun -and -not $Yes) { Read-Host (T 'Pulsa Enter cuando este instalado' 'Press Enter when it is installed') | Out-Null }
    elseif (-not $DryRun) { throw (T 'Discord no esta instalado.' 'Discord is not installed.') }
}

# --- 2. BetterDiscord ---
Step 'BetterDiscord'
# shortcut: solo comprueba la carpeta de plugins, no que Discord siga inyectado; si el plugin no aparece, reinstala BetterDiscord.
if (Test-Path $plugins) { Say (T "BetterDiscord encontrado: $bdDir" "BetterDiscord found: $bdDir") } else {
    Warn (T 'BetterDiscord no esta instalado (no existe %APPDATA%\BetterDiscord\plugins).' 'BetterDiscord is not installed (%APPDATA%\BetterDiscord\plugins does not exist).')
    if (-not (Ask (T 'Descargar el instalador oficial de BetterDiscord?' 'Download the official BetterDiscord installer?'))) {
        throw (T 'BetterDiscord es necesario. Instalalo desde https://betterdiscord.app/ o copia Whisper.plugin.js a mano en %APPDATA%\BetterDiscord\plugins.' 'BetterDiscord is required. Install it from https://betterdiscord.app/ or copy Whisper.plugin.js manually to %APPDATA%\BetterDiscord\plugins.')
    }
    $api = 'https://api.github.com/repos/BetterDiscord/Installer/releases/latest'
    if ($DryRun) { Say "[DryRun] GET $api -> $(T 'asset .exe de Windows -> %TEMP%' 'Windows .exe asset -> %TEMP%')" }
    else {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        $rel = Invoke-RestMethod -Uri $api -Headers @{ 'User-Agent' = 'whisper-installer' }
        $asset = $rel.assets | Where-Object { $_.name -match '\.exe$' -and $_.name -match 'win|setup|installer' } | Select-Object -First 1
        if (-not $asset) { $asset = $rel.assets | Where-Object { $_.name -match '\.exe$' } | Select-Object -First 1 }
        if (-not $asset) { throw (T 'No hay un .exe en la ultima version de BetterDiscord/Installer. Descargalo desde https://betterdiscord.app/' 'No .exe in the latest BetterDiscord/Installer release. Download it from https://betterdiscord.app/') }
        $exe = Join-Path $env:TEMP $asset.name
        Say (T "Descargando $($asset.name) ($($rel.tag_name))..." "Downloading $($asset.name) ($($rel.tag_name))...")
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $exe -UseBasicParsing
        # GitHub publishes a sha256 digest for release assets: refuse a file that does not match it
        if ($asset.digest -match '^sha256:(.+)$') {
            if ((Get-FileHash $exe -Algorithm SHA256).Hash -ne $Matches[1]) { Remove-Item $exe -Force; throw (T 'El instalador descargado no coincide con el hash publicado por GitHub; se borro.' 'The downloaded installer does not match the sha256 published by GitHub; it was deleted.') }
            Say (T 'Hash SHA-256 verificado.' 'SHA-256 verified.')
        } else { Say (T 'Aviso: GitHub no publico hash para este archivo; no se pudo verificar.' 'Warning: GitHub published no hash for this file; it could not be verified.') }
        Say (T "Guardado en $exe. Abriendolo; pulsa Install en tu Discord y espera a que termine." "Saved to $exe. Opening it; click Install on your Discord and wait until it finishes.")
        Start-Process $exe
        $deadline = (Get-Date).AddMinutes(15)
        do {
            if ($Yes) { Start-Sleep 5; if ((Get-Date) -gt $deadline) { throw (T 'BetterDiscord no aparecio en 15 minutos.' 'BetterDiscord did not appear within 15 minutes.') } }
            else { Read-Host (T 'Pulsa Enter cuando BetterDiscord este instalado' 'Press Enter once BetterDiscord is installed') | Out-Null }
        } until (Test-Path $plugins -PathType Container)
    }
}

# --- 3. Copiar el plugin ---
Step (T 'Copiar el plugin' 'Copy the plugin')
if ($DryRun) { Say "[DryRun] Copy-Item Whisper.plugin.js -> $plugins" } else {
    New-Item -ItemType Directory -Force $plugins | Out-Null
    Copy-Item $plugin $plugins -Force
    Say (T "Copiado a $plugins" "Copied to $plugins")
}

Step (T 'Listo' 'Done')
Say (T 'Reinicia Discord (Ctrl+R basta) y activa Whisper en Ajustes -> Plugins.' 'Restart Discord (Ctrl+R is enough) and enable Whisper in Settings -> Plugins.')
Say (T 'Para actualizar: sustituye Whisper.plugin.js (o repite este script). Para desinstalar: borra el archivo de la carpeta de plugins.' 'To update: replace Whisper.plugin.js (or re-run this script). To uninstall: delete the file from the plugins folder.')
