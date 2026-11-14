/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Images on demand: attachment/embed <img> in message rows get a tiny blurred thumbnail (or blank) until hovered
// (150 ms), clicked or focused; server/group-DM icons (hideGroupIcons) get a blank gray one. Originals are kept in data-whisper-lazy-src and restored on stop. No webpack patches.
import { t } from "../core/i18n";
import { settings } from "../core/settings";

/** Only images inside chat message rows, and only attachment/embed media (never avatars, emojis, stickers or UI). */
export const MESSAGE_IMG = 'li[id^="chat-messages-"] :is(img[src*="/attachments/"],img[src*="/external/"])';
export const GROUP_IMG = 'img[src*="/icons/"],img[src*="/channel-icons/"]';
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const HOVER_DELAY = 150;

/** Same attachment at ~24px via Discord's media proxy (a few hundred bytes); anything else gets the blank gif. */
function tiny(src: string) {
    try {
        const u = new URL(src);
        if (!u.pathname.startsWith("/attachments/") || !/^(cdn|media)\.discordapp\.(com|net)$/.test(u.host)) return BLANK;
        u.host = "media.discordapp.net";
        u.searchParams.set("width", "24");
        u.searchParams.set("height", "24");
        return u.href;
    } catch {
        return BLANK;
    }
}

const kind = (img: Element) => (settings.store.lazyImages && img.matches(MESSAGE_IMG) ? "msg" : settings.store.hideGroupIcons && img.matches(GROUP_IMG) ? "icon" : "");

let observer: MutationObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

// Overlays (wrappers, buttons) often sit above the <img>, so also look in the closest few ancestors (never the whole message row).
function lazy(el: Element | null): HTMLImageElement | null {
    let n: Element | null = el;
    for (let i = 0; n && i < 5 && n.tagName !== "LI" && n !== document.body; i++, n = n.parentElement) {
        if (n instanceof HTMLImageElement) return n.dataset.whisperLazy ? n : null;
        const found = n.querySelectorAll("img[data-whisper-lazy]");
        if (found.length === 1) return found[0] as HTMLImageElement;
        if (found.length > 1) return null;
    }
    return null;
}

function freeze(img: HTMLImageElement) {
    const src = img.getAttribute("src");
    if (!src || src.startsWith("data:") || img.dataset.whisperLoaded === src) return;
    const k = kind(img);
    if (!k) return;
    if (img.dataset.whisperLazy && src === img.dataset.whisperTiny) return;
    const { width, height } = img.getBoundingClientRect();
    if (!img.dataset.whisperLazy) {
        img.dataset.whisperW = img.style.width;
        img.dataset.whisperH = img.style.height;
        img.dataset.whisperTitle = img.getAttribute("title") ?? "";
        img.dataset.whisperHadTitle = img.hasAttribute("title") ? "1" : "";
    }
    img.dataset.whisperLazySrc = src;
    img.dataset.whisperLazy = k;
    // keep the layout box when it is known; otherwise the wrapper/attributes already size it
    if (width && height) {
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
    }
    const placeholder = k === "msg" ? tiny(src) : BLANK;
    img.dataset.whisperTiny = placeholder;
    img.title = t("Pasa el mouse para cargar", "Hover to load");
    img.removeAttribute("srcset");
    img.setAttribute("src", placeholder);
}

function thaw(img: HTMLImageElement, keepLoaded: boolean) {
    const src = img.dataset.whisperLazySrc;
    if (src) img.setAttribute("src", src);
    img.style.width = img.dataset.whisperW ?? "";
    img.style.height = img.dataset.whisperH ?? "";
    if (keepLoaded && src) img.dataset.whisperLoaded = src;
    if (img.dataset.whisperHadTitle) img.setAttribute("title", img.dataset.whisperTitle ?? "");
    else img.removeAttribute("title");
    for (const k of ["whisperLazy", "whisperLazySrc", "whisperW", "whisperH", "whisperTitle", "whisperHadTitle", "whisperTiny"]) delete img.dataset[k];
}

function onMutations(records: MutationRecord[]) {
    for (const r of records) {
        if (r.type === "attributes") {
            if (r.target instanceof HTMLImageElement) freeze(r.target);
            continue;
        }
        r.addedNodes.forEach(n => {
            if (!(n instanceof Element)) return;
            if (n instanceof HTMLImageElement) freeze(n);
            else n.querySelectorAll("img").forEach(freeze);
        });
    }
}

const onOver = (e: Event) => {
    const img = lazy(e.target as Element);
    clearTimeout(timer);
    if (img) timer = setTimeout(() => lazy(img) && thaw(img, true), HOVER_DELAY);
};
const onOut = () => clearTimeout(timer);
const onActivate = (e: Event) => {
    const el = e.target as Element;
    const img = lazy(el);
    if (img) thaw(img, true);
};

export function stopLazyImages() {
    observer?.disconnect();
    observer = undefined;
    clearTimeout(timer);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("click", onActivate, true);
    document.removeEventListener("focusin", onActivate);
    document.querySelectorAll<HTMLImageElement>("img[data-whisper-lazy]").forEach(i => thaw(i, false));
    document.querySelectorAll<HTMLElement>("img[data-whisper-loaded]").forEach(i => delete i.dataset.whisperLoaded);
}

export function syncLazyImages() {
    stopLazyImages();
    if (!settings.store.lazyImages && !settings.store.hideGroupIcons) return;
    document.querySelectorAll<HTMLImageElement>(`${MESSAGE_IMG},${GROUP_IMG}`).forEach(freeze);
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    document.addEventListener("click", onActivate, true);
    document.addEventListener("focusin", onActivate);
}
