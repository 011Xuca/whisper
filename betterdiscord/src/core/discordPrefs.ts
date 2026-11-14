/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Uses Discord's own non-synced mechanisms (the same ones its Reduced Motion / Game Mode use),
// so nothing is written to your account settings.
import { AccessibilityStore, FluxDispatcher, OverridesStore } from "./discord";

import { on, settings } from "./settings";
import { state } from "./state";

// Existing reason key, so Discord's settings UI can label the locked setting.
const REASON = "REDUCED_MOTION";
const ANIMATE_ON_INTERACTION = 1;

const ours = new Map<string, object>();
let prevMotion: string | undefined;

function wanted() {
    const g = state.gaming;
    const w: Record<string, unknown> = {};
    if (on("gifsOnHover") || g) w.gifAutoPlay = false;
    if (on("staticEmojis") || g) w.animateEmoji = false;
    if (on("staticStickers") || g) w.animateStickers = ANIMATE_ON_INTERACTION;
    return w;
}

function clear(keys: string[]) {
    // only clear overrides that are still the exact objects we applied
    const mine = keys.filter(k => OverridesStore.getOverride(k) === ours.get(k));
    keys.forEach(k => ours.delete(k));
    if (mine.length) FluxDispatcher.dispatch({ type: "USER_SETTINGS_OVERRIDE_CLEAR", settings: mine });
}

// Persisted in a hidden setting (Discord removes localStorage) so a restart between enabling and disabling can't leave Discord stuck on "reduce".
const saved = {
    get: () => settings.store.prevMotion || undefined,
    set: (v?: string) => { settings.store.prevMotion = v ?? ""; }
};
const setReduced = (v: string) => FluxDispatcher.dispatch({ type: "ACCESSIBILITY_SET_PREFERS_REDUCED_MOTION", prefersReducedMotion: v });

function setMotion(reduce: boolean) {
    const raw = AccessibilityStore.rawPrefersReducedMotion;
    if (reduce) {
        if (prevMotion === undefined) {
            prevMotion = saved.get() ?? (raw !== "reduce" ? raw : undefined);
            saved.set(prevMotion);
        }
        if (raw !== "reduce") setReduced("reduce");
    } else {
        const p = prevMotion ?? saved.get();
        if (p === undefined) return;
        setReduced(p);
        prevMotion = undefined;
        saved.set(undefined);
    }
}

export function syncPrefs() {
    const w = wanted();
    const apply: Record<string, object> = {};
    for (const [key, value] of Object.entries(w)) {
        const cur = OverridesStore.getOverride(key);
        if (cur != null && cur === ours.get(key)) continue;
        ours.delete(key);
        if (cur != null) continue; // someone else (e.g. Discord's Reduced Motion) already overrides it
        ours.set(key, apply[key] = { value, reasonKey: REASON });
    }
    if (Object.keys(apply).length) FluxDispatcher.dispatch({ type: "USER_SETTINGS_OVERRIDE_APPLY", settings: apply });
    clear([...ours.keys()].filter(k => !(k in w)));

    setMotion(on("reducedMotion") || state.gaming);
}

export function stopPrefs() {
    clear([...ours.keys()]);
    setMotion(false);
}
