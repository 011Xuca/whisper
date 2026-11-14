/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { t } from "../core/i18n";
import { KOFI, SOCIALS, VERSION } from "../core/meta";

const ID = "whisper-titlebar";

function open(url: string) {
    window.open(url, "_blank", "noopener"); // Discord desktop hands https links to the default browser
}

export function stopTitleBar() {
    document.getElementById(ID)?.remove();
}

/** "Whisper vX" tag in the title bar with a Ko-fi and a socials button next to it (a button is hidden while its link in meta.ts is empty). */
export function syncTitleBar() {
    stopTitleBar();
    const bar = document.createElement("div");
    bar.id = ID;
    const label = document.createElement("span");
    label.textContent = `Whisper v${VERSION}`;
    bar.append(label);
    for (const [text, url] of [["Ko-fi", KOFI], [t("Redes", "Socials"), SOCIALS]]) {
        if (!url.startsWith("https://")) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.title = url;
        button.onclick = () => open(url);
        bar.append(button);
    }
    document.body.append(bar);
}
