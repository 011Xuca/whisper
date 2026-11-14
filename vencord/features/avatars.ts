/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Animated avatars/banners/icons: static until hovered, by rewriting CDN URLs (no webpack patches).
// Also optional default-avatar replacement. Originals are kept in data-whisper-src and restored on stop.
import { on, settings } from "../core/settings";

const SEL = 'img[src*="/a_"],[style*="/a_"],img[src*="/avatars/"],[style*="/avatars/"]';
// Discord CDN: animated assets have an "a_" hash and are served animated as .gif or with animated=true
const ANIMATED = /\/a_[0-9a-f]+\.(gif|webp|png)/;
const AVATAR = /\/(?:avatars|users)\/(\d{15,})\/(?:avatars\/)?[0-9a-f_]+\.\w+/;

let observer: MutationObserver | undefined;
const thawed = new Map<HTMLElement, Element>();

const read = (el: HTMLElement) => el instanceof HTMLImageElement ? el.getAttribute("src") : el.style.backgroundImage;
function write(el: HTMLElement, value: string) {
    el.dataset.whisperOut = value;
    if (el instanceof HTMLImageElement) el.setAttribute("src", value);
    else el.style.backgroundImage = value;
}

function transform(url: string, hovered: boolean) {
    const avatar = settings.store.defaultAvatars && defaultAvatar(url);
    if (avatar) return avatar;
    if (hovered || !on("avatarsOnHover") || !ANIMATED.test(url)) return url;
    return url.replace(/(\/a_[0-9a-f]+)\.gif/g, "$1.webp").replace(/([?&])animated=true&?/g, "$1").replace(/[?&](?=["')]|$)/, "");
}

function defaultAvatar(url: string) {
    const id = url.match(AVATAR)?.[1];
    return id && url.replace(/https?:\/\/[^)"']+/, `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> 22n) % 6n)}.png`);
}

function sync(el: HTMLElement, hovered = false) {
    const cur = read(el);
    if (!cur) return;
    if (cur !== el.dataset.whisperOut) el.dataset.whisperSrc = cur; // Discord set a new value: that is the new original
    const original = el.dataset.whisperSrc;
    if (!original) return;
    const out = transform(original, hovered);
    if (out !== cur) write(el, out);
    else el.dataset.whisperOut = out;
}

function restore(el: HTMLElement) {
    const original = el.dataset.whisperSrc;
    if (original && read(el) === el.dataset.whisperOut) write(el, original);
    delete el.dataset.whisperSrc;
    delete el.dataset.whisperOut;
}

const box = (t: Element) => t.closest("svg") ?? t.parentElement ?? t;

function onOver(e: PointerEvent) {
    const t = e.target as Element;
    if (!(t instanceof Element)) return;
    const root = box(t);
    for (const el of [root, ...root.querySelectorAll("[data-whisper-src]")] as HTMLElement[]) {
        if (!el.dataset?.whisperSrc) continue;
        thawed.set(el, root);
        sync(el, true);
    }
}

function onOut(e: PointerEvent) {
    for (const [el, root] of thawed) {
        if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) continue;
        thawed.delete(el);
        if (el.isConnected) sync(el);
    }
}

function onMutations(records: MutationRecord[]) {
    for (const r of records) {
        if (r.type === "attributes") {
            const el = r.target as HTMLElement;
            if (!thawed.has(el) && (el.dataset.whisperSrc || el.matches(SEL))) sync(el);
            continue;
        }
        for (const n of r.addedNodes) {
            if (!(n instanceof HTMLElement)) continue;
            if (n.matches(SEL)) sync(n);
            n.querySelectorAll<HTMLElement>(SEL).forEach(el => sync(el));
        }
    }
}

export function stopAvatars() {
    observer?.disconnect();
    observer = undefined;
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    thawed.clear();
    document.querySelectorAll<HTMLElement>("[data-whisper-src]").forEach(restore);
}

export function syncAvatars() {
    stopAvatars(); // cheap, and re-applies with the current settings
    if (!on("avatarsOnHover") && !settings.store.defaultAvatars) return;
    document.querySelectorAll<HTMLElement>(SEL).forEach(el => sync(el));
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "style"] });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
}
