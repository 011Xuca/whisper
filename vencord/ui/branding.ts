/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Same SVG as logo.svg, embedded so the plugin has no external file dependency.
const LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="3" y="3" width="122" height="122" rx="32" fill="#22d3ee"/><rect x="10" y="10" width="108" height="108" rx="26" fill="#14161b"/><circle cx="46" cy="64" r="9" fill="#22d3ee"/><g fill="none" stroke="#22d3ee" stroke-width="7" stroke-linecap="round"><path d="M60.1 49.9A20 20 0 0 1 60.1 78.1"/><path d="M71.5 38.5A36 36 0 0 1 71.5 89.5" opacity=".6"/><path d="M82.8 27.2A52 52 0 0 1 82.8 100.8" opacity=".3"/></g><path d="M102 17l3.5 7.5 7.5 3.5-7.5 3.5-3.5 7.5-3.5-7.5-7.5-3.5 7.5-3.5z" fill="#22d3ee"/></svg>';

export const LOGO_URL = `data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`;

// The Home button (guild list) carries the stable data-guilds-bar-home attribute. Its icon is a 24x24 <svg> inside the
// round 48px wrapper that holds the background colour, so the logo goes on that wrapper and the svg is just hidden:
// click, tooltip, aria-label and selected state are untouched.
const HOME = "[data-guilds-bar-home]";
const ICON = 'svg[width="24"][height="24"]';
export const logoCss = () =>
    `${HOME} :has(> ${ICON}){background:url("${LOGO_URL}") center/100% 100% no-repeat!important;border-radius:30%!important}` +
    `${HOME} ${ICON}{visibility:hidden}${HOME} :has(> ${ICON}):hover{filter:brightness(1.2)}`;

// The title-bar tag is a real element (titleBar.ts) so it can hold the Ko-fi / socials buttons next to the version text.
// Default text colour; turns red (html.whisper-outdated, set by the updater) when GitHub has a newer release.
export const titleBarCss = () =>
    "#whisper-titlebar{position:fixed;top:5px;left:68px;height:24px;z-index:2147483647;display:flex;align-items:center;gap:8px;pointer-events:none;font:500 14px/24px var(--font-primary,sans-serif);color:var(--text-default,var(--text-normal,#dbdee1));opacity:.85}" +
    "#whisper-titlebar button{pointer-events:auto;-webkit-app-region:no-drag;font:600 11px/18px var(--font-primary,sans-serif);padding:0 9px;border-radius:9px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;opacity:.8}#whisper-titlebar button:hover{opacity:1}" +
    "html.theme-light #whisper-titlebar{color:#2e3338}" + // the title bar sits outside #app-mount, where Discord's colour variables are not defined
    "html.whisper-outdated #whisper-titlebar{color:#f23f43;opacity:1}";
