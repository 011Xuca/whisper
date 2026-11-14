/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { on } from "../core/settings";

// The profile modal's tab bar (TabBar, role="tablist") renders <button role="tab"> items whose only stable identity is the React prop
// `id` = internal section value (WIDGETS = "Tablero", ACTIVITY, MUTUAL_FRIENDS, MUTUAL_GUILDS); unselected tabs have no data-*/aria identity in the DOM.
// So the React props of the DOM node are read (never modified) and the tab is tagged; css.ts hides [data-whisper-hide]. Any failure = nothing is hidden.
const SECTIONS = ["WIDGETS", "ACTIVITY", "WISHLIST", "MUTUAL_FRIENDS", "MUTUAL_GUILDS"];
const TAB = "data-whisper-tab";
const HIDE = "data-whisper-hide";

let observer: MutationObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function sectionOf(el: Element): string | undefined {
    const key = Object.keys(el).find(k => k.startsWith("__reactFiber$"));
    let fiber = key ? (el as any)[key] : null;
    for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) {
        const p = fiber.memoizedProps;
        // TabBar.Item props: id plus onItemSelect/itemType injected by the TabBar
        if (p && typeof p.id === "string" && "onItemSelect" in p && "itemType" in p) return SECTIONS.includes(p.id) ? p.id : undefined;
    }
}

function scan() {
    timer = undefined;
    const hidden = new Set<string>();
    if (on("hideProfileTabs")) hidden.add("WIDGETS").add("ACTIVITY").add("WISHLIST");
    if (on("hideMutualTabs")) hidden.add("MUTUAL_FRIENDS").add("MUTUAL_GUILDS");

    for (const list of document.querySelectorAll('[role="tablist"]')) {
        const tabs = [...list.querySelectorAll(':scope > [role="tab"]')];
        const info = tabs.map(el => ({ el, section: sectionOf(el) }));
        // only the profile tab bar contains these sections; leave any other tab bar alone
        if (!info.some(i => i.section)) continue;

        // when every tab is hidden the whole tab bar + panel (tablist's grandparent) goes with them
        const visible = info.filter(i => !i.section || !hidden.has(i.section));
        for (const { el, section } of info) {
            if (section) el.setAttribute(TAB, section);
            if (section && hidden.has(section)) el.setAttribute(HIDE, "");
            else el.removeAttribute(HIDE);
        }
        const box = list.parentElement?.parentElement;
        if (box && box.querySelector(":scope > [role=\"tabpanel\"]")) {
            if (visible.length) box.removeAttribute(HIDE);
            else box.setAttribute(HIDE, "");
        }
        // Discord opens on one of the hidden tabs: switch to the first visible one (same click a user would make)
        const selected = info.find(i => i.el.getAttribute("aria-selected") === "true");
        if (selected?.el.hasAttribute(HIDE)) (visible[0]?.el as HTMLElement | undefined)?.click();
    }
}

function clean() {
    for (const el of document.querySelectorAll(`[${TAB}],[${HIDE}]`)) {
        el.removeAttribute(TAB);
        el.removeAttribute(HIDE);
    }
}

const TABLIST = '[role="tab"],[role="tablist"]';
const schedule = () => { timer ??= setTimeout(scan, 80); };

export function stopProfileTabs() {
    observer?.disconnect();
    observer = undefined;
    clearTimeout(timer);
    timer = undefined;
    clean();
}

export function syncProfileTabs() {
    if (!on("hideProfileTabs") && !on("hideMutualTabs")) return stopProfileTabs();
    if (!observer) {
        // only DOM additions that can contain tabs matter; everything else (call grid, chat) is ignored
        observer = new MutationObserver(rs => { if (rs.some(r => [...r.addedNodes].some(n => n instanceof Element && (n.matches(TABLIST) || n.querySelector(TABLIST))))) schedule(); });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    scan();
}
