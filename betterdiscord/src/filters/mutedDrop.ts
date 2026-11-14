/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChannelMessages, ChannelStore, FluxDispatcher, SelectedChannelStore, UserGuildSettingsStore, UserStore } from "../core/discord";

import { settings } from "../core/settings";

// Same pattern as typing.ts: an interceptor returning true drops the action before any store sees it.
const TYPES = new Set(["MESSAGE_CREATE", "MESSAGE_UPDATE", "TYPING_START"]);
// Discord's per-channel message cache (MessageStore's ChannelMessages); clear(id) makes the next open refetch (verified live).
// Read at call time: @webpack/common exports are still undefined when plugin modules are evaluated (a top-level copy stayed undefined forever).
const dispatcher = () => FluxDispatcher as any;

function isMuted(channelId: string, guildId: string | null | undefined) {
    if (!guildId) return !!UserGuildSettingsStore.isChannelMuted(null, channelId);
    return !!UserGuildSettingsStore.isGuildOrCategoryOrChannelMuted(guildId, channelId);
}

function shouldDrop(action: any): boolean {
    const { message } = action;
    const channelId: string | undefined = action.channelId ?? message?.channel_id;
    if (!channelId || channelId === SelectedChannelStore.getChannelId()) return false;

    const me = UserStore.getCurrentUser()?.id;
    if (!me) return false;
    if (message) {
        // incomplete payload (e.g. partial MESSAGE_UPDATE): can't decide, so never drop
        if (!message.author?.id || !Array.isArray(message.mentions)) return false;
        if (message.author.id === me) return false;
        if (message.mentions.some((u: any) => (u?.id ?? u) === me)) return false;
        if (message.referenced_message?.author?.id === me) return false;
    } else if (!action.userId || action.userId === me) return false;

    const guildId = ChannelStore.getChannel(channelId)?.guild_id ?? action.guildId ?? message?.guild_id;
    return isMuted(channelId, guildId);
}

// Any failure means "don't know": never drop.
const block = (action: any) => {
    if (!TYPES.has(action.type)) return false;
    try {
        if (!shouldDrop(action)) return false;
        // A channel visited earlier keeps a cache that would silently miss the dropped message: drop the cache too (frees it, reopening refetches).
        // shortcut: a muted thread open in the side panel is not the selected channel, so it is also cleared and goes stale; exclude it if that bites.
        if (action.message) ChannelMessages.clear(action.channelId ?? action.message.channel_id);
        return true;
    } catch {
        return false;
    }
};

export function stopMutedDrop() {
    const list: unknown[] | undefined = dispatcher()._interceptors;
    if (list?.includes(block)) list.splice(list.indexOf(block), 1);
}

export function syncMutedDrop() {
    stopMutedDrop();
    if (settings.store.dropMutedMessages) dispatcher().addInterceptor?.(block);
}
