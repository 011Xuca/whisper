/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Only notifies about new GitHub releases. Never downloads or runs anything.
import { showNotification } from "@api/Notifications";

import { t } from "./i18n";
import { REPO, VERSION } from "./meta";
import { settings } from "./settings";
import { setState } from "./state";

export interface Release { tag_name: string; name: string | null; body: string | null; html_url: string; draft: boolean; prerelease: boolean; }

const CHECK_EVERY = 6 * 60 * 60 * 1000;
let interval: ReturnType<typeof setInterval> | undefined;
let cache: Promise<Release[]> | undefined;

export const isConfigured = () => /^[\w.-]+\/[\w.-]+$/.test(REPO) && !REPO.startsWith("OWNER/");
export const releasesPage = () => `https://github.com/${REPO}/releases`;
/** Remote data: only allow links into this repo on github.com. */
export const safeUrl = (url: unknown) => typeof url === "string" && url.startsWith(`https://github.com/${REPO}/`) ? url : releasesPage();

export function fetchReleases(force = false): Promise<Release[]> {
    if (!isConfigured()) return Promise.resolve([]);
    if (!cache || force) {
        // failures (offline, rate limit 403/429, bad JSON) are silent: we just show nothing
        cache = fetch(`https://api.github.com/repos/${REPO}/releases?per_page=5`, { headers: { Accept: "application/vnd.github+json" } })
            .then(r => r.ok ? r.json() : [])
            .then(list => Array.isArray(list) ? list.filter((r: Release) => r && typeof r.tag_name === "string" && !r.draft && !r.prerelease) : [])
            .catch(() => []);
    }
    return cache;
}

const parse = (v: string) => v.replace(/^v/i, "").split(/[.+-]/).slice(0, 3).map(n => parseInt(n, 10) || 0);
export function isNewer(tag: string, than: string) {
    const a = parse(tag), b = parse(than);
    for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
    return false;
}

async function check() {
    const [latest] = await fetchReleases(true);
    setState("outdated", !!latest && isNewer(latest.tag_name, VERSION)); // badge turns red
    if (!latest || !isNewer(latest.tag_name, VERSION) || settings.store.notifiedVersion === latest.tag_name) return;
    settings.store.notifiedVersion = latest.tag_name; // once per version, no spam
    const url = safeUrl(latest.html_url);
    showNotification({
        title: t(`Whisper ${latest.tag_name} disponible`, `Whisper ${latest.tag_name} available`),
        body: t(`Tienes la versión ${VERSION}. Haz clic para ver la release en GitHub.`, `You have version ${VERSION}. Click to view the release on GitHub.`),
        onClick: () => VencordNative.native.openExternal(url),
    });
}

export function syncUpdater() {
    if (settings.store.checkUpdates && isConfigured()) {
        if (interval) return;
        const run = () => check().catch(e => console.debug("[Whisper] update check failed:", e));
        run();
        interval = setInterval(run, CHECK_EVERY);
    } else stopUpdater();
}

export function stopUpdater() {
    clearInterval(interval);
    interval = undefined;
    setState("outdated", false);
}
