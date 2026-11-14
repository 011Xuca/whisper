/*
 * Whisper for BetterDiscord (shared with the Vencord edition)
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// All visual tweaks as one <style>. Selectors use stable hooks (data-* attributes, CDN URLs, class-name prefixes)
// instead of hashed class names, so they survive Discord updates; a selector that stops matching just does nothing.
import { UserStore } from "../core/discord";

import { logoCss, titleBarCss } from "../ui/branding";
import { GIF_VIDEO } from "./gifs";
import { MESSAGE_IMG } from "./lazyImages";
import { on, settings } from "../core/settings";

let style: HTMLStyleElement | undefined;

/** Matches Discord's hashed CSS-module classes by their readable prefix, e.g. typing_xYz123 */
const cls = (name: string) => `:is([class^="${name}_"],[class*=" ${name}_"])`;

/** Hides a sidebar entry by its route: the row (if it has a list-item id) or, failing that, the link itself. */
const hideRoute = (href: string) => `:is(li,[data-list-item-id]):has(a[href="${href}"]),a[href="${href}"]`;

/** Display-name font: Discord adds dnsFont_ plus the font class (cherryBomb_, ...) to the element that carries a custom name font. */
const DNS_FONT = cls("dnsFont");

/** Inline role color (React serializes it as "color: rgb(...);"); the prefix/"; " forms skip background-color. */
const INLINE_COLOR = ':is([style^="color:"],[style*="; color:"])';

/** Profile badge icons come from the /badge-icons/ CDN path (BADGE_ICON route); the group row is role="group" with the badges as (wrapped) anchors. */
const BADGE = 'img[src*="/badge-icons/"]';

/** Global rule when the toggle is on; otherwise only while a game runs (if game mode is on). */
function orGame(enabled: boolean, selectors: string[], body: string) {
    if (enabled) return `${selectors.join(",")}{${body}}`;
    if (settings.store.gameMode) return `${selectors.map(s => `html.whisper-gaming ${s}`).join(",")}{${body}}`;
    return "";
}

