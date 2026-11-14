/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { on } from "../core/settings";

// Chat GIFs (Tenor/Klipy embeds) are <video loop muted> with a poster. With "GIFs on hover" they are kept at preload="none"
// (the browser downloads nothing until Discord plays them on hover) and drawn slightly blurred until hovered.
export const GIF_VIDEO = 'li[id^="chat-messages-"] video[class*="embedVideo"]';

let observer: MutationObserver | undefined;

function lower(v: HTMLVideoElement) {
    if (v.paused && v.preload !== "none") v.preload = "none";
}

export function stopGifs() {
    observer?.disconnect();
    observer = undefined;
    document.querySelectorAll<HTMLVideoElement>(GIF_VIDEO).forEach(v => { if (v.paused) v.preload = "metadata"; });
}

export function syncGifs() {
    stopGifs();
    if (!on("gifsOnHover")) return;
    document.querySelectorAll<HTMLVideoElement>(GIF_VIDEO).forEach(lower);
    observer = new MutationObserver(records => {
        for (const r of records) r.addedNodes.forEach(n => {
            if (!(n instanceof Element)) return;
            if (n.matches(GIF_VIDEO)) lower(n as HTMLVideoElement);
            n.querySelectorAll<HTMLVideoElement>(GIF_VIDEO).forEach(lower);
        });
    });
    observer.observe(document.body, { subtree: true, childList: true });
}
