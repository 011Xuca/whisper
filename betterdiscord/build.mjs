// Bundles src/ into one self-contained Whisper.plugin.js (BetterDiscord format: meta block + module.exports).
// Usage: node build.mjs   (uses the esbuild from ../../Vencord/node_modules; override with ESBUILD=<path to esbuild package>)
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const esbuild = require(process.env.ESBUILD ?? path.join(dir, "..", "..", "Vencord", "node_modules", "esbuild"));

const version = fs.readFileSync(path.join(dir, "..", "version"), "utf8").trim(); // single source: root "version" file

const meta = `/**
 * @name Whisper
 * @author xuca
 * @description Cuts Discord's CPU/RAM use: sleeps the UI when minimized, game mode, no animations/effects, media on hover and configurable profile personalization, never touching call audio. / Reduce el CPU/RAM de Discord: duerme la UI al minimizar, modo juego, sin animaciones/efectos, media al pasar el mouse y personalizacion de perfiles configurable, sin tocar nunca el audio de las llamadas.
 * @version ${version}
 * @authorLink https://011xuca.github.io/links/
 * @donate https://ko-fi.com/011xuca
 * @website https://github.com/011Xuca/whisper
 * @source https://github.com/011Xuca/whisper
 */
/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Built file: edit src/ and run "node build.mjs".
 */`;

await esbuild.build({
    entryPoints: [path.join(dir, "src", "index.ts")],
    outfile: path.join(dir, "Whisper.plugin.js"),
    bundle: true,
    format: "cjs",
    platform: "browser",
    target: "es2022",
    charset: "utf8",
    legalComments: "none",
    banner: { js: meta },
    logLevel: "info",
});