function build() {
    const me = UserStore?.getCurrentUser?.()?.id;
    const rules = [
        settings.store.hideWhenAsleep && "html.whisper-asleep #app-mount{display:none!important}html.whisper-asleep,html.whisper-asleep body{background:#0b0b0d!important}",
        orGame(on("noAnimations"), ["*", "*::before", "*::after"],
            "animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important"),
        orGame(on("noBlur"), ["*"], "backdrop-filter:none!important"),
        // Plain universal rule: excluding voice containers needed an ancestor check on every restyle (CPU spikes in calls), so the green speaking ring goes too.
        settings.store.noShadows && "*{box-shadow:none!important;text-shadow:none!important}",

        settings.store.hideEmbeds && `${cls("embedFull")}{display:none!important}`,
        // message rows are li#chat-messages-<channel>-<message> (verified in the live DOM)
        settings.store.lazyMessages && 'li[id^="chat-messages-"]{content-visibility:auto;contain-intrinsic-size:auto 80px}',
        on("gifsOnHover") && `${GIF_VIDEO}:not(:hover){filter:blur(2px)}`,
        (settings.store.lazyImages || settings.store.hideGroupIcons) && "img[data-whisper-lazy]{background:#80808055;cursor:pointer}img[data-whisper-lazy=msg]{filter:blur(6px);border-radius:4px}",
        settings.store.blurImages && `${MESSAGE_IMG}{filter:blur(${Math.min(50, Math.max(0, Number(settings.store.blurAmount) || 0))}px) grayscale(1)${on("noAnimations") ? "" : ";transition:filter .15s"}}${MESSAGE_IMG}:is(:hover,:focus-visible),li[id^="chat-messages-"] :is(a,button):is(:hover,:focus-visible) :is(img[src*="/attachments/"],img[src*="/external/"]){filter:none}`,
        settings.store.hideTyping && `${cls("typing")}{display:none!important}`,

        settings.store.customLogo && logoCss(),
        titleBarCss(),

        // Hrefs are Discord routes (QUEST_HOME, COLLECTIBLES_SHOP, NITRO_HOME); the class prefixes are hashed modules, so those are the fragile part.
        // the claim-reward card above the voice panel (lazy QuestBar) is matched by its data-testid (verified in the live DOM)
        settings.store.hideQuestPopups && '[data-testid="quest-bar-container"]{display:none!important}',
        settings.store.hideQuestsEntry && `${hideRoute("/quest-home")}{display:none!important}`,
        settings.store.hideShopNitro && `a[href*="wishlist" i],${hideRoute("/shop")},${hideRoute("/store")},${["nitroUpsell", "nitroUpsellBannerOverlay", "nitroPreviewUpsell", "premiumUpsell", "premiumUpsellTopOfList", "premiumBanner", "boostUpsell", "unifyTrialUpsell"].map(cls).join(",")}{display:none!important}`,
        settings.store.hidePromoBanners && `${["promotionBannerContainer", "compactGiftPromotionBannerContainer", "giftingRewardBanner", "promotionalNoticeContainer"].map(cls).join(",")}{display:none!important}`,

        on("hideProfileEffects") && `${cls("profileEffects")},[class*='profileFrameLayer_']{display:none!important}`,
        on("hideAvatarDecorations") && `${cls("avatarDecoration")},img[src*="/avatar-decoration-presets/"]{display:none!important}`,
        // nameplate asset comes from the collectibles CDN; its aria-hidden parent carries the tinted background; avatar decorations use the same CDN path and are excluded
        on("hideNameplates") && `[aria-hidden="true"]:has(> :is(img,video)[src*="/collectibles-shop/"]),:is(img,video)[src*="/collectibles-shop/"]:not(${cls("avatarDecoration")}){display:none!important}`,
        // custom name fonts also live on role-name spans (member list, message headers) that have no data-username-with-effects
        on("plainNames") && `${DNS_FONT}{font-family:var(--font-primary)!important;letter-spacing:normal!important}`,
        on("plainNames") && "[data-username-with-effects],[data-username-with-effects] *{font-family:var(--font-primary)!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;background:none!important;-webkit-text-stroke:0!important;text-shadow:none!important;animation:none!important}[data-username-with-effects]::before,[data-username-with-effects]::after{content:none!important}",
        on("hideBanners") && '[style*="/banners/"]{background-image:none!important}img[src*="/banners/"]{visibility:hidden!important}[class*="banner_"][class*="fill_"]{background:var(--background-mod-subtle,#4e505880)!important}',
                // every profile card is forced to white with dark text, whatever the user's custom theme
on("plainProfileThemes") && "[style*='--profile-gradient'],[style*='--custom-theme']{--profile-gradient-primary-color:#ffffff!important;--profile-gradient-secondary-color:#ffffff!important;--profile-gradient-modal-background-color:#ffffff!important;--profile-gradient-button-color:#5865f2!important;--profile-gradient-overlay-color:transparent!important;--custom-theme-base-color-light:#ffffff!important;--custom-theme-base-color-dark:#ffffff!important;--custom-theme-text-color-light:#1a1a1a!important;--custom-theme-text-color-dark:#1a1a1a!important}.user-profile-modal-v2 [class*='profileContentInner_'],.user-profile-modal-v2 main[class*='profile_']{background-image:none!important;background-color:#ffffff!important}.user-profile-modal-v2 :not(button):not(button *){color:#1a1a1a!important}.user-profile-modal-v2 button[class*='primary_'],.user-profile-modal-v2 button[class*='primary_'] *{background-color:transparent;color:#ffffff!important}.user-profile-modal-v2 button[class*='primary_']{background-color:#5865f2!important}.user-profile-modal-v2 button[class*='secondary_']{background-color:#e3e5e8!important}.user-profile-modal-v2 button[class*='secondary_'],.user-profile-modal-v2 button[class*='secondary_'] *{color:#1a1a1a!important}.user-profile-modal-v2{background:#ffffff!important;--profile-gradient-primary-color:#ffffff!important;--profile-gradient-secondary-color:#ffffff!important;--profile-gradient-modal-background-color:#ffffff!important}",

        // role colors are inline styles (nameContainer / username spans) plus gradient classes; the glow copy of the name is aria-hidden
        on("plainRoleColors") && `${cls("nameContainer")}${INLINE_COLOR},${cls("username")}${INLINE_COLOR}{color:inherit!important}${cls("usernameGradient")}{background:none!important;-webkit-text-fill-color:currentColor!important}${cls("usernameGlow")}{display:none!important}`,
        on("hideGuildTags") && `${cls("chipletContainerInner")}{display:none!important}`,
        on("hideProfileBadges") && `a:has(> ${BADGE}),${BADGE},[role="group"]:is(:has(> a > ${BADGE}),:has(> div > a > ${BADGE}),:has(> div > div > a > ${BADGE})){display:none!important}`,
        (on("hideProfileTabs") || on("hideMutualTabs")) && '[data-whisper-hide]{display:none!important}',
        on("hideActiveNow") && `${cls("nowPlayingColumn")}{display:none!important}`,
        // the column wrapper (membersWrap_) and the list itself (data-list-id members-<channelId>); no :has() on a generic parent, so the chat can never be hidden
        on("hideMemberList") && `${cls("membersWrap")},[data-list-id^="members-"]{display:none!important}`,
        // variables defined on :root (and :root:lang(..)); !important beats their specificity. --font-code is left alone.
        on("systemFonts") && ':root:root{--font-primary:system-ui,"Segoe UI",sans-serif!important;--font-headline:system-ui,"Segoe UI",sans-serif!important;--font-nitro:system-ui,"Segoe UI",sans-serif!important}',

        // only the local preview inside my own call tile; the outgoing track is untouched
        on("hideOwnPreview") && me && `[data-selenium-video-tile="${me}"] :is(video,canvas){display:none!important}`,
        on("voiceVisuals") && `img[src*="/streams/"][src*="/preview"],${cls("voiceChannelEffectEmoji")}{display:none!important}`,
    ];
    return rules.filter(Boolean).join("\n");
}

export function syncCss() {
    if (!style) {
        style = document.createElement("style");
        style.id = "whisper-css";
        document.head.append(style);
    }
    const css = build();
    if (style.textContent !== css) style.textContent = css;
}

export function stopCss() {
    style?.remove();
    style = undefined;
}
