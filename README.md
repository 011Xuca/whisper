# Whisper

Plugin personal para Discord que reduce el uso de CPU y RAM del cliente. Tiene dos ediciones, cada una con su propio código fuente en su carpeta.
Personal Discord plugin that lowers the client's CPU and RAM use. It has two editions, each with its own source in its own folder.

| Carpeta / Folder | Para / For | Instalador / Installer |
|---|---|---|
| [`vencord/`](vencord/) | [Vencord](https://vencord.dev) (plugin de usuario, se compila junto con Vencord / userplugin built together with Vencord) | `vencord/install.ps1` |
| [`betterdiscord/`](betterdiscord/) | [BetterDiscord](https://betterdiscord.app) (un solo archivo / a single file, `Whisper.plugin.js`) | `betterdiscord/install.ps1` |

## Aviso / Notice

**ES:** este proyecto **será eliminado el día que salga Discord Phoenix**. No se mantendrá para esa versión.

**EN:** this project **will be deleted the day Discord Phoenix is released**. It will not be maintained for it.

## Advertencia / Warning

**ES:** los términos de Discord prohíben los mods del cliente (Vencord y BetterDiscord incluidos). Úsalo bajo tu propio riesgo. Solo actúa sobre tu propio cliente y tus propios ajustes; nunca toca el audio de las llamadas ni envía mensajes.

**EN:** Discord's Terms of Service prohibit client mods (Vencord and BetterDiscord included). Use at your own risk. It only acts on your own client and settings; it never touches call audio or sends messages.

## Qué hace / What it does

**ES:** todo viene **desactivado** salvo el *Modo juego*, el *logo de Whisper* y (solo Vencord) el aviso de versiones nuevas. Cada opción se activa por separado en el panel de ajustes del plugin, y hay perfiles (Ligero, Equilibrado, Máximo ahorro, Gaming) que activan un conjunto de opciones de una vez. Entre otras cosas: dormir la interfaz al minimizar o taparse por completo (perder el foco no la duerme), modo juego con límite de FPS, sin animaciones/desenfoques/sombras, GIFs, emojis e imágenes bajo demanda, ocultar decoraciones de perfil, Misiones, Tienda/Nitro y "Activo ahora", y filtros de eventos (escritura, presencia, canales silenciados, telemetría).

**EN:** everything is **off** except *Game mode*, the *Whisper logo* and (Vencord only) the new-version notice. Each option is switched on separately in the plugin's settings panel, and presets (Light, Balanced, Maximum savings, Gaming) switch on a group of options at once. Among other things: sleeping the UI when minimized or fully covered (losing focus does not sleep it), game mode with an FPS limit, no animations/blur/shadows, GIFs, emojis and images on demand, hiding profile decorations, Quests, Shop/Nitro and "Active Now", and event filters (typing, presence, muted channels, telemetry).

## Instalación / Installation (Windows)

### ES

Los dos instaladores son scripts de PowerShell. Instalan lo que falte; puedes ejecutarlos con `-DryRun` para ver lo que harían sin cambiar nada, o con `-Yes` para aceptar todas las preguntas. Si PowerShell dice que la ejecución de scripts está deshabilitada, usa el comando de abajo (lleva `-ExecutionPolicy Bypass`).

#### Edición Vencord (`vencord/`)

Los plugins propios de Vencord solo funcionan si Vencord se **compila desde su código fuente**; por eso hace falta un pequeño entorno de desarrollo. El instalador lo prepara.

| Requisito | Para qué | Quién lo instala |
|---|---|---|
| Discord (Stable, PTB o Canary) | El cliente que se modifica | Tú: https://discord.com/download |
| Git | Clonar Vencord | El script, con `winget`, tras pedirte confirmación |
| Node.js (versión mínima que pide Vencord) | Compilar Vencord | El script, con `winget`, tras pedirte confirmación |
| pnpm (versión exacta que pide Vencord) | Gestor de paquetes de Vencord | El script, con `npm`, tras pedirte confirmación |
| Vencord (código fuente) | Cargar el plugin | El script lo clona junto a esta carpeta, o usa tu clon existente |

```powershell
cd vencord
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

El script copia el plugin a `src\userplugins\whisper` de Vencord, compila e inyecta Discord (te pregunta cuál, o usa `-Branch stable|ptb|canary`). Cierra Discord antes. Opciones: `-VencordDir RUTA` (clon de Vencord; por defecto, junto a la carpeta del repo), `-Branch`, `-NoInject` (compila sin inyectar), `-DryRun`, `-Yes`.
Después abre Discord y activa **Ajustes → Vencord → Plugins → Whisper**.

**A mano:** copia el contenido de `vencord/` (sin `install.ps1` ni `INSTALL.txt`) a `Vencord\src\userplugins\whisper` y ejecuta `pnpm install`, `pnpm build` y `pnpm inject`.
**Actualizar:** vuelve a ejecutar `install.ps1` con la versión nueva del plugin.
**Desinstalar:** desactiva Whisper en Ajustes → Vencord → Plugins. Para quitar Vencord de Discord, cierra Discord y ejecuta `pnpm uninject` en la carpeta de Vencord. El script no borra tus archivos personales (solo sincroniza la carpeta del plugin dentro de Vencord).

#### Edición BetterDiscord (`betterdiscord/`)

No hay que compilar nada: es un único archivo, `Whisper.plugin.js`.

| Requisito | Para qué | Quién lo instala |
|---|---|---|
| Discord (Stable, PTB o Canary) | El cliente que se modifica | Tú: https://discord.com/download (inicia sesión una vez) |
| BetterDiscord | Carga el plugin en Discord | El script descarga el instalador oficial (último release de `BetterDiscord/Installer`, comprobando su hash SHA-256 si GitHub lo publica); tú pulsas *Install* en él |

```powershell
cd betterdiscord
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

Si BetterDiscord falta, el script guarda su instalador en `%TEMP%` y lo abre; elige tu Discord y pulsa *Install* (la ventana no se automatiza), vuelve y pulsa Enter (con `-Yes` espera solo, hasta 15 minutos). Después copia `Whisper.plugin.js` a `%APPDATA%\BetterDiscord\plugins`. Reinicia Discord (Ctrl+R) y activa Whisper en **Ajustes → Plugins**.

**A mano:** instala BetterDiscord desde https://betterdiscord.app, arrastra `Whisper.plugin.js` a `%APPDATA%\BetterDiscord\plugins` (o Ajustes → Plugins → Abrir carpeta de plugins) y actívalo.
**Actualizar:** sustituye `Whisper.plugin.js` por la versión nueva (o repite el script).
**Desinstalar:** desactívalo en Ajustes → Plugins y borra `Whisper.plugin.js` de esa carpeta. BetterDiscord se desinstala con su propio instalador.

#### Problemas frecuentes

- *"La ejecución de scripts está deshabilitada"*: usa el comando con `-ExecutionPolicy Bypass`.
- *No hay `winget`* (Vencord): instala Git (https://git-scm.com) y Node.js (https://nodejs.org) a mano y repite.
- *No se encuentra Discord*: instálalo desde https://discord.com/download, inicia sesión una vez y repite.
- *Sin conexión a GitHub / API bloqueada* (BetterDiscord): descarga el instalador desde https://betterdiscord.app y usa la instalación a mano.
- *El antivirus o SmartScreen avisa*: son ejecutables oficiales de terceros (winget, BetterDiscord); si no te fías, instálalos tú desde sus webs.
- *El plugin desaparece tras una actualización de Discord*: Discord pudo quitar la inyección; vuelve a ejecutar el instalador.

### EN

Both installers are PowerShell scripts. They install what is missing; run them with `-DryRun` to see what they would do without changing anything, or with `-Yes` to accept every prompt. If PowerShell says script execution is disabled, use the command below (it includes `-ExecutionPolicy Bypass`).

#### Vencord edition (`vencord/`)

Vencord userplugins only work when Vencord is **built from source**, so a small dev toolchain is needed. The installer sets it up.

| Requirement | Why | Who installs it |
|---|---|---|
| Discord (Stable, PTB or Canary) | The client being modified | You: https://discord.com/download |
| Git | To clone Vencord | The script, via `winget`, after asking you |
| Node.js (minimum version Vencord requires) | To build Vencord | The script, via `winget`, after asking you |
| pnpm (exact version Vencord requires) | Vencord's package manager | The script, via `npm`, after asking you |
| Vencord (source code) | Loads the plugin | The script clones it next to this folder, or uses your existing clone |

```powershell
cd vencord
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

The script copies the plugin to Vencord's `src\userplugins\whisper`, builds and injects Discord (it asks which one, or use `-Branch stable|ptb|canary`). Close Discord first. Options: `-VencordDir PATH` (Vencord clone; default: next to the repo folder), `-Branch`, `-NoInject` (build without injecting), `-DryRun`, `-Yes`.
Then open Discord and enable **Settings → Vencord → Plugins → Whisper**.

**Manual:** copy the contents of `vencord/` (without `install.ps1` and `INSTALL.txt`) to `Vencord\src\userplugins\whisper` and run `pnpm install`, `pnpm build` and `pnpm inject`.
**Update:** re-run `install.ps1` with the new plugin version.
**Uninstall:** disable Whisper under Settings → Vencord → Plugins. To remove Vencord from Discord, close Discord and run `pnpm uninject` in the Vencord folder. The script does not delete your personal files (it only syncs the plugin folder inside Vencord).

#### BetterDiscord edition (`betterdiscord/`)

Nothing to compile: it is a single file, `Whisper.plugin.js`.

| Requirement | Why | Who installs it |
|---|---|---|
| Discord (Stable, PTB or Canary) | The client being modified | You: https://discord.com/download (sign in once) |
| BetterDiscord | Loads the plugin into Discord | The script downloads the official installer (latest `BetterDiscord/Installer` release, checking its SHA-256 when GitHub publishes one); you click *Install* in it |

```powershell
cd betterdiscord
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

If BetterDiscord is missing, the script saves its installer to `%TEMP%` and opens it; pick your Discord and click *Install* (the window is not automated), then come back and press Enter (with `-Yes` it waits by itself, up to 15 minutes). It then copies `Whisper.plugin.js` to `%APPDATA%\BetterDiscord\plugins`. Restart Discord (Ctrl+R) and enable Whisper under **Settings → Plugins**.

**Manual:** install BetterDiscord from https://betterdiscord.app, drag `Whisper.plugin.js` into `%APPDATA%\BetterDiscord\plugins` (or Settings → Plugins → Open Plugins Folder) and enable it.
**Update:** replace `Whisper.plugin.js` with the new version (or re-run the script).
**Uninstall:** disable it in Settings → Plugins and delete `Whisper.plugin.js` from that folder. BetterDiscord itself is removed with its own installer.

#### Troubleshooting

- *"Running scripts is disabled"*: use the `-ExecutionPolicy Bypass` command.
- *No `winget`* (Vencord): install Git (https://git-scm.com) and Node.js (https://nodejs.org) manually and re-run.
- *Discord not found*: install it from https://discord.com/download, sign in once and re-run.
- *No GitHub access / API blocked* (BetterDiscord): download the installer from https://betterdiscord.app and use the manual route.
- *Antivirus or SmartScreen warns*: these are official third-party executables (winget, BetterDiscord); if unsure, install them yourself from their sites.
- *The plugin disappears after a Discord update*: Discord may have dropped the injection; run the installer again.

## Diferencias entre ediciones / Differences between editions

**ES:**

| | Vencord | BetterDiscord |
|---|---|---|
| Instalación | Hay que compilar Vencord (`install.ps1`) | Un solo archivo `Whisper.plugin.js`, sin compilar |
| Actualizar | `update.ps1` (baja la última versión, compila; reinicia Discord) | Reemplaza `Whisper.plugin.js` |
| Aviso de versiones nuevas | Sí, activado por defecto | No (el ajuste del menú no hace nada) |
| Voz ligera en juego | Sí | No |
| Cerrar transmisiones/cámaras al dormir y reabrirlas | Sí | No |
| Todo lo demás (efectos, media al pasar el mouse, perfiles, filtros, modo juego) | Sí | Sí |

"Dormir al minimizar o taparse" usa la oclusión nativa de Chromium; funcionó sin opciones extra en las versiones probadas. Si en tu versión solo detecta minimizar, inicia Discord con `--enable-features=CalculateNativeWinOcclusion`. Las ediciones comparten la lógica, pero Vencord tiene más funciones de llamada, que son las que más trabajo hacen al dormir y despertar. Si solo buscas ahorrar CPU sin más, BetterDiscord es más simple.

**EN:**

| | Vencord | BetterDiscord |
|---|---|---|
| Install | Vencord must be built (`install.ps1`) | Single `Whisper.plugin.js` file, no build |
| Update | `update.ps1` (downloads the latest version and builds; restart Discord) | Replace `Whisper.plugin.js` |
| New-version notice | Yes, on by default | No (the menu switch does nothing) |
| Light voice while gaming | Yes | No |
| Close streams/cameras while asleep and reopen them | Yes | No |
| Everything else (effects, media on hover, profiles, filters, game mode) | Yes | Yes |

"Sleep when minimized or covered" uses Chromium's native occlusion; it worked without extra flags in the tested versions. If on your build it only detects minimizing, start Discord with `--enable-features=CalculateNativeWinOcclusion`. The editions share their logic, but Vencord has more call features, which do the most work when sleeping and waking. If you only want to save CPU, BetterDiscord is simpler.

## Desarrollo / Development

**ES:**
- **Vencord:** el código está en `vencord/` y `install.ps1` lo copia a `Vencord\src\userplugins\whisper`. Comprobación de tipos: `pnpm test:ts` en la carpeta de Vencord.
- **BetterDiscord:** `cd betterdiscord && node build.mjs` (usa el esbuild de `../../Vencord/node_modules`, o `ESBUILD=<ruta>`) y luego `node test/selfcheck.mjs`. Los textos y el CSS se copian de la edición de Vencord a `betterdiscord/src`; si cambias algo compartido, hay que actualizar las dos.

**EN:**
- **Vencord:** the source lives in `vencord/` and `install.ps1` copies it to `Vencord\src\userplugins\whisper`. Type-check with `pnpm test:ts` in the Vencord folder.
- **BetterDiscord:** `cd betterdiscord && node build.mjs` (uses the esbuild in `../../Vencord/node_modules`, or `ESBUILD=<path>`), then `node test/selfcheck.mjs`. Texts and CSS are copied from the Vencord edition into `betterdiscord/src`; if you change something shared, update both.

## Apoyo / Support

Ko-fi: https://ko-fi.com/011xuca
Redes / Socials: https://011xuca.github.io/links/

## Licencia / License

GPL-3.0-or-later (ver / see [`LICENSE`](LICENSE)). Las dos ediciones comparten la misma licencia, por eso hay un solo archivo. / Both editions share the same license, hence a single file.
