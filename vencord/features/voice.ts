/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Stop watching streams / others' cameras while asleep, via the same Flux actions Discord's own UI dispatches.
// Voice audio is never touched. My own broadcast and camera are never touched.
import { findStoreLazy } from "@webpack";
import { FluxDispatcher, MediaEngineStore, SelectedChannelStore, UserStore, VoiceStateStore } from "@webpack/common";

import { settings } from "../core/settings";
import { state } from "../core/state";

const StreamRTCConnectionStore = findStoreLazy("StreamRTCConnectionStore");

const closedStreams = new Set<string>();
const disabledCams = new Set<string>();

// Same payload Discord's VideoHealthManager / "Turn off video" use; persist:false = forgotten on restart.
const setCam = (userId: string, off: boolean) => FluxDispatcher.dispatch({
    type: "AUDIO_SET_LOCAL_VIDEO_DISABLED", context: "default", userId,
    videoToggleState: off ? "DISABLED" : "MANUAL_ENABLED", persist: false, isAutomatic: false
});

function closeStreams() {
    const me = UserStore.getCurrentUser()?.id;
    const keys: string[] = StreamRTCConnectionStore.getAllActiveStreamKeys?.() ?? [];
    // stream key = "guild:<guild>:<channel>:<owner>" or "call:<channel>:<owner>"
    for (const streamKey of keys) {
        if (!me || streamKey.endsWith(`:${me}`)) continue;
        closedStreams.add(streamKey);
        FluxDispatcher.dispatch({ type: "STREAM_CLOSE", streamKey, canShowFeedback: false });
        FluxDispatcher.dispatch({ type: "STREAM_STOP", streamKey, appContext: "APP" });
    }
}

export function disableCameras() {
    if (!state.asleep || !settings.store.disableCamerasWhenAsleep) return;
    const me = UserStore.getCurrentUser()?.id;
    const channelId = SelectedChannelStore.getVoiceChannelId();
    if (!me || !channelId) return;
    for (const [userId, vs] of Object.entries(VoiceStateStore.getVoiceStatesForChannel(channelId) ?? {})) {
        if (userId === me || !vs.selfVideo) continue;
        if ((MediaEngineStore as any).isLocalVideoDisabled?.(userId)) continue; // already off (by us or the user)
        disabledCams.add(userId);
        setCam(userId, true);
    }
}

function reopen() {
    closedStreams.forEach(streamKey => FluxDispatcher.dispatch({ type: "STREAM_WATCH", streamKey, allowMultiple: true }));
    closedStreams.clear();
    restoreCams();
}

function restoreCams() {
    disabledCams.forEach(id => setCam(id, false));
    disabledCams.clear();
}

let wasAsleep = false;

export function syncVoice() {
    if (state.asleep === wasAsleep) return;
    wasAsleep = state.asleep;
    if (state.asleep) {
        if (settings.store.closeStreamsWhenAsleep) closeStreams();
        disableCameras();
    } else if (settings.store.reopenOnWake) reopen();
    else closedStreams.clear(); // user reopens manually
}

export function stopVoice() {
    wasAsleep = false;
    closedStreams.clear();
    restoreCams(); // cameras are state we changed, so give them back; streams are not reopened
}
