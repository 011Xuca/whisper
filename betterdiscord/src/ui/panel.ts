/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Same categories, titles and texts as the Vencord panel (settingsMeta.ts), rendered with BdApi.UI.buildSettingsPanel.
// Rows whose settings are not ported (voice.ts, voiceLite.ts, updater.ts) are left out.
import { t } from "../core/i18n";
import { KOFI, SOCIALS, VERSION } from "../core/meta";
import { applyPreset, PRESETS } from "./presets";
import { restartDiscord } from "../core/restart";
import { ECO, PERSONALIZATION, resetDefaults, settings } from "../core/settings";
import { CATEGORIES, META, Meta } from "./settingsMeta";

declare const BdApi: any;

const MASTERS: { key: string; list: readonly string[]; name: string; }[] = [
    { key: "ecoMode", list: ECO, name: t("Ahorro maximo", "Maximum savings") },
    { key: "noPersonalization", list: PERSONALIZATION, name: t("Sin personalizacion", "No personalization") },
];
const MAX: Record<string, number> = { delaySeconds: 3600, fpsLimit: 240, blurAmount: 50 };

const store = settings.store as Record<string, any>;
const ported = (k: string) => k in settings.def;
const forcedBy = (k: string) => MASTERS.find(x => store[x.key] && x.list.includes(k));
const drawers: Record<string, boolean> = {}; // open categories survive the panel re-render
const RESET_BODY = t("Todos los ajustes de Whisper volveran a su valor por defecto.", "All Whisper settings will go back to their defaults.");

function row(m: Meta, refresh: () => void): any {
    if (m.keys) {
        const keys = m.keys.filter(ported);
        if (!keys.length) return null;
        return {
            type: "switch", id: m.key, name: m.title, note: m.desc,
            value: keys.every(k => forcedBy(k) || store[k]), disabled: keys.every(k => forcedBy(k)),
            onChange: (v: boolean) => { for (const k of keys) store[k] = v; refresh(); },
        };
    }
    if (!ported(m.key)) return null;
    if (m.type === "bool") {
        const master = forcedBy(m.key);
        return {
            type: "switch", id: m.key, name: m.title, note: m.desc + (master ? ` (${t("forzado por", "forced by")} ${master.name})` : ""),
            value: !!master || !!store[m.key], disabled: !!master,
            onChange: (v: boolean) => { store[m.key] = v; if (MASTERS.some(x => x.key === m.key)) refresh(); },
        };
    }
    if (m.type === "number") {
        const max = MAX[m.key] ?? 9999;
        return {
            type: "number", id: m.key, name: m.title, note: m.desc, value: store[m.key], min: 0, max, step: 1,
            onChange: (v: number) => { store[m.key] = Math.min(max, Math.max(0, Number(v) || 0)); },
        };
    }
    return null; // "select" and "note" rows only exist for the unported voice features
}

const button = (id: string, name: string, note: string, label: string, onClick: () => void, color?: string) =>
    ({ type: "button", id, name, note, children: label, onClick, ...(color ? { color } : {}) });

const confirm = (title: string, body: string, ok: string, onConfirm: () => void) =>
    BdApi.UI.showConfirmationModal(title, body, { confirmText: ok, cancelText: t("Cancelar", "Cancel"), onConfirm });

const open = (url: string) => window.open(url, "_blank", "noopener"); // Discord desktop hands https links to the default browser

function build(refresh: () => void) {
    const top: any[] = [];
    if (KOFI.startsWith("https://")) top.push(button("kofi", `Whisper v${VERSION}`, t("Apoyar en Ko-fi", "Support on Ko-fi"), "Ko-fi", () => open(KOFI)));
    if (SOCIALS.startsWith("https://")) top.push(button("socials", t("Mis redes", "My socials"), SOCIALS, t("Redes", "Socials"), () => open(SOCIALS)));
    const resetTitle = t("Restablecer valores por defecto", "Reset to defaults");
    const presets = {
        type: "category", id: "presets", name: t("Perfiles", "Presets"), collapsible: true, shown: drawers.presets ?? true,
        settings: [
            ...PRESETS.map(p => button(`preset-${p.id}`, p.name, p.desc, t("Aplicar", "Apply"),
                () => confirm(p.name, p.desc, t("Aplicar", "Apply"), () => { applyPreset(p); refresh(); }))),
            button("restart", t("Reiniciar Discord", "Restart Discord"), "", t("Reiniciar", "Restart"), restartDiscord),
            button("reset", resetTitle, RESET_BODY, t("Restablecer", "Reset"),
                () => confirm(resetTitle, RESET_BODY, t("Restablecer", "Reset"), () => { resetDefaults(); refresh(); }), "bd-button-color-red"),
        ],
    };
    const cats = CATEGORIES.map(c => ({
        type: "category", id: c.id, name: `${c.icon} ${c.title}`, collapsible: true, shown: drawers[c.id] ?? false,
        settings: META.filter(m => m.cat === c.id).map(m => row(m, refresh)).filter(Boolean),
    })).filter(c => c.settings.length);
    return [...top, presets, ...cats];
}

/** Function component: a group switch, master switch, preset or reset remounts the builder so forced/disabled rows are redrawn. */
export function SettingsPanel() {
    const { useState, createElement } = BdApi.React;
    const [rev, setRev] = useState(0);
    const refresh = () => setRev((r: number) => r + 1);
    return createElement("div", { key: rev }, BdApi.UI.buildSettingsPanel({
        settings: build(refresh),
        getDrawerState: (id: string, def: boolean) => drawers[id] ?? def,
        onDrawerToggle: (id: string, shown: boolean) => { drawers[id] = shown; },
    }));
}
