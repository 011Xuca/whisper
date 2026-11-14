// Fuente unica de la version: el archivo "version" de la raiz. Copia ese numero a lo que no puede leerlo en tiempo de ejecucion.
// Single source of truth for the version: the root "version" file. Copies that number into what cannot read it at run time.
// Usage: node sync-version.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const version = fs.readFileSync(path.join(root, "version"), "utf8").trim();
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`"version" debe ser X.Y.Z / must be X.Y.Z (got "${version}")`);

for (const f of ["vencord/core/meta.ts", "betterdiscord/src/core/meta.ts"]) {
    const p = path.join(root, f);
    const src = fs.readFileSync(p, "utf8");
    const out = src.replace(/(export const VERSION = ")[^"]*(")/, `$1${version}$2`);
    if (out === src && !src.includes(`VERSION = "${version}"`)) throw new Error(`VERSION no encontrado en / not found in ${f}`);
    if (out !== src) fs.writeFileSync(p, out);
}
console.log(`version ${version}`);
