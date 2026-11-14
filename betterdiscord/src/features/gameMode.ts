/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IS_DISCORD_DESKTOP, RunningGameStore } from "../core/discord";

import { settings } from "../core/settings";
import { setState, state } from "../core/state";

// Same filter Discord's own Game Mode uses: visible running games that are not launchers.
export function detectGame() {
    const was = state.gaming;
    setState("gaming", settings.store.gameMode && !!RunningGameStore?.getVisibleRunningGames?.().some(g => !g.isLauncher));
    // once per game start: hand Blink's caches back to the OS while the game needs RAM (measured -26 MB renderer private bytes)
    if (!was && state.gaming && IS_DISCORD_DESKTOP) try { DiscordNative.processUtils?.purgeMemory?.(); } catch { }
}

let fps = 0;

function setFps(value: number) {
    if (value === fps) return;
    fps = value;
    // DiscordNative.window.setFrameRate -> webContents.setMaxFPS (verified in discord_desktop_core). 0 = uncapped. Missing on web/old builds -> no-op.
    if (IS_DISCORD_DESKTOP) DiscordNative.window?.setFrameRate?.(null, value);
}

export function syncFps() {
    const limit = Math.max(0, settings.store.fpsLimit);
    setFps(limit && (state.asleep || (state.gaming && !state.focused)) ? limit : 0);
}

export const stopFps = () => setFps(0);
