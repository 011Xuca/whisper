/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Shared runtime state. Each key is mirrored as a `whisper-<key>` class on <html> so CSS can react to it.
export const state = { asleep: false, gaming: false, focused: true, outdated: false };
export type StateKey = keyof typeof state;

let onChange = () => { };

// Discord rewrites <html>'s whole class attribute (e.g. when its reduced-motion class flips, which game mode triggers): put our classes back.
let observer: MutationObserver | undefined;
function restoreClasses() {
    const list = document.documentElement.classList;
    // only actual losses: add() on a present token still queues a mutation record, which would loop this observer forever
    for (const key of Object.keys(state) as StateKey[]) if (state[key] && !list.contains(`whisper-${key}`)) list.add(`whisper-${key}`);
}
export const onStateChange = (cb: () => void) => { onChange = cb; };

export function setState(key: StateKey, value: boolean) {
    if (state[key] === value) return;
    state[key] = value;
    document.documentElement.classList.toggle(`whisper-${key}`, value);
    observer ??= (o => (o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }), o))(new MutationObserver(restoreClasses));
    onChange();
}

export function resetState() {
    onChange = () => { };
    observer?.disconnect();
    observer = undefined;
    for (const key of Object.keys(state) as StateKey[]) document.documentElement.classList.remove(`whisper-${key}`);
    Object.assign(state, { asleep: false, gaming: false, focused: true, outdated: false });
}
