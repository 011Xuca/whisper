// Loads Whisper.plugin.js the way BetterDiscord does (new Function with module/exports) against a mocked BdApi
// and a tiny DOM stub, then checks start/stop, persistence, presets and Flux interceptor cleanup. Run: node test/selfcheck.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "Whisper.plugin.js");
const code = fs.readFileSync(file, "utf8");
assert.match(code, /^\/\*\*\n \* @name Whisper\n \* @author xuca\n/);
const version = fs.readFileSync(path.join(path.dirname(file), "..", "version"), "utf8").trim();
assert.ok(code.includes(`* @version ${version}\n`), "@version != archivo version");
assert.ok(code.includes(`"${version}"`), "VERSION compilado != archivo version");
for (const bad of ["@api/", "@webpack", "@utils/", "@components/", "VencordNative", "Vencord."]) assert.ok(!code.includes(bad), bad);

// --- minimal DOM ---
const listeners = new Map();
const el = tag => ({
    tagName: tag.toUpperCase(), id: "", textContent: "", children: [], dataset: {}, style: {},
    append(...c) { this.children.push(...c); c.forEach(x => (x.parent = this)); },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; },
    setAttribute() { }, removeAttribute() { },
});
const head = el("head"), body = el("body");
const all = () => [...head.children, ...body.children];
const classes = new Set();
globalThis.window = globalThis;
globalThis.document = {
    head, body, hidden: false,
    documentElement: { classList: { toggle: (c, v) => (v ? classes.add(c) : classes.delete(c)), remove: c => classes.delete(c) } },
    createElement: el,
    getElementById: id => all().find(x => x.id === id) ?? null,
    querySelectorAll: () => [],
    hasFocus: () => true,
    addEventListener: (t, f) => listeners.set(t + f, f), removeEventListener: (t, f) => listeners.delete(t + f),
};
globalThis.addEventListener = (t, f) => listeners.set(t + f, f);
globalThis.removeEventListener = (t, f) => listeners.delete(t + f);
const native = { relaunched: 0, throttling: [] };
globalThis.DiscordNative = {
    app: { relaunch: () => native.relaunched++ },
    window: { setBackgroundThrottling: v => native.throttling.push(v), setFrameRate() { } },
    processUtils: { purgeMemory() { } },
};
globalThis.MutationObserver = class { observe() { } disconnect() { } };

// --- mocked BdApi ---
const saved = {};
const interceptors = [];
const subs = {};
const dispatcher = {
    _interceptors: interceptors,
    addInterceptor: f => interceptors.push(f),
    dispatched: [],
    dispatch(a) { this.dispatched.push(a); }, register() { },
    subscribe: (t, f) => (subs[t] ??= new Set()).add(f),
    unsubscribe: (t, f) => subs[t]?.delete(f),
};
const games = { getVisibleRunningGames: () => [{ isLauncher: false }] };
globalThis.BdApi = {
    Data: { load: (n, k) => saved[n]?.[k], save: (n, k, v) => ((saved[n] ??= {})[k] = v) },
    Webpack: {
        getByKeys: (...k) => (k.includes("dispatch") ? dispatcher : undefined),
        getStore: n => ({
            RunningGameStore: games, UserStore: { getCurrentUser: () => ({ id: "1" }) },
            UserSettingsOverridesStore: { getOverride: () => undefined }, AccessibilityStore: { rawPrefersReducedMotion: "no-preference" },
        })[n],
    },
    UI: { showConfirmationModal: (t, b, o) => o.onConfirm?.(), buildSettingsPanel: o => o },
    React: { useState: v => [v, () => { }], createElement: (t, p, c) => ({ t, p, c }) },
};

const module = { exports: {} };
new Function("require", "module", "exports", code)(() => { throw new Error("no require"); }, module, module.exports);
const Plugin = module.exports;
assert.equal(typeof Plugin, "function");
const p = new Plugin({});
const tick = () => new Promise(r => setTimeout(r, 0));

