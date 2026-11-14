/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { t } from "../core/i18n";
import { settings } from "../core/settings";

export interface Preset { id: string; name: string; desc: string; on: string[]; }

const LIGHT = ["noAnimations", "reducedMotion", "noBlur", "gifsOnHover", "staticEmojis", "staticStickers", "hideTyping", "blockTypingEvents", "systemFonts"];
const BALANCED = [...LIGHT, "gameMode", "noShadows", "hideEmbeds", "hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "hideActiveNow", "hideQuestPopups", "hideQuestsEntry", "hideShopNitro", "hidePromoBanners", "blockTelemetry"];
const MAX = [...BALANCED, "ecoMode", "lazyImages", "hideGroupIcons", "dropMutedMessages", "blockTypingEvents", "hideBanners", "plainProfileThemes", "hideProfileBadges", "hideProfileTabs", "hideMemberList", "hideGuildTags", "plainRoleColors", "voiceVisuals", "hideOwnPreview", "closeStreamsWhenAsleep", "disableCamerasWhenAsleep", "reopenOnWake"];
const GAMING = ["gameMode", "noAnimations", "reducedMotion", "noBlur", "noShadows", "gifsOnHover", "staticEmojis", "staticStickers", "hideTyping", "hideOwnPreview", "voiceVisuals", "hideQuestPopups", "blockTelemetry"];

export const PRESETS: Preset[] = [
    { id: "light", name: t("Ligero", "Light"), desc: t("Recortes visuales sin perder funciones", "Visual cuts without losing features"), on: LIGHT },
    { id: "balanced", name: t("Equilibrado", "Balanced"), desc: t("Ligero + sin promos, sin adornos de perfil y sin telemetria", "Light + no promos, no profile decorations, no telemetry"), on: BALANCED },
    { id: "max", name: t("Maximo ahorro", "Maximum savings"), desc: t("Casi todo recortado: medios bajo demanda, silenciados sin cargar, sin lista de miembros", "Almost everything trimmed: media on demand, muted not loaded, no member list"), on: MAX },
    { id: "gaming", name: t("Gaming", "Gaming"), desc: t("Para jugar con Discord en segundo plano: modo juego y menos efectos", "For playing with Discord in the background: game mode and fewer effects"), on: GAMING },
];

// Not touched by presets: sleep behaviour, branding and update checks stay as the user set them.
const KEEP = ["hideWhenAsleep", "customLogo", "checkUpdates", "notifiedVersion"];

/** Turns exactly the preset's switches on and every other on/off switch off (numbers and the sleep/brand/update options stay). */
export function applyPreset(p: Preset) {
    const def = settings.def as Record<string, { default?: unknown; }>;
    for (const key of Object.keys(def)) {
        if (KEEP.includes(key) || typeof def[key].default !== "boolean") continue;
        (settings.store as any)[key] = p.on.includes(key);
    }
}
