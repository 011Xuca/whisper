<#
.SYNOPSIS
  Instala Whisper (edicion Vencord) / Installs Whisper (Vencord edition). Solo Windows / Windows only.
.DESCRIPTION
  Instala lo que falte (Git, Node.js, pnpm), clona Vencord, copia el plugin, compila e inyecta Discord.
  Es seguro volver a ejecutarlo para actualizar. Installs what is missing, clones Vencord, copies the plugin, builds and injects Discord. Safe to re-run to update.
.PARAMETER VencordDir  Carpeta del clon de Vencord (por defecto, %LOCALAPPDATA%\Whisper\Vencord o el clon junto a la carpeta whisper si ya existe) / Vencord clone folder (default: %LOCALAPPDATA%\Whisper\Vencord, or the clone next to the whisper folder if it already exists).
.PARAMETER Branch      stable | ptb | canary. Si se omite, se pregunta / asked when omitted.
.PARAMETER Yes         Acepta todas las confirmaciones (instalar con winget, etc.) / Accept every prompt.
.PARAMETER DryRun      Solo muestra lo que haria; no instala, clona, copia, compila ni inyecta / Only prints what it would do.
.PARAMETER NoInject    Compila pero no inyecta Discord / Build but do not inject Discord.
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -DryRun
#>
param(
    [string]$VencordDir,
    [ValidateSet('stable', 'ptb', 'canary')][string]$Branch,
    [switch]$Yes,
    [switch]$DryRun,
    [switch]$NoInject
)
$ErrorActionPreference = 'Stop'
# Mensajes en ASCII: Windows PowerShell 5.1 lee mal los .ps1 sin BOM con acentos.
$es = (Get-UICulture).TwoLetterISOLanguageName -eq 'es'
function T($e, $n) { if ($es) { $e } else { $n } }
function Say($m) { Write-Host $m }
function Step($m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "AVISO/WARNING: $m" -ForegroundColor Yellow }
function Fail($m) { throw $m }
function Ask($q) {
    if ($Yes -or $DryRun) { Say "$q -> $(T 'si (automatico)' 'yes (automatic)')"; return $true }
    return (Read-Host "$q [$(T 's/N' 'y/N')]") -match '^(s|si|y|yes)$'
}
# Ejecuta una accion que cambia el sistema; en -DryRun solo la describe.
function Do-It($desc, [scriptblock]$sb) {
    if ($DryRun) { Say "[DryRun] $desc"; return }
    Say "-> $desc"; & $sb
}
function Has($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Exec { # corre un programa y falla si devuelve error
    # Application evita el shim npm.ps1, que falla al parsear $MyInvocation.Line cuando se llama con splatting
    $exe = (Get-Command $args[0] -CommandType Application | Select-Object -First 1).Source
    & $exe @($args[1..($args.Count - 1)])
    if ($LASTEXITCODE -ne 0) { Fail (T "Fallo el comando: $($args -join ' ') (codigo $LASTEXITCODE)" "Command failed: $($args -join ' ') (exit code $LASTEXITCODE)") }
}
function Winget-Install($id, $cmd, $name, $url) {
    if (-not (Has winget)) {
        Fail (T "$name no esta instalado y winget no existe. Instala $name a mano desde $url y vuelve a ejecutar este script." "$name is missing and winget is not available. Install $name manually from $url and re-run this script.")
    }
    if (-not (Ask (T "Falta $name. Instalarlo con winget ($id)?" "$name is missing. Install it with winget ($id)?"))) {
        Fail (T "$name es necesario. Instalalo desde $url y vuelve a ejecutar." "$name is required. Install it from $url and re-run.")
    }
    Do-It "winget install $id" {
        winget install --id $id -e --accept-package-agreements --accept-source-agreements
        Refresh-Path
        if (-not (Has $cmd)) { Fail (T "Se instalo $name pero '$cmd' no se encuentra. Cierra y abre PowerShell y vuelve a ejecutar." "$name was installed but '$cmd' was not found. Reopen PowerShell and re-run.") }
    }
}

# --- Origen del plugin: esta carpeta, o la subcarpeta whisper del zip ---
$src = $PSScriptRoot
if (-not (Test-Path (Join-Path $src 'index.ts'))) { $src = Join-Path $PSScriptRoot 'whisper' }
if (-not (Test-Path (Join-Path $src 'index.ts'))) { Fail (T "No encuentro el codigo del plugin (index.ts). Ejecuta el script desde la carpeta whisper o la del zip." "Plugin source (index.ts) not found. Run the script from the whisper folder or the release zip folder.") }
if (-not $VencordDir) {
    # inside the repo layout (<repo>/vencord) the clone goes next to the repo folder, not inside it
    $base = Split-Path $src -Parent
    if ((Split-Path $src -Leaf) -ieq 'vencord') { $base = Split-Path $base -Parent }
    $VencordDir = Join-Path $base 'Vencord'
    # Discord queda apuntando a esta carpeta: si no hay un clon ya hecho aqui, usa una ruta fija que no se mueva/borre con el zip (Descargas)
    # Discord keeps pointing at this folder: unless a clone already exists here, use a fixed path that moving/deleting the zip folder will not break
    if (-not (Test-Path (Join-Path $VencordDir 'package.json'))) { $VencordDir = Join-Path $env:LOCALAPPDATA 'Whisper\Vencord' }
}
$VencordDir = [IO.Path]::GetFullPath($VencordDir)
if ($DryRun) { Say (T '*** MODO DryRun: no se cambia nada ***' '*** DryRun mode: nothing is changed ***') }
Say "Whisper -> $VencordDir"

# --- 1. Git ---
Step 'Git'
if (Has git) { Say (git --version) } else { Winget-Install 'Git.Git' 'git' 'Git' 'https://git-scm.com/download/win' }

# --- 2. Clon de Vencord (necesario para leer los requisitos exactos de Node y pnpm) ---
Step (T 'Vencord (codigo fuente)' 'Vencord (source code)')
$pkgPath = Join-Path $VencordDir 'package.json'
if (Test-Path $pkgPath) {
    Say (T 'Se reutiliza el clon existente.' 'Reusing the existing clone.')
    if (Test-Path (Join-Path $VencordDir '.git')) {
        if (git -C $VencordDir status --porcelain) { Warn (T 'El clon de Vencord tiene cambios locales: no se actualiza (git pull omitido).' 'The Vencord clone has local changes: not updating (git pull skipped).') }
        else { Do-It 'git pull --ff-only' { git -C $VencordDir pull --ff-only; if ($LASTEXITCODE -ne 0) { Warn (T 'git pull fallo; se continua con la version local.' 'git pull failed; continuing with the local version.') } } }
    }
} elseif ((Test-Path $VencordDir) -and (Get-ChildItem $VencordDir -Force | Select-Object -First 1)) {
    Fail (T "$VencordDir existe, no esta vacia y no es Vencord. Usa -VencordDir con otra ruta." "$VencordDir exists, is not empty and is not Vencord. Use -VencordDir with another path.")
} else {
    Do-It "git clone https://github.com/Vendicated/Vencord -> $VencordDir" { Exec git clone --depth 1 https://github.com/Vendicated/Vencord $VencordDir }
}

# --- 3. Node.js y pnpm segun el package.json de Vencord ---
$minNode = [version]'22.0'; $pnpmVer = $null
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if ($pkg.engines.node -match '>=\s*(\d+(\.\d+)*)') { $v = $Matches[1]; if ($v -notmatch '\.') { $v += '.0' }; $minNode = [version]$v }
    if ($pkg.packageManager -match '^pnpm@([\d.]+)') { $pnpmVer = $Matches[1] }
} else { Warn (T 'Vencord aun no esta clonado (DryRun): se usan valores por defecto (Node >= 22, pnpm segun package.json).' 'Vencord is not cloned yet (DryRun): using defaults (Node >= 22, pnpm from package.json).') }

Step "Node.js (>= $minNode)"
function Node-Ok { if (-not (Has node)) { return $false }; return ([version](((node -v) -replace '^v', '') -replace '^(\d+\.\d+).*', '$1')) -ge $minNode }
if (Node-Ok) { Say "node $(node -v)" } else {
    if (Has node) { Warn (T "Node $(node -v) es demasiado antiguo." "Node $(node -v) is too old.") }
    Winget-Install 'OpenJS.NodeJS.LTS' 'node' 'Node.js' 'https://nodejs.org'
    if (-not $DryRun -and -not (Node-Ok)) { Fail (T "Node $(node -v) sigue sin cumplir >= $minNode. Instala una version mas nueva desde https://nodejs.org" "Node $(node -v) still does not meet >= $minNode. Install a newer one from https://nodejs.org") }
}

Step "pnpm ($pnpmVer)"
if ($pnpmVer) {
    $cur = if (Has pnpm) { (pnpm -v) } else { $null }
    if ($cur -eq $pnpmVer) { Say "pnpm $cur" }
    elseif ($cur) { Warn (T "pnpm $cur instalado; Vencord fija $pnpmVer. Se continua (pnpm moderno usa la version fijada solo); si la compilacion falla, ejecuta: npm i -g pnpm@$pnpmVer" "pnpm $cur installed; Vencord pins $pnpmVer. Continuing (recent pnpm switches to the pinned version itself); if the build fails run: npm i -g pnpm@$pnpmVer") }
    else {
        if (-not (Ask (T "Falta pnpm. Instalar pnpm $pnpmVer con npm (npm i -g pnpm@$pnpmVer)?" "pnpm is missing. Install pnpm $pnpmVer with npm (npm i -g pnpm@$pnpmVer)?"))) { Fail (T 'pnpm es necesario.' 'pnpm is required.') }
        Do-It "npm i -g pnpm@$pnpmVer" { Exec npm i -g "pnpm@$pnpmVer"; Refresh-Path; if (-not (Has pnpm)) { Fail (T 'pnpm no se encuentra tras instalarlo. Reabre PowerShell y reintenta.' 'pnpm not found after install. Reopen PowerShell and retry.') } }
    }
} else { Say (T 'Se determinara tras clonar.' 'Will be determined after cloning.') }

# --- 4. Discord ---
Step 'Discord'
$dirs = @{ stable = 'Discord'; ptb = 'DiscordPTB'; canary = 'DiscordCanary' }
$found = @($dirs.Keys | Where-Object { Test-Path (Join-Path $env:LOCALAPPDATA $dirs[$_]) } | Sort-Object)
if (-not $found) {
    Warn (T 'No se encontro Discord (Stable, PTB ni Canary) en %LOCALAPPDATA%.' 'Discord (Stable, PTB or Canary) was not found in %LOCALAPPDATA%.')
    Say (T 'Descargalo e instalalo desde https://discord.com/download, inicia sesion una vez y cierralo.' 'Download and install it from https://discord.com/download, sign in once and close it.')
    if (-not $DryRun -and -not $Yes) { Read-Host (T 'Pulsa Enter cuando este instalado' 'Press Enter when it is installed') | Out-Null }
    elseif (-not $DryRun) { Fail (T 'Discord no esta instalado.' 'Discord is not installed.') }
} else { Say ((T 'Encontrado: ' 'Found: ') + ($found -join ', ')) }
if (-not $Branch) {
    if ($found.Count -eq 1) { $Branch = $found[0] }
    elseif ($DryRun -or $Yes) { $Branch = if (($found -contains 'stable') -or (-not $found)) { 'stable' } else { $found[0] } }
    else { do { $Branch = (Read-Host (T 'Que Discord inyectar? (stable/ptb/canary)' 'Which Discord to inject? (stable/ptb/canary)')).Trim().ToLower() } until ($dirs.ContainsKey($Branch)) }
}
Say "Branch: $Branch"
# con -Yes y varias variantes instaladas se inyectan todas / with -Yes and several variants installed, inject all of them
$targets = if ($Yes -and -not $PSBoundParameters.ContainsKey('Branch') -and $found.Count -gt 1) { $found } else { @($Branch) }

# --- 5. Copiar el plugin ---
Step (T 'Copiar el plugin' 'Copy the plugin')
$dest = Join-Path $VencordDir 'src\userplugins\whisper'
# /MIR deja nuestra copia identica al origen (solo dentro de userplugins\whisper); no toca nada mas
Do-It "robocopy $src -> $dest" {
    robocopy $src $dest /MIR /XD .git .claude node_modules /XF install.ps1 update.ps1 Whisper.bat README.md 'INSTALL*' .gitignore | Out-Null
    if ($LASTEXITCODE -ge 8) { Fail "robocopy fallo/failed ($LASTEXITCODE)" }
}

# --- 6. Compilar ---
Step (T 'Compilar Vencord' 'Build Vencord')
Do-It 'pnpm install' { Push-Location $VencordDir; try { Exec pnpm install --config.confirm-modules-purge=false } finally { Pop-Location } }
Do-It 'pnpm build' { Push-Location $VencordDir; try { Exec pnpm build } finally { Pop-Location } }

# --- 7. Inyectar ---
if ($NoInject) { Say (T 'Inyeccion omitida (-NoInject).' 'Injection skipped (-NoInject).') } else {
    Step (T "Inyectar Vencord en Discord ($($targets -join ', '))" "Inject Vencord into Discord ($($targets -join ', '))")
    $run = Get-Process -Name Discord, DiscordPTB, DiscordCanary -ErrorAction SilentlyContinue
    if ($run -and -not $DryRun) {
        if ($Yes) { Fail (T 'Discord esta abierto. Cierralo (tambien la bandeja del sistema) y reintenta.' 'Discord is running. Close it (also from the tray) and retry.') }
        Read-Host (T 'Cierra Discord por completo (tambien en la bandeja) y pulsa Enter' 'Fully close Discord (also from the tray) and press Enter') | Out-Null
    }
    # Es lo mismo que "pnpm inject" pero con la rama elegida (el instalador CLI acepta --branch)
    foreach ($b in $targets) { Do-It "node scripts/runInstaller.mjs -- --install --branch $b" { Push-Location $VencordDir; try { Exec node scripts/runInstaller.mjs '--' '--install' '--branch' $b } finally { Pop-Location } } }
}

Step (T 'Listo' 'Done')
Say (T 'Abre (o reinicia) Discord y activa Whisper en Ajustes -> Vencord -> Plugins -> Whisper.' 'Open (or restart) Discord and enable Whisper under Settings -> Vencord -> Plugins -> Whisper.')
Say (T 'Para actualizar: vuelve a ejecutar este script. Para desinstalar: ver README.' 'To update: re-run this script. To uninstall: see README.')
