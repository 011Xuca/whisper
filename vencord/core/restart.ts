/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { relaunch } from "@utils/native";
import { Alerts } from "@webpack/common";

import { t } from "./i18n";
import { settings } from "./settings";

// Settings whose effect can leave residue until restart (Discord setting overrides, rewritten image URLs already
// cached, Flux interceptors). Everything else applies live. Editable.
const RESTART_KEYS = ["ecoMode", "reducedMotion", "gifsOnHover", "staticEmojis", "staticStickers", "avatarsOnHover", "defaultAvatars", "blockTypingEvents", "dropMutedMessages", "hideQuestPopups", "blockTelemetry"];

let asked = false; // in memory only: one prompt per session

export function restartDiscord() {
    try {
        relaunch();
    } catch (e) {
        console.error("[Whisper] relaunch fallo:", e);
    }
}

/** Prefix-listener callback: path looks like "plugins.Whisper.<key>". */
export function onSettingChange(_: unknown, path: string) {
    if (asked || !RESTART_KEYS.includes(path.split(".").pop() ?? "")) return;
    asked = true;
    Alerts?.show({
        title: t("Reiniciar Discord", "Restart Discord"),
        body: t("Este ajuste puede necesitar reiniciar Discord para aplicarse del todo.", "This setting may need a Discord restart to fully apply."),
        confirmText: t("Reiniciar ahora", "Restart now"),
        cancelText: t("Mas tarde", "Later"),
        onConfirm: restartDiscord
    });
}

/** Sets every Whisper setting back to its default (notifiedVersion is kept). */
export function resetDefaults() {
    const def = settings.def as Record<string, { default?: unknown; options?: { value: unknown; default?: boolean; }[]; }>;
    for (const key of Object.keys(def)) {
        if (key === "notifiedVersion") continue;
        const value = def[key].default ?? def[key].options?.find(o => o.default)?.value;
        if (value !== undefined) (settings.store as any)[key] = value;
    }
}
