/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Discord internals through BdApi.Webpack, resolved on first use (never at load time) and cached once found.
// Each export is a proxy so the shared modules can keep calling e.g. UserStore.getCurrentUser() unchanged;
// a missing module reads as undefined props, so callers' ?. chains and try/catch turn it into a no-op.
declare const BdApi: any;

function lazy(find: () => any): any {
    let cached: any;
    const target = () => cached ??= find() ?? undefined;
    return new Proxy({}, {
        get(_, key) {
            const t = target();
            const v = t?.[key];
            return typeof v === "function" ? v.bind(t) : v;
        },
        set(_, key, value) {
            const t = target();
            if (t) t[key] = value;
            return true;
        },
    });
}

const store = (name: string) => lazy(() => BdApi.Webpack.getStore(name));

// Same filter BetterDiscord uses for its own Dispatcher (modules/discordmodules.ts).
export const FluxDispatcher = lazy(() => BdApi.Webpack.getByKeys("dispatch", "subscribe", "register", { searchExports: true }));
// MessageStore's ChannelMessages class (same props the Vencord edition finds).
export const ChannelMessages = lazy(() => BdApi.Webpack.getByKeys("getOrCreate", "clearCache", "commit", { searchExports: true }));
export const UserStore = store("UserStore");
export const ChannelStore = store("ChannelStore");
export const SelectedChannelStore = store("SelectedChannelStore");
export const UserGuildSettingsStore = store("UserGuildSettingsStore");
export const RunningGameStore = store("RunningGameStore");
export const AccessibilityStore = store("AccessibilityStore");
export const OverridesStore = store("UserSettingsOverridesStore");

export const IS_DISCORD_DESKTOP = typeof (window as any).DiscordNative !== "undefined";
