/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Same keys and defaults as the Vencord edition's settings.ts, minus what is not ported (voice.ts, voiceLite.ts, updater.ts).
// Persisted per key with BdApi.Data (file: BetterDiscord/plugins/Whisper.config.json).
declare const BdApi: any;

const DEFAULTS = {
    hideWhenAsleep: false, delaySeconds: 5,
    gameMode: true, fpsLimit: 0,
    ecoMode: false,
    noAnimations: false, reducedMotion: false, noBlur: false, noShadows: false,
    gifsOnHover: false, staticEmojis: false, staticStickers: false, hideEmbeds: false, lazyImages: false, blurImages: false, blurAmount: 12, lazyMessages: false,
    hideTyping: false, blockTypingEvents: false,
    dropMutedMessages: false, dropPresence: false,
    noPersonalization: false, hideProfileEffects: false, hideAvatarDecorations: false, hideNameplates: false, plainNames: false, hideBanners: false,
    plainProfileThemes: false, hideProfileTabs: false, hideMutualTabs: false, hideProfileBadges: false, avatarsOnHover: false, defaultAvatars: false,
    hideActiveNow: false, hideMemberList: false, systemFonts: false, hideGuildTags: false, plainRoleColors: false,
    hideOwnPreview: false, voiceVisuals: false,
    hideQuestPopups: false, hideQuestsEntry: false, hideShopNitro: false, hidePromoBanners: false,
    blockTelemetry: false,
    customLogo: true, hideGroupIcons: false,
    prevMotion: "",
};
type Key = keyof typeof DEFAULTS;

const NAME = "Whisper";
const values: Record<string, unknown> = {};
let listener: (key: string) => void = () => { };

export function loadSettings() {
    for (const [key, d] of Object.entries(DEFAULTS)) {
        const v = BdApi.Data.load(NAME, key);
        values[key] = typeof v === typeof d ? v : d; // wrong type or missing (first run) -> default
    }
}
export const onSettingsChange = (cb: (key: string) => void) => { listener = cb; };

export const settings = {
    // same shape as the other edition (def[key].default), so presets.ts can stay a verbatim copy
    def: Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, { default: d }])) as Record<Key, { default: unknown; }>,
    store: new Proxy(values, {
        get: (t, key: string) => key in t ? t[key] : (DEFAULTS as any)[key],
        set(t, key: string, value) {
            if (!(key in DEFAULTS) || t[key] === value) return true;
            t[key] = value;
            BdApi.Data.save(NAME, key, value);
            listener(key);
            return true;
        },
    }) as any as typeof DEFAULTS,
};

export const PERSONALIZATION = ["hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "hideBanners", "plainProfileThemes", "avatarsOnHover", "hideGuildTags", "plainRoleColors", "hideProfileBadges"] as const;
// Forced on by ecoMode (editable list)
export const ECO = ["noAnimations", "reducedMotion", "noBlur", "gifsOnHover", "staticEmojis", "staticStickers", "avatarsOnHover", "hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "voiceVisuals", "hideOwnPreview"] as const;

/** Setting value with the master switches (noPersonalization, ecoMode) applied. */
export const on = (key: Key) => !!settings.store[key]
    || (!!settings.store.noPersonalization && (PERSONALIZATION as readonly string[]).includes(key))
    || (!!settings.store.ecoMode && (ECO as readonly string[]).includes(key));

/** Every setting back to its default. */
export function resetDefaults() {
    for (const [key, d] of Object.entries(DEFAULTS)) (settings.store as any)[key] = d;
}
