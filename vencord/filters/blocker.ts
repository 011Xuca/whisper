/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FluxDispatcher } from "@webpack/common";

import { settings } from "../core/settings";

// Flux interceptors returning true drop the action before any store sees it (same mechanism as typing.ts).
// Read at call time: @webpack/common exports are still undefined when plugin modules are evaluated (a top-level copy stayed undefined forever).
const dispatcher = () => FluxDispatcher as any;

function block(action: { type: string; resolve?: () => void; }) {
    // promoted Quest delivery: only the ad-style "quest to deliver" is dropped, not the user's own Quests
    if (action.type === "QUESTS_FETCH_QUEST_TO_DELIVER_SUCCESS") return !!settings.store.hideQuestPopups;
    if (action.type === "TRACK" && settings.store.blockTelemetry) {
        action.resolve?.(); // some callers await it (same as Vencord's NoTrack)
        return true;
    }
    return false;
}

export function stopBlocker() {
    const list: unknown[] | undefined = dispatcher()._interceptors;
    if (list?.includes(block)) list.splice(list.indexOf(block), 1);
}

export function syncBlocker() {
    stopBlocker();
    if (settings.store.hideQuestPopups || settings.store.blockTelemetry) dispatcher().addInterceptor?.(block);
}
