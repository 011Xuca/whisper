/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { SettingsStore } from "@api/Settings";
import definePlugin from "@utils/types";

import { About } from "./ui/About";
import { stopAvatars, syncAvatars } from "./features/avatars";
import { stopBlocker, syncBlocker } from "./filters/blocker";
import { stopCss, syncCss } from "./features/css";
import { stopPrefs, syncPrefs } from "./core/discordPrefs";
import { stopGifs, syncGifs } from "./features/gifs";
import { detectGame, stopFps, syncFps } from "./features/gameMode";
import { t } from "./core/i18n";
import { stopLazyImages, syncLazyImages } from "./features/lazyImages";
import { stopMutedDrop, syncMutedDrop } from "./filters/mutedDrop";
import { stopPresence, syncPresence } from "./filters/presence";
import { stopProfileTabs, syncProfileTabs } from "./features/profileTabs";
import { onSettingChange } from "./core/restart";
import { settings } from "./core/settings";
import { startSleep, stopSleep, update as syncSleep } from "./features/sleep";
import { onStateChange, resetState } from "./core/state";
import { stopTitleBar, syncTitleBar } from "./ui/titleBar";
import { stopTyping, syncTyping } from "./filters/typing";
import { stopUpdater, syncUpdater } from "./core/updater";
import { disableCameras, stopVoice, syncVoice } from "./features/voice";
import { onNoiseChange, stopVoiceLite, syncVoiceLite } from "./features/voiceLite";

// Every module exposes an idempotent sync() (apply current settings/state) and a stop() that undoes everything.
// Nothing here unmounts React, so the voice connection is never affected.

/** Runs one module; a failure is logged with the module name and never propagates. */
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
    safe("syncVoice", syncVoice);
    safe("syncVoiceLite", syncVoiceLite);
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
    safe("syncUpdater", syncUpdater);
}

// Internal bookkeeping keys change in the middle of a call (game start, noise level, update notice): re-scanning the whole DOM for them is a CPU spike.
const INTERNAL = ["voiceLiteSaved", "prevMotion", "notifiedVersion"];
function onChange(_: unknown, path: string) {
    if (!INTERNAL.includes(path.split(".").pop() ?? "")) syncAll();
}

export default definePlugin({
    name: "Whisper",
    description: t("Reduce el CPU/RAM de Discord: duerme la UI al minimizar, modo juego, sin animaciones/efectos, media al pasar el mouse, personalizacion de perfiles configurable y ahorro en llamadas, sin cortar nunca la voz", "Cuts Discord's CPU/RAM use: sleeps the UI when minimized, game mode, no animations/effects, media on hover, configurable profile personalization and call savings, never cutting voice"),
    authors: [{ name: "xuca", id: 0n }],
    settings,
    settingsAboutComponent: About,

    flux: {
        RUNNING_GAMES_CHANGE: () => safe("RUNNING_GAMES_CHANGE", detectGame),
        CONNECTION_OPEN: () => safe("CONNECTION_OPEN", syncAll), // current user id (for the own-preview CSS) is known from here on
        VOICE_STATE_UPDATES: () => { safe("VOICE_STATE_UPDATES", disableCameras); safe("VOICE_STATE_UPDATES", syncVoiceLite); }, // cameras turned on while asleep; call left/joined
        VOICE_CHANNEL_SELECT: () => safe("VOICE_CHANNEL_SELECT", syncVoiceLite),
        AUDIO_SET_NOISE_CANCELLATION: (e: any) => safe("AUDIO_SET_NOISE_CANCELLATION", () => onNoiseChange(e)),
        AUDIO_SET_NOISE_SUPPRESSION: (e: any) => safe("AUDIO_SET_NOISE_SUPPRESSION", () => onNoiseChange(e)),
    },

    start() {
        safe("onStateChange", () => onStateChange(syncState));
        safe("startSleep", startSleep);
        syncAll();
        safe("addPrefixChangeListener", () => SettingsStore.addPrefixChangeListener("plugins.Whisper", onChange));
        safe("addRestartListener", () => SettingsStore.addPrefixChangeListener("plugins.Whisper", onSettingChange));
    },

    stop() {
        safe("removePrefixChangeListener", () => SettingsStore.removePrefixChangeListener("plugins.Whisper", onChange));
        safe("removeRestartListener", () => SettingsStore.removePrefixChangeListener("plugins.Whisper", onSettingChange));
        safe("stopSleep", stopSleep);
        safe("resetState", resetState);
        safe("stopCss", stopCss);
        safe("stopPrefs", stopPrefs);
        safe("stopFps", stopFps);
        safe("stopVoice", stopVoice);
        safe("stopVoiceLite", stopVoiceLite);
        safe("stopAvatars", stopAvatars);
        safe("stopLazyImages", stopLazyImages);
        safe("stopGifs", stopGifs);
        safe("stopTyping", stopTyping);
        safe("stopBlocker", stopBlocker);
        safe("stopMutedDrop", stopMutedDrop);
        safe("stopPresence", stopPresence);
        safe("stopProfileTabs", stopProfileTabs);
        safe("stopTitleBar", stopTitleBar);
        safe("stopUpdater", stopUpdater);
    }
});
