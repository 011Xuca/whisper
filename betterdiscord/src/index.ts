/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { stopAvatars, syncAvatars } from "./features/avatars";
import { stopBlocker, syncBlocker } from "./filters/blocker";
import { stopCss, syncCss } from "./features/css";
import { FluxDispatcher } from "./core/discord";
import { stopPrefs, syncPrefs } from "./core/discordPrefs";
import { detectGame, stopFps, syncFps } from "./features/gameMode";
import { stopGifs, syncGifs } from "./features/gifs";
import { stopLazyImages, syncLazyImages } from "./features/lazyImages";
import { stopMutedDrop, syncMutedDrop } from "./filters/mutedDrop";
import { SettingsPanel } from "./ui/panel";
import { stopPresence, syncPresence } from "./filters/presence";
import { stopProfileTabs, syncProfileTabs } from "./features/profileTabs";
import { onSettingChange } from "./core/restart";
import { loadSettings, onSettingsChange } from "./core/settings";
import { startSleep, stopSleep, update as syncSleep } from "./features/sleep";
import { onStateChange, resetState } from "./core/state";
import { stopTitleBar, syncTitleBar } from "./ui/titleBar";
import { stopTyping, syncTyping } from "./filters/typing";

// Same structure as the Vencord index.ts: every module has an idempotent sync() and a stop() that undoes everything.

function safe(name: string, fn: () => unknown) {
    try {
        fn();
    } catch (e) {
        console.error(`[Whisper] ${name} fallo:`, e);
    }
}

function syncState() {
    safe("syncCss", syncCss);
    safe("syncPrefs", syncPrefs);
    safe("syncFps", syncFps);
}

function syncAll() {
    safe("detectGame", detectGame);
    syncState();
    safe("syncAvatars", syncAvatars);
    safe("syncLazyImages", syncLazyImages);
    safe("syncGifs", syncGifs);
    safe("syncTyping", syncTyping);
    safe("syncBlocker", syncBlocker);
    safe("syncMutedDrop", syncMutedDrop);
    safe("syncPresence", syncPresence);
    safe("syncProfileTabs", syncProfileTabs);
    safe("syncSleep", syncSleep);
    safe("syncTitleBar", syncTitleBar);
}

let running = false;

// A preset or reset writes many keys at once: one syncAll per tick is enough.
let queued = false;
function queueSync() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
        queued = false;
        if (running) syncAll();
    });
}

const onGames = () => safe("RUNNING_GAMES_CHANGE", detectGame);
const onOpen = () => safe("CONNECTION_OPEN", syncAll);

module.exports = class Whisper {
    start() {
        running = true;
        safe("loadSettings", loadSettings);
        onSettingsChange(key => {
            if (key !== "prevMotion") queueSync(); // internal bookkeeping: a full re-scan for it would be a CPU spike
            safe("onSettingChange", () => onSettingChange(key));
        });
        safe("onStateChange", () => onStateChange(syncState));
        safe("startSleep", startSleep);
        syncAll();
        safe("subscribe", () => {
            FluxDispatcher.subscribe("RUNNING_GAMES_CHANGE", onGames);
            FluxDispatcher.subscribe("CONNECTION_OPEN", onOpen);
        });
    }

    stop() {
        running = false;
        safe("unsubscribe", () => {
            FluxDispatcher.unsubscribe("RUNNING_GAMES_CHANGE", onGames);
            FluxDispatcher.unsubscribe("CONNECTION_OPEN", onOpen);
        });
        onSettingsChange(() => { });
        safe("stopSleep", stopSleep);
        safe("resetState", resetState);
        safe("stopCss", stopCss);
        safe("stopPrefs", stopPrefs);
        safe("stopFps", stopFps);
        safe("stopAvatars", stopAvatars);
        safe("stopLazyImages", stopLazyImages);
        safe("stopGifs", stopGifs);
        safe("stopTyping", stopTyping);
        safe("stopBlocker", stopBlocker);
        safe("stopMutedDrop", stopMutedDrop);
        safe("stopPresence", stopPresence);
        safe("stopProfileTabs", stopProfileTabs);
        safe("stopTitleBar", stopTitleBar);
    }

    getSettingsPanel() {
        return SettingsPanel;
    }
};
