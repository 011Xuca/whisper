/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { useAwaiter } from "@utils/react";

import { t } from "../core/i18n";
import { LINKS, VERSION } from "../core/meta";
import { SettingsPanel } from "./SettingsPanel";
import { fetchReleases, isConfigured, isNewer, releasesPage, safeUrl } from "../core/updater";

export function About() {
    const [releases, , pending] = useAwaiter(() => fetchReleases(), { fallbackValue: [] });
    const links = Object.entries(LINKS).filter(([, url]) => url.startsWith("https://"));

    // Release notes are remote text: rendered as plain text only (React escapes it), never as HTML.
    return (
        <>
            <SettingsPanel />

            <Heading tag="h4">{t("Novedades", "What's new")}</Heading>
            {!isConfigured() && <Paragraph>{t("Repositorio sin configurar (REPO en meta.ts).", "Repository not configured (REPO in meta.ts).")}</Paragraph>}
            {isConfigured() && !pending && !releases.length && <Paragraph>{t("Sin releases o GitHub no respondió.", "No releases, or GitHub did not respond.")} <Link href={releasesPage()}>{t("Ver releases", "View releases")}</Link></Paragraph>}
            {releases.map(r => (
                <div key={r.tag_name} style={{ marginBottom: 12 }}>
                    <Heading tag="h5">{r.name || r.tag_name}{isNewer(r.tag_name, VERSION) ? t(" (nueva)", " (new)") : ""}</Heading>
                    <Paragraph style={{ whiteSpace: "pre-wrap" }}>{(r.body ?? "").slice(0, 3000)}</Paragraph>
                    <Link href={safeUrl(r.html_url)}>{t("Ver en GitHub", "View on GitHub")}</Link>
                </div>
            ))}

            <Heading tag="h4">{t("Acerca de", "About")}</Heading>
            <Paragraph>Whisper v{VERSION}</Paragraph>
            <div style={{ display: "flex", gap: 12 }}>
                {links.map(([name, url]) => <Link key={name} href={url}>{name}</Link>)}
            </div>
        </>
    );
}
