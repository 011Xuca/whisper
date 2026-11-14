/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { t } from "./i18n";

declare const BdApi: any;

// Settings whose effect can leave residue until restart (Discord setting overrides, rewritten image URLs already
// cached, Flux interceptors). Everything else applies live. Same list as the Vencord edition.
const RESTART_KEYS = ["ecoMode", "reducedMotion", "gifsOnHover", "staticEmojis", "staticStickers", "avatarsOnHover", "defaultAvatars", "blockTypingEvents", "dropMutedMessages", "hideQuestPopups", "blockTelemetry"];

let asked = false; // in memory only: one prompt per session

export function restartDiscord() {
    try {
        (window as any).DiscordNative.app.relaunch();
    } catch (e) {
        console.error("[Whisper] relaunch fallo:", e);
    }
}

export function onSettingChange(key: string) {
    if (asked || !RESTART_KEYS.includes(key)) return;
    asked = true;
    BdApi.UI.showConfirmationModal(
        t("Reiniciar Discord", "Restart Discord"),
        t("Este ajuste puede necesitar reiniciar Discord para aplicarse del todo.", "This setting may need a Discord restart to fully apply."),
        { confirmText: t("Reiniciar ahora", "Restart now"), cancelText: t("Mas tarde", "Later"), onConfirm: restartDiscord }
    );
}
