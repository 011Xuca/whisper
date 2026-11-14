/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Language is detected once: any Spanish variant in the browser's list => Spanish, otherwise English.
const langs = (typeof navigator !== "undefined" && (navigator.languages?.length ? navigator.languages : [navigator.language])) || [];
const isEs = langs.some(l => typeof l === "string" && l.toLowerCase().startsWith("es"));

export const t = (es: string, en: string): string => isEs ? es : en;
