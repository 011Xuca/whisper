/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Lighter noise suppression (Krisp -> Standard/None) while gaming in a call. Only the MIC processing changes; received audio is never touched.
// Discord persists these actions to its MediaEngineStore settings (localStorage) and has no persist:false for them,
// so the original value is saved in the hidden voiceLiteSaved setting BEFORE changing it and restored on the next sync
// (game closed, call left, setting off, stop(), or the next start if Discord was killed meanwhile).
import { FluxDispatcher, MediaEngineStore, SelectedChannelStore } from "@webpack/common";

import { settings } from "../core/settings";
import { state } from "../core/state";

// "<noiseCancellation><noiseSuppression>" as Discord stores them: "10" = Krisp, "01" = Standard, "00" = None
type Pair = string;

function current(): Pair | null {
    const s = (MediaEngineStore as any).getSettings?.();
    return s ? `${+!!s.noiseCancellation}${+!!s.noiseSuppression}` : null;
}

const level = (p: Pair) => p[0] === "1" ? 2 : p[1] === "1" ? 1 : 0;

// Same two actions (same order) Discord's own setNoiseCancellation dispatches; `whisper` marks them as ours for onNoiseChange.
function apply(p: Pair) {
    FluxDispatcher.dispatch({ type: "AUDIO_SET_NOISE_CANCELLATION", enabled: p[0] === "1", whisper: true });
    FluxDispatcher.dispatch({ type: "AUDIO_SET_NOISE_SUPPRESSION", enabled: p[1] === "1", whisper: true });
}

let overridden = false; // user picked a level by hand while we were active: leave it alone until the next activation

function restore() {
    const saved = settings.store.voiceLiteSaved;
    if (!saved || !current()) return; // store not ready yet (early start): keep it for the next sync
    if (/^[01]{2}$/.test(saved)) apply(saved);
    settings.store.voiceLiteSaved = "";
}

export function syncVoiceLite() {
    const s = settings.store;
    if (!s.voiceLite || !state.gaming || !SelectedChannelStore.getVoiceChannelId()) {
        overridden = false;
        restore();
        return;
    }
    if (s.voiceLiteSaved || overridden) return; // already lowered (a voiceLiteMode change applies on the next activation)
    const cur = current();
    const target = s.voiceLiteMode === "none" ? "00" : "01";
    if (!cur || level(cur) <= level(target)) return;
    s.voiceLiteSaved = cur; // saved first so a crash can never lose the original
    apply(target);
}

/** AUDIO_SET_NOISE_* handler: a change not made by us (Discord UI, RPC) while lowered wins and is never overwritten. */
export function onNoiseChange(e: { whisper?: boolean; }) {
    if (e.whisper || !settings.store.voiceLiteSaved) return;
    overridden = true;
    settings.store.voiceLiteSaved = "";
}

export function stopVoiceLite() {
    overridden = false;
    restore();
}
