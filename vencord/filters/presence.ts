/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FluxDispatcher, UserStore } from "@webpack/common";

import { settings } from "../core/settings";

// Same pattern as typing.ts. The gateway batches PRESENCE_UPDATE into PRESENCE_UPDATES { updates: [{ user: { id }, status, ... }] }.
// PRESENCES_REPLACE (initial friends sync) and presences inside GUILD_CREATE are deliberately left alone.
// Read at call time: @webpack/common exports are still undefined when plugin modules are evaluated (a top-level copy stayed undefined forever).
const dispatcher = () => FluxDispatcher as any;

// A batch is dropped only if every update names a user other than me; any doubt or failure keeps it.
const block = (action: { type: string; updates?: Array<{ user?: { id?: string; }; }>; }) => {
    if (action.type !== "PRESENCE_UPDATES") return false;
    try {
        const me = UserStore.getCurrentUser()?.id;
        const { updates } = action;
        return !!me && Array.isArray(updates) && updates.length > 0 && updates.every(u => !!u?.user?.id && u.user.id !== me);
    } catch {
        return false;
    }
};

export function stopPresence() {
    const list: unknown[] | undefined = dispatcher()._interceptors;
    if (list?.includes(block)) list.splice(list.indexOf(block), 1);
}

export function syncPresence() {
    stopPresence();
    if (settings.store.dropPresence) dispatcher().addInterceptor?.(block);
}
