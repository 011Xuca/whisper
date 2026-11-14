/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Everything a future standalone repo needs to edit lives here.

export const VERSION = "1.0.0";

// TODO: set to the real "owner/repo" before publishing. While it still starts with "OWNER/", the update check is skipped.
export const REPO = "011Xuca/whisper";

// TODO: fill in both. The two panel buttons (Ko-fi / Redes) are hidden while their link is empty. Only https:// links work.
export const KOFI = "https://ko-fi.com/011xuca";
export const SOCIALS = "https://011xuca.github.io/links/";

// TODO: fill in. Empty links are not shown. Only https:// links are rendered.
export const LINKS: Record<string, string> = {
    GitHub: "https://github.com/011Xuca/whisper",
    "Ko-fi": "",
    Twitter: "",
    YouTube: "",
};