p.start();
const css = () => document.getElementById("whisper-css")?.textContent ?? "";
assert.ok(css().includes("data-guilds-bar-home"), "customLogo default on");
assert.ok(classes.has("whisper-gaming"), "gameMode default on detects the mocked game");
assert.ok(document.getElementById("whisper-titlebar"), "title bar tag");
assert.ok(!css().includes("animation-duration:0s!important;animation-delay") || css().includes("html.whisper-gaming *"), "noAnimations only while gaming by default");
assert.equal(interceptors.length, 0, "no interceptors by default");
assert.ok(subs.RUNNING_GAMES_CHANGE?.size === 1);

// settings panel: every row has a real BD setting type and every category id is unique
const panel = p.getSettingsPanel()();
const items = panel.c.settings;
const ids = new Set();
for (const s of items.flatMap(s => (s.type === "category" ? s.settings : [s]))) {
    assert.ok(["switch", "number", "button"].includes(s.type), s.id);
    assert.ok(!ids.has(s.id), "dup id " + s.id);
    ids.add(s.id);
}
assert.ok(!ids.has("voiceLite") && !ids.has("checkUpdates") && !ids.has("group:g7"), "unported rows hidden");

// toggle a few settings through the panel and check persistence + live effect
const find = id => items.flatMap(s => (s.type === "category" ? s.settings : [s])).find(s => s.id === id);
find("group:g4").onChange(true); // hideTyping + blockTypingEvents
find("blockTelemetry").onChange(true);
find("dropPresence").onChange(true);
await tick();
assert.equal(saved.Whisper.blockTypingEvents, true);
assert.equal(interceptors.length, 3, "typing, blocker, presence interceptors");
assert.equal(interceptors[0]({ type: "TYPING_START" }), true);
assert.equal(interceptors.some(f => f({ type: "MESSAGE_CREATE" })), false);
let resolved = false;
assert.equal(interceptors[1]({ type: "TRACK", resolve: () => (resolved = true) }), true);
assert.ok(resolved);
assert.ok(css().includes('typing_'), "hideTyping css");

// game mode applies Discord's own overrides through Flux (gifAutoPlay/animateEmoji/animateStickers + reduced motion)
assert.ok(dispatcher.dispatched.some(a => a.type === "USER_SETTINGS_OVERRIDE_APPLY"));

// preset: exactly its switches on, the rest off, customLogo untouched
find("preset-light").onClick();
await tick();
assert.equal(saved.Whisper.noAnimations, true);
assert.equal(saved.Whisper.blockTelemetry, false);
assert.equal(saved.Whisper.dropPresence, false);
assert.equal(saved.Whisper.gameMode, false, "light preset turns game mode off (same as the other edition)");
assert.equal(saved.Whisper.customLogo, undefined, "customLogo never written by a preset");
assert.equal(interceptors.length, 1, "only typing left");
dispatcher.dispatched.length = 0;
p.stop();
assert.ok(dispatcher.dispatched.some(a => a.type === "ACCESSIBILITY_SET_PREFERS_REDUCED_MOTION" && a.prefersReducedMotion === "no-preference"), "reduced motion restored");
assert.equal(interceptors.length, 0, "stop removes every interceptor");
assert.ok(!document.getElementById("whisper-css") && !document.getElementById("whisper-titlebar"), "stop removes DOM");
assert.equal(classes.size, 0, "stop removes html classes");
assert.equal(subs.RUNNING_GAMES_CHANGE.size + subs.CONNECTION_OPEN.size, 0, "stop unsubscribes");
assert.equal(listeners.size, 0, "stop removes listeners");

// restart reads persisted values; start twice is idempotent
p.start(); p.start();
await tick();
assert.equal(interceptors.length, 1, "persisted toggles reapplied once");
assert.equal(head.children.filter(x => x.id === "whisper-css").length, 1);
p.stop();
assert.equal(interceptors.length, 0);
assert.equal(native.relaunched, 1, "restart prompt shown once per session");
assert.equal(native.throttling.at(-1), false, "stop restores Discord's backgroundThrottling:false");
console.log("selfcheck ok");
