/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Alerts, Select, TextInput } from "@webpack/common";

import { t } from "../core/i18n";
import { applyPreset, PRESETS } from "./presets";
import { resetDefaults, restartDiscord } from "../core/restart";
import { ECO, PERSONALIZATION, settings } from "../core/settings";
import { KOFI, SOCIALS, VERSION } from "../core/meta";
import { CATEGORIES, META, Meta } from "./settingsMeta";

// Master switch -> settings it forces on. The restart prompt fires from the settings listener in index.ts.
const MASTERS: { key: string; list: readonly string[]; name: string; }[] = [
    { key: "ecoMode", list: ECO, name: t("Ahorro maximo", "Maximum savings") },
    { key: "noPersonalization", list: PERSONALIZATION, name: t("Sin personalizacion", "No personalization") },
];

type Store = Record<string, any>;

const open = (url: string) => { try { VencordNative.native.openExternal(url); } catch { window.open(url, "_blank", "noopener"); } };
const LinkButton = ({ url, children }: { url: string; children: string; }) => url.startsWith("https://") ? <Button variant="secondary" size="small" onClick={() => open(url)}>{children}</Button> : null;

function Row({ m, store }: { m: Meta; store: Store; }) {
    const master = MASTERS.find(x => store[x.key] && x.list.includes(m.key));
    const note = master ? ` (${t("forzado por", "forced by")} ${master.name})` : "";

    if (m.keys) {
        const forced = (k: string) => !!MASTERS.find(x => store[x.key] && x.list.includes(k));
        return <FormSwitch title={m.title} description={m.desc} value={m.keys.every(k => forced(k) || store[k])} disabled={m.keys.every(forced)} onChange={v => { for (const k of m.keys!) store[k] = v; }} />;
    }

    if (m.type === "bool") {
        return <FormSwitch title={m.title} description={m.desc + note} value={!!master || !!store[m.key]} disabled={!!master} onChange={v => { store[m.key] = v; }} />;
    }

    if (m.type === "note") return <div style={{ marginBottom: 16 }}><Heading tag="h5">{m.title}</Heading><Paragraph>{m.desc}</Paragraph></div>;

    const options = (settings.def as any)[m.key].options as { label: string; value: string; }[] | undefined;
    return (
        <div style={{ marginBottom: 16 }}>
            <Heading tag="h5">{m.title}</Heading>
            <Paragraph>{m.desc}</Paragraph>
            {m.type === "number"
                ? <TextInput type="number" value={String(store[m.key])} onChange={(v: string) => { store[m.key] = Math.max(0, Number(v) || 0); }} />
                : <Select options={options ?? []} isSelected={(v: string) => v === store[m.key]} select={(v: string) => { store[m.key] = v; }} serialize={(v: string) => String(v)} closeOnSelect />}
        </div>
    );
}

export function SettingsPanel() {
    const store = settings.use() as Store;

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Heading tag="h3">Whisper v{VERSION}</Heading>
                <LinkButton url={KOFI}>{t("Apoyar en Ko-fi", "Support on Ko-fi")}</LinkButton>
                <LinkButton url={SOCIALS}>{t("Mis redes", "My socials")}</LinkButton>
            </div>
            <Heading tag="h4" style={{ marginBottom: 8 }}>{t("Perfiles", "Presets")}</Heading>
            <Paragraph>{t("Aplican de una vez un conjunto de ajustes (no tocan dormir, marca ni actualizaciones). Despues puedes ajustar cada uno abajo.", "Apply a whole set of settings at once (sleep, branding and updates are untouched). You can fine-tune each one below.")}</Paragraph>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                {PRESETS.map(p => (
                    <Button key={p.id} variant="secondary" onClick={() => Alerts.show({
                        title: p.name,
                        body: p.desc,
                        confirmText: t("Aplicar", "Apply"),
                        cancelText: t("Cancelar", "Cancel"),
                        onConfirm: () => applyPreset(p)
                    })}>{p.name}</Button>
                ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {(IS_DISCORD_DESKTOP || IS_VESKTOP) && <Button onClick={restartDiscord}>{t("Reiniciar Discord", "Restart Discord")}</Button>}
                <Button variant="dangerSecondary" onClick={() => Alerts.show({
                    title: t("Restablecer valores por defecto", "Reset to defaults"),
                    body: t("Todos los ajustes de Whisper volveran a su valor por defecto.", "All Whisper settings will go back to their defaults."),
                    confirmText: t("Restablecer", "Reset"),
                    cancelText: t("Cancelar", "Cancel"),
                    onConfirm: resetDefaults
                })}>{t("Restablecer valores por defecto", "Reset to defaults")}</Button>
            </div>
            {CATEGORIES.map(c => (
                <section key={c.id} style={{ marginBottom: 24 }}>
                    <Heading tag="h4" style={{ marginBottom: 8, paddingLeft: 10, borderLeft: `4px solid ${c.color}`, color: c.color }}>{c.icon} {c.title}</Heading>
                    {META.filter(m => m.cat === c.id).map(m => <Row key={m.key} m={m} store={store} />)}
                </section>
            ))}
        </>
    );
}
