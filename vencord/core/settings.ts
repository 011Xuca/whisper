/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { t } from "./i18n";

// All options are hidden from Vencord's generic list: the panel in SettingsPanel.tsx renders them (titles/texts in settingsMeta.ts)
const bool = (d: boolean) => ({ type: OptionType.BOOLEAN as const, description: "", default: d, hidden: true });

export const settings = definePluginSettings({
    // --- Sleep (original behaviour) ---
    hideWhenAsleep: bool(false),
    delaySeconds: { hidden: true, type: OptionType.NUMBER, description: "", default: 5 },

    // --- Game mode ---
    gameMode: bool(true),
    fpsLimit: { hidden: true, type: OptionType.NUMBER, description: "", default: 0 },

    ecoMode: bool(false),
    // --- Motion / effects ---
    noAnimations: bool(false),
    reducedMotion: bool(false),
    noBlur: bool(false),
    noShadows: bool(false),

    // --- Chat media ---
    gifsOnHover: bool(false),
    staticEmojis: bool(false),
    staticStickers: bool(false),
    hideEmbeds: bool(false),
    lazyImages: bool(false),
    blurImages: bool(false),
    blurAmount: { hidden: true, type: OptionType.NUMBER, description: "", default: 12 },
    lazyMessages: bool(false),

    // --- Typing ---
    hideTyping: bool(false),
    blockTypingEvents: bool(false),

    dropMutedMessages: bool(false),
    dropPresence: bool(false),

    // --- Personalization ---
    noPersonalization: bool(false),
    hideProfileEffects: bool(false),
    hideAvatarDecorations: bool(false),
    hideNameplates: bool(false),
    plainNames: bool(false),
    hideBanners: bool(false),
    plainProfileThemes: bool(false),
    hideProfileTabs: bool(false),
    hideMutualTabs: bool(false),
    hideProfileBadges: bool(false),
    avatarsOnHover: bool(false),
    defaultAvatars: bool(false),

    // --- Interface ---
    hideActiveNow: bool(false),
    hideMemberList: bool(false),
    systemFonts: bool(false),
    hideGuildTags: bool(false),
    plainRoleColors: bool(false),

    // --- Voice / calls (audio is never touched) ---
    hideOwnPreview: bool(false),
    voiceVisuals: bool(false),
    closeStreamsWhenAsleep: bool(false),
    disableCamerasWhenAsleep: bool(false),
    reopenOnWake: bool(false),
    voiceLite: bool(false),
    voiceLiteMode: { hidden: true, type: OptionType.SELECT, description: "", options: [{ label: t("Estandar", "Standard"), value: "standard", default: true }, { label: t("Ninguna", "None"), value: "none" }] },
    // Original noise suppression ("<krisp><standard>") while voiceLite has it lowered; "" = nothing to restore. Must stay after voiceLite (reset order).
    voiceLiteSaved: { type: OptionType.STRING, description: "", default: "", hidden: true },

    // --- Promos / ads (all CSS or Flux, nothing is patched) ---
    hideQuestPopups: bool(false),
    hideQuestsEntry: bool(false),
    hideShopNitro: bool(false),
    hidePromoBanners: bool(false),

    // --- Diagnostics ---
    blockTelemetry: bool(false),

    // --- Branding (the only two toggles that are on by default besides gameMode) ---
    customLogo: bool(true),
    hideGroupIcons: bool(false),

    // --- Updates ---
    checkUpdates: bool(false),
    prevMotion: { type: OptionType.STRING, description: "", default: "", hidden: true },
    notifiedVersion: { type: OptionType.STRING, description: "", default: "", hidden: true },
});

export const PERSONALIZATION = ["hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "hideBanners", "plainProfileThemes", "avatarsOnHover", "hideGuildTags", "plainRoleColors", "hideProfileBadges"] as const;
// Forced on by ecoMode (editable list)
export const ECO = ["noAnimations", "reducedMotion", "noBlur", "gifsOnHover", "staticEmojis", "staticStickers", "avatarsOnHover", "hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "voiceVisuals", "hideOwnPreview"] as const;
type Key = keyof typeof settings.store;

/** Setting value with the master switches (noPersonalization, ecoMode) applied. */
export const on = (key: Key) => !!settings.store[key]
    || (!!settings.store.noPersonalization && (PERSONALIZATION as readonly string[]).includes(key))
    || (!!settings.store.ecoMode && (ECO as readonly string[]).includes(key));
