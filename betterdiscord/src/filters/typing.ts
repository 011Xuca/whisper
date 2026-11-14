/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FluxDispatcher } from "../core/discord";

import { settings } from "../core/settings";

// Flux interceptors returning true drop the action before any store sees it, so typing UI never re-renders.
const block = (action: { type: string; }) => action.type === "TYPING_START";
// Read at call time: @webpack/common exports are still undefined when plugin modules are evaluated (a top-level copy stayed undefined forever).
const dispatcher = () => FluxDispatcher as any;

export function stopTyping() {
    const list: unknown[] | undefined = dispatcher()._interceptors;
    if (list?.includes(block)) list.splice(list.indexOf(block), 1);
}

export function syncTyping() {
    stopTyping();
    if (settings.store.blockTypingEvents) dispatcher().addInterceptor?.(block);
}
