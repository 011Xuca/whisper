/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "../core/settings";
import { setState, state } from "../core/state";

let timer: ReturnType<typeof setTimeout> | undefined;
let watchdog: ReturnType<typeof setInterval> | undefined;
let lastWake = 0;

const nativeWin = (window as any).DiscordNative?.window;

const shouldSleep = () => document.hidden;

export function update() {
    clearTimeout(timer);
    // Discord sets backgroundThrottling:false, which pins document.hidden to false even when minimized/covered; re-enable it while sleep is on.
    nativeWin?.setBackgroundThrottling?.(!!settings.store.hideWhenAsleep);
    setState("focused", document.hasFocus());
    // Sleep is opt-in: with hideWhenAsleep off the asleep state (and its class) is never set, whatever the focus does.
    if (!settings.store.hideWhenAsleep || !shouldSleep()) return setState("asleep", false);
    timer = setTimeout(() => {
        // re-check: focus may have come back during the delay
        if (!shouldSleep()) return;
        setState("asleep", true);
        // frees Blink's caches (images/fonts/decoded data); the DOM and React state stay, so it is a small saving
        try { (window as any).DiscordNative?.processUtils?.purgeMemory?.(); } catch { }
    }, Math.max(0, settings.store.delaySeconds) * 1000);
}

// Safety net: if focus/visibility events were missed, any user interaction (or the 2s watchdog) wakes the UI.
const INTERACTION = ["pointerdown", "keydown", "mousemove"] as const;
const opts = { passive: true, capture: true } as const;

function wakeIfNeeded() {
    if (!state.asleep || shouldSleep()) return;
    clearTimeout(timer);
    setState("asleep", false);
}

function onInteraction() {
    const now = Date.now();
    if (now - lastWake < 500 || !state.asleep) return;
    wakeIfNeeded();
    if (!state.asleep) lastWake = now; // only throttle after an actual wake
}

export function startSleep() {
    stopSleep(); // idempotent: never leave a second interval/listener set behind
    document.addEventListener("visibilitychange", update);
    window.addEventListener("blur", update);
    window.addEventListener("focus", update);
    for (const e of INTERACTION) window.addEventListener(e, onInteraction, opts);
    watchdog = setInterval(wakeIfNeeded, 2000);
    update();
}

export function stopSleep() {
    nativeWin?.setBackgroundThrottling?.(false); // Discord's default
    clearTimeout(timer);
    clearInterval(watchdog);
    document.removeEventListener("visibilitychange", update);
    window.removeEventListener("blur", update);
    window.removeEventListener("focus", update);
    for (const e of INTERACTION) window.removeEventListener(e, onInteraction, opts);
}
