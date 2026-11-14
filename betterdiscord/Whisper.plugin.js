/**
 * @name Whisper
 * @author xuca
 * @description Cuts Discord's CPU/RAM use: sleeps the UI when minimized, game mode, no animations/effects, media on hover and configurable profile personalization, never touching call audio. / Reduce el CPU/RAM de Discord: duerme la UI al minimizar, modo juego, sin animaciones/efectos, media al pasar el mouse y personalizacion de perfiles configurable, sin tocar nunca el audio de las llamadas.
 * @version 1.0.0
 * @authorLink https://011xuca.github.io/links/
 * @donate https://ko-fi.com/011xuca
 * @website https://github.com/011Xuca/whisper
 * @source https://github.com/011Xuca/whisper
 */
/*
 * Whisper for BetterDiscord
 * Copyright (c) 2026 xuca
 * SPDX-License-Identifier: GPL-3.0-or-later
 * Built file: edit src/ and run "node build.mjs".
 */

// src/core/settings.ts
var DEFAULTS = {
  hideWhenAsleep: false,
  delaySeconds: 5,
  gameMode: true,
  fpsLimit: 0,
  ecoMode: false,
  noAnimations: false,
  reducedMotion: false,
  noBlur: false,
  noShadows: false,
  gifsOnHover: false,
  staticEmojis: false,
  staticStickers: false,
  hideEmbeds: false,
  lazyImages: false,
  blurImages: false,
  blurAmount: 12,
  lazyMessages: false,
  hideTyping: false,
  blockTypingEvents: false,
  dropMutedMessages: false,
  dropPresence: false,
  noPersonalization: false,
  hideProfileEffects: false,
  hideAvatarDecorations: false,
  hideNameplates: false,
  plainNames: false,
  hideBanners: false,
  plainProfileThemes: false,
  hideProfileTabs: false,
  hideMutualTabs: false,
  hideProfileBadges: false,
  avatarsOnHover: false,
  defaultAvatars: false,
  hideActiveNow: false,
  hideMemberList: false,
  systemFonts: false,
  hideGuildTags: false,
  plainRoleColors: false,
  hideOwnPreview: false,
  voiceVisuals: false,
  hideQuestPopups: false,
  hideQuestsEntry: false,
  hideShopNitro: false,
  hidePromoBanners: false,
  blockTelemetry: false,
  customLogo: true,
  hideGroupIcons: false,
  prevMotion: ""
};
var NAME = "Whisper";
var values = {};
var listener = () => {
};
function loadSettings() {
  for (const [key, d] of Object.entries(DEFAULTS)) {
    const v = BdApi.Data.load(NAME, key);
    values[key] = typeof v === typeof d ? v : d;
  }
}
var onSettingsChange = (cb) => {
  listener = cb;
};
var settings = {
  // same shape as the other edition (def[key].default), so presets.ts can stay a verbatim copy
  def: Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, { default: d }])),
  store: new Proxy(values, {
    get: (t2, key) => key in t2 ? t2[key] : DEFAULTS[key],
    set(t2, key, value) {
      if (!(key in DEFAULTS) || t2[key] === value) return true;
      t2[key] = value;
      BdApi.Data.save(NAME, key, value);
      listener(key);
      return true;
    }
  })
};
var PERSONALIZATION = ["hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "hideBanners", "plainProfileThemes", "avatarsOnHover", "hideGuildTags", "plainRoleColors", "hideProfileBadges"];
var ECO = ["noAnimations", "reducedMotion", "noBlur", "gifsOnHover", "staticEmojis", "staticStickers", "avatarsOnHover", "hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "voiceVisuals", "hideOwnPreview"];
var on = (key) => !!settings.store[key] || !!settings.store.noPersonalization && PERSONALIZATION.includes(key) || !!settings.store.ecoMode && ECO.includes(key);
function resetDefaults() {
  for (const [key, d] of Object.entries(DEFAULTS)) settings.store[key] = d;
}

// src/features/avatars.ts
var SEL = 'img[src*="/a_"],[style*="/a_"],img[src*="/avatars/"],[style*="/avatars/"]';
var ANIMATED = /\/a_[0-9a-f]+\.(gif|webp|png)/;
var AVATAR = /\/(?:avatars|users)\/(\d{15,})\/(?:avatars\/)?[0-9a-f_]+\.\w+/;
var observer;
var thawed = /* @__PURE__ */ new Map();
var read = (el) => el instanceof HTMLImageElement ? el.getAttribute("src") : el.style.backgroundImage;
function write(el, value) {
  el.dataset.whisperOut = value;
  if (el instanceof HTMLImageElement) el.setAttribute("src", value);
  else el.style.backgroundImage = value;
}
function transform(url, hovered) {
  const avatar = settings.store.defaultAvatars && defaultAvatar(url);
  if (avatar) return avatar;
  if (hovered || !on("avatarsOnHover") || !ANIMATED.test(url)) return url;
  return url.replace(/(\/a_[0-9a-f]+)\.gif/g, "$1.webp").replace(/([?&])animated=true&?/g, "$1").replace(/[?&](?=["')]|$)/, "");
}
function defaultAvatar(url) {
  const id = url.match(AVATAR)?.[1];
  return id && url.replace(/https?:\/\/[^)"']+/, `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> 22n) % 6n)}.png`);
}
function sync(el, hovered = false) {
  const cur = read(el);
  if (!cur) return;
  if (cur !== el.dataset.whisperOut) el.dataset.whisperSrc = cur;
  const original = el.dataset.whisperSrc;
  if (!original) return;
  const out = transform(original, hovered);
  if (out !== cur) write(el, out);
  else el.dataset.whisperOut = out;
}
function restore(el) {
  const original = el.dataset.whisperSrc;
  if (original && read(el) === el.dataset.whisperOut) write(el, original);
  delete el.dataset.whisperSrc;
  delete el.dataset.whisperOut;
}
var box = (t2) => t2.closest("svg") ?? t2.parentElement ?? t2;
function onOver(e) {
  const t2 = e.target;
  if (!(t2 instanceof Element)) return;
  const root = box(t2);
  for (const el of [root, ...root.querySelectorAll("[data-whisper-src]")]) {
    if (!el.dataset?.whisperSrc) continue;
    thawed.set(el, root);
    sync(el, true);
  }
}
function onOut(e) {
  for (const [el, root] of thawed) {
    if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) continue;
    thawed.delete(el);
    if (el.isConnected) sync(el);
  }
}
function onMutations(records) {
  for (const r of records) {
    if (r.type === "attributes") {
      const el = r.target;
      if (!thawed.has(el) && (el.dataset.whisperSrc || el.matches(SEL))) sync(el);
      continue;
    }
    for (const n of r.addedNodes) {
      if (!(n instanceof HTMLElement)) continue;
      if (n.matches(SEL)) sync(n);
      n.querySelectorAll(SEL).forEach((el) => sync(el));
    }
  }
}
function stopAvatars() {
  observer?.disconnect();
  observer = void 0;
  document.removeEventListener("pointerover", onOver);
  document.removeEventListener("pointerout", onOut);
  thawed.clear();
  document.querySelectorAll("[data-whisper-src]").forEach(restore);
}
function syncAvatars() {
  stopAvatars();
  if (!on("avatarsOnHover") && !settings.store.defaultAvatars) return;
  document.querySelectorAll(SEL).forEach((el) => sync(el));
  observer = new MutationObserver(onMutations);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "style"] });
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
}

// src/core/discord.ts
function lazy(find) {
  let cached;
  const target = () => cached ??= find() ?? void 0;
  return new Proxy({}, {
    get(_, key) {
      const t2 = target();
      const v = t2?.[key];
      return typeof v === "function" ? v.bind(t2) : v;
    },
    set(_, key, value) {
      const t2 = target();
      if (t2) t2[key] = value;
      return true;
    }
  });
}
var store = (name) => lazy(() => BdApi.Webpack.getStore(name));
var FluxDispatcher = lazy(() => BdApi.Webpack.getByKeys("dispatch", "subscribe", "register", { searchExports: true }));
var ChannelMessages = lazy(() => BdApi.Webpack.getByKeys("getOrCreate", "clearCache", "commit", { searchExports: true }));
var UserStore = store("UserStore");
var ChannelStore = store("ChannelStore");
var SelectedChannelStore = store("SelectedChannelStore");
var UserGuildSettingsStore = store("UserGuildSettingsStore");
var RunningGameStore = store("RunningGameStore");
var AccessibilityStore = store("AccessibilityStore");
var OverridesStore = store("UserSettingsOverridesStore");
var IS_DISCORD_DESKTOP = typeof window.DiscordNative !== "undefined";

// src/filters/blocker.ts
var dispatcher = () => FluxDispatcher;
function block(action) {
  if (action.type === "QUESTS_FETCH_QUEST_TO_DELIVER_SUCCESS") return !!settings.store.hideQuestPopups;
  if (action.type === "TRACK" && settings.store.blockTelemetry) {
    action.resolve?.();
    return true;
  }
  return false;
}
function stopBlocker() {
  const list = dispatcher()._interceptors;
  if (list?.includes(block)) list.splice(list.indexOf(block), 1);
}
function syncBlocker() {
  stopBlocker();
  if (settings.store.hideQuestPopups || settings.store.blockTelemetry) dispatcher().addInterceptor?.(block);
}

// src/ui/branding.ts
var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="3" y="3" width="122" height="122" rx="32" fill="#22d3ee"/><rect x="10" y="10" width="108" height="108" rx="26" fill="#14161b"/><circle cx="46" cy="64" r="9" fill="#22d3ee"/><g fill="none" stroke="#22d3ee" stroke-width="7" stroke-linecap="round"><path d="M60.1 49.9A20 20 0 0 1 60.1 78.1"/><path d="M71.5 38.5A36 36 0 0 1 71.5 89.5" opacity=".6"/><path d="M82.8 27.2A52 52 0 0 1 82.8 100.8" opacity=".3"/></g><path d="M102 17l3.5 7.5 7.5 3.5-7.5 3.5-3.5 7.5-3.5-7.5-7.5-3.5 7.5-3.5z" fill="#22d3ee"/></svg>';
var LOGO_URL = `data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`;
var HOME = "[data-guilds-bar-home]";
var ICON = 'svg[width="24"][height="24"]';
var logoCss = () => `${HOME} :has(> ${ICON}){background:url("${LOGO_URL}") center/100% 100% no-repeat!important;border-radius:30%!important}${HOME} ${ICON}{visibility:hidden}${HOME} :has(> ${ICON}):hover{filter:brightness(1.2)}`;
var titleBarCss = () => "#whisper-titlebar{position:fixed;top:5px;left:68px;height:24px;z-index:2147483647;display:flex;align-items:center;gap:8px;pointer-events:none;font:500 14px/24px var(--font-primary,sans-serif);color:var(--text-default,var(--text-normal,#dbdee1));opacity:.85}#whisper-titlebar button{pointer-events:auto;-webkit-app-region:no-drag;font:600 11px/18px var(--font-primary,sans-serif);padding:0 9px;border-radius:9px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;opacity:.8}#whisper-titlebar button:hover{opacity:1}html.theme-light #whisper-titlebar{color:#2e3338}html.whisper-outdated #whisper-titlebar{color:#f23f43;opacity:1}";

// src/features/gifs.ts
var GIF_VIDEO = 'li[id^="chat-messages-"] video[class*="embedVideo"]';
var observer2;
function lower(v) {
  if (v.paused && v.preload !== "none") v.preload = "none";
}
function stopGifs() {
  observer2?.disconnect();
  observer2 = void 0;
  document.querySelectorAll(GIF_VIDEO).forEach((v) => {
    if (v.paused) v.preload = "metadata";
  });
}
function syncGifs() {
  stopGifs();
  if (!on("gifsOnHover")) return;
  document.querySelectorAll(GIF_VIDEO).forEach(lower);
  observer2 = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => {
      if (!(n instanceof Element)) return;
      if (n.matches(GIF_VIDEO)) lower(n);
      n.querySelectorAll(GIF_VIDEO).forEach(lower);
    });
  });
  observer2.observe(document.body, { subtree: true, childList: true });
}

// src/core/i18n.ts
var langs = typeof navigator !== "undefined" && (navigator.languages?.length ? navigator.languages : [navigator.language]) || [];
var isEs = langs.some((l) => typeof l === "string" && l.toLowerCase().startsWith("es"));
var t = (es, en) => isEs ? es : en;

// src/features/lazyImages.ts
var MESSAGE_IMG = 'li[id^="chat-messages-"] :is(img[src*="/attachments/"],img[src*="/external/"])';
var GROUP_IMG = 'img[src*="/icons/"],img[src*="/channel-icons/"]';
var BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
var HOVER_DELAY = 150;
function tiny(src) {
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
var kind = (img) => settings.store.lazyImages && img.matches(MESSAGE_IMG) ? "msg" : settings.store.hideGroupIcons && img.matches(GROUP_IMG) ? "icon" : "";
var observer3;
var timer;
function lazy2(el) {
  let n = el;
  for (let i = 0; n && i < 5 && n.tagName !== "LI" && n !== document.body; i++, n = n.parentElement) {
    if (n instanceof HTMLImageElement) return n.dataset.whisperLazy ? n : null;
    const found = n.querySelectorAll("img[data-whisper-lazy]");
    if (found.length === 1) return found[0];
    if (found.length > 1) return null;
  }
  return null;
}
function freeze(img) {
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
function thaw(img, keepLoaded) {
  const src = img.dataset.whisperLazySrc;
  if (src) img.setAttribute("src", src);
  img.style.width = img.dataset.whisperW ?? "";
  img.style.height = img.dataset.whisperH ?? "";
  if (keepLoaded && src) img.dataset.whisperLoaded = src;
  if (img.dataset.whisperHadTitle) img.setAttribute("title", img.dataset.whisperTitle ?? "");
  else img.removeAttribute("title");
  for (const k of ["whisperLazy", "whisperLazySrc", "whisperW", "whisperH", "whisperTitle", "whisperHadTitle", "whisperTiny"]) delete img.dataset[k];
}
function onMutations2(records) {
  for (const r of records) {
    if (r.type === "attributes") {
      if (r.target instanceof HTMLImageElement) freeze(r.target);
      continue;
    }
    r.addedNodes.forEach((n) => {
      if (!(n instanceof Element)) return;
      if (n instanceof HTMLImageElement) freeze(n);
      else n.querySelectorAll("img").forEach(freeze);
    });
  }
}
var onOver2 = (e) => {
  const img = lazy2(e.target);
  clearTimeout(timer);
  if (img) timer = setTimeout(() => lazy2(img) && thaw(img, true), HOVER_DELAY);
};
var onOut2 = () => clearTimeout(timer);
var onActivate = (e) => {
  const el = e.target;
  const img = lazy2(el);
  if (img) thaw(img, true);
};
function stopLazyImages() {
  observer3?.disconnect();
  observer3 = void 0;
  clearTimeout(timer);
  document.removeEventListener("pointerover", onOver2);
  document.removeEventListener("pointerout", onOut2);
  document.removeEventListener("click", onActivate, true);
  document.removeEventListener("focusin", onActivate);
  document.querySelectorAll("img[data-whisper-lazy]").forEach((i) => thaw(i, false));
  document.querySelectorAll("img[data-whisper-loaded]").forEach((i) => delete i.dataset.whisperLoaded);
}
function syncLazyImages() {
  stopLazyImages();
  if (!settings.store.lazyImages && !settings.store.hideGroupIcons) return;
  document.querySelectorAll(`${MESSAGE_IMG},${GROUP_IMG}`).forEach(freeze);
  observer3 = new MutationObserver(onMutations2);
  observer3.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  document.addEventListener("pointerover", onOver2, { passive: true });
  document.addEventListener("pointerout", onOut2, { passive: true });
  document.addEventListener("click", onActivate, true);
  document.addEventListener("focusin", onActivate);
}

// src/features/css.ts
var style;
var cls = (name) => `:is([class^="${name}_"],[class*=" ${name}_"])`;
var VOICE = ':is([data-selenium-video-tile],[class*="voice"],[class*="Voice"])';
var hideRoute = (href) => `:is(li,[data-list-item-id]):has(a[href="${href}"]),a[href="${href}"]`;
var DNS_FONT = cls("dnsFont");
var INLINE_COLOR = ':is([style^="color:"],[style*="; color:"])';
var BADGE = 'img[src*="/badge-icons/"]';
function orGame(enabled, selectors, body) {
  if (enabled) return `${selectors.join(",")}{${body}}`;
  if (settings.store.gameMode) return `${selectors.map((s) => `html.whisper-gaming ${s}`).join(",")}{${body}}`;
  return "";
}
function build() {
  const me = UserStore?.getCurrentUser?.()?.id;
  const rules = [
    settings.store.hideWhenAsleep && "html.whisper-asleep #app-mount{display:none!important}html.whisper-asleep,html.whisper-asleep body{background:#0b0b0d!important}",
    orGame(
      on("noAnimations"),
      ["*", "*::before", "*::after"],
      "animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important"
    ),
    orGame(on("noBlur"), ["*"], "backdrop-filter:none!important"),
    // the green speaking ring is a box-shadow/outline: voice and call containers are always excluded (no stable speaking hook found)
    settings.store.noShadows && `*:not(${VOICE},${VOICE} *){box-shadow:none!important;text-shadow:none!important}`,
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
    (on("hideProfileTabs") || on("hideMutualTabs")) && "[data-whisper-hide]{display:none!important}",
    on("hideActiveNow") && `${cls("nowPlayingColumn")}{display:none!important}`,
    // the column wrapper (membersWrap_) and the list itself (data-list-id members-<channelId>); no :has() on a generic parent, so the chat can never be hidden
    on("hideMemberList") && `${cls("membersWrap")},[data-list-id^="members-"]{display:none!important}`,
    // variables defined on :root (and :root:lang(..)); !important beats their specificity. --font-code is left alone.
    on("systemFonts") && ':root:root{--font-primary:system-ui,"Segoe UI",sans-serif!important;--font-headline:system-ui,"Segoe UI",sans-serif!important;--font-nitro:system-ui,"Segoe UI",sans-serif!important}',
    // only the local preview inside my own call tile; the outgoing track is untouched
    on("hideOwnPreview") && me && `[data-selenium-video-tile="${me}"] :is(video,canvas){display:none!important}`,
    on("voiceVisuals") && `img[src*="/streams/"][src*="/preview"],${cls("voiceChannelEffectEmoji")}{display:none!important}`
  ];
  return rules.filter(Boolean).join("\n");
}
function syncCss() {
  if (!style) {
    style = document.createElement("style");
    style.id = "whisper-css";
    document.head.append(style);
  }
  const css = build();
  if (style.textContent !== css) style.textContent = css;
}
function stopCss() {
  style?.remove();
  style = void 0;
}

// src/core/state.ts
var state = { asleep: false, gaming: false, focused: true, outdated: false };
var onChange = () => {
};
var observer4;
function restoreClasses() {
  const list = document.documentElement.classList;
  for (const key of Object.keys(state)) if (state[key] && !list.contains(`whisper-${key}`)) list.add(`whisper-${key}`);
}
var onStateChange = (cb) => {
  onChange = cb;
};
function setState(key, value) {
  if (state[key] === value) return;
  state[key] = value;
  document.documentElement.classList.toggle(`whisper-${key}`, value);
  observer4 ??= ((o) => (o.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }), o))(new MutationObserver(restoreClasses));
  onChange();
}
function resetState() {
  onChange = () => {
  };
  observer4?.disconnect();
  observer4 = void 0;
  for (const key of Object.keys(state)) document.documentElement.classList.remove(`whisper-${key}`);
  Object.assign(state, { asleep: false, gaming: false, focused: true, outdated: false });
}

// src/core/discordPrefs.ts
var REASON = "REDUCED_MOTION";
var ANIMATE_ON_INTERACTION = 1;
var ours = /* @__PURE__ */ new Map();
var prevMotion;
function wanted() {
  const g = state.gaming;
  const w = {};
  if (on("gifsOnHover") || g) w.gifAutoPlay = false;
  if (on("staticEmojis") || g) w.animateEmoji = false;
  if (on("staticStickers") || g) w.animateStickers = ANIMATE_ON_INTERACTION;
  return w;
}
function clear(keys) {
  const mine = keys.filter((k) => OverridesStore.getOverride(k) === ours.get(k));
  keys.forEach((k) => ours.delete(k));
  if (mine.length) FluxDispatcher.dispatch({ type: "USER_SETTINGS_OVERRIDE_CLEAR", settings: mine });
}
var saved = {
  get: () => settings.store.prevMotion || void 0,
  set: (v) => {
    settings.store.prevMotion = v ?? "";
  }
};
var setReduced = (v) => FluxDispatcher.dispatch({ type: "ACCESSIBILITY_SET_PREFERS_REDUCED_MOTION", prefersReducedMotion: v });
function setMotion(reduce) {
  const raw = AccessibilityStore.rawPrefersReducedMotion;
  if (reduce) {
    if (prevMotion === void 0) {
      prevMotion = saved.get() ?? (raw !== "reduce" ? raw : void 0);
      saved.set(prevMotion);
    }
    if (raw !== "reduce") setReduced("reduce");
  } else {
    const p = prevMotion ?? saved.get();
    if (p === void 0) return;
    setReduced(p);
    prevMotion = void 0;
    saved.set(void 0);
  }
}
function syncPrefs() {
  const w = wanted();
  const apply = {};
  for (const [key, value] of Object.entries(w)) {
    const cur = OverridesStore.getOverride(key);
    if (cur != null && cur === ours.get(key)) continue;
    ours.delete(key);
    if (cur != null) continue;
    ours.set(key, apply[key] = { value, reasonKey: REASON });
  }
  if (Object.keys(apply).length) FluxDispatcher.dispatch({ type: "USER_SETTINGS_OVERRIDE_APPLY", settings: apply });
  clear([...ours.keys()].filter((k) => !(k in w)));
  setMotion(on("reducedMotion") || state.gaming);
}
function stopPrefs() {
  clear([...ours.keys()]);
  setMotion(false);
}

// src/features/gameMode.ts
function detectGame() {
  const was = state.gaming;
  setState("gaming", settings.store.gameMode && !!RunningGameStore?.getVisibleRunningGames?.().some((g) => !g.isLauncher));
  if (!was && state.gaming && IS_DISCORD_DESKTOP) try {
    DiscordNative.processUtils?.purgeMemory?.();
  } catch {
  }
}
var fps = 0;
function setFps(value) {
  if (value === fps) return;
  fps = value;
  if (IS_DISCORD_DESKTOP) DiscordNative.window?.setFrameRate?.(null, value);
}
function syncFps() {
  const limit = Math.max(0, settings.store.fpsLimit);
  setFps(limit && (state.asleep || state.gaming && !state.focused) ? limit : 0);
}
var stopFps = () => setFps(0);

// src/filters/mutedDrop.ts
var TYPES = /* @__PURE__ */ new Set(["MESSAGE_CREATE", "MESSAGE_UPDATE", "TYPING_START"]);
var dispatcher2 = () => FluxDispatcher;
function isMuted(channelId, guildId) {
  if (!guildId) return !!UserGuildSettingsStore.isChannelMuted(null, channelId);
  return !!UserGuildSettingsStore.isGuildOrCategoryOrChannelMuted(guildId, channelId);
}
function shouldDrop(action) {
  const { message } = action;
  const channelId = action.channelId ?? message?.channel_id;
  if (!channelId || channelId === SelectedChannelStore.getChannelId()) return false;
  const me = UserStore.getCurrentUser()?.id;
  if (!me) return false;
  if (message) {
    if (!message.author?.id || !Array.isArray(message.mentions)) return false;
    if (message.author.id === me) return false;
    if (message.mentions.some((u) => (u?.id ?? u) === me)) return false;
    if (message.referenced_message?.author?.id === me) return false;
  } else if (!action.userId || action.userId === me) return false;
  const guildId = ChannelStore.getChannel(channelId)?.guild_id ?? action.guildId ?? message?.guild_id;
  return isMuted(channelId, guildId);
}
var block2 = (action) => {
  if (!TYPES.has(action.type)) return false;
  try {
    if (!shouldDrop(action)) return false;
    if (action.message) ChannelMessages.clear(action.channelId ?? action.message.channel_id);
    return true;
  } catch {
    return false;
  }
};
function stopMutedDrop() {
  const list = dispatcher2()._interceptors;
  if (list?.includes(block2)) list.splice(list.indexOf(block2), 1);
}
function syncMutedDrop() {
  stopMutedDrop();
  if (settings.store.dropMutedMessages) dispatcher2().addInterceptor?.(block2);
}

// src/core/meta.ts
var VERSION = "1.0.0";
var KOFI = "https://ko-fi.com/011xuca";
var SOCIALS = "https://011xuca.github.io/links/";

// src/ui/presets.ts
var LIGHT = ["noAnimations", "reducedMotion", "noBlur", "gifsOnHover", "staticEmojis", "staticStickers", "hideTyping", "blockTypingEvents", "systemFonts"];
var BALANCED = [...LIGHT, "gameMode", "noShadows", "hideEmbeds", "hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "plainNames", "hideActiveNow", "hideQuestPopups", "hideQuestsEntry", "hideShopNitro", "hidePromoBanners", "blockTelemetry"];
var MAX = [...BALANCED, "ecoMode", "lazyImages", "hideGroupIcons", "dropMutedMessages", "blockTypingEvents", "hideBanners", "plainProfileThemes", "hideProfileBadges", "hideProfileTabs", "hideMemberList", "hideGuildTags", "plainRoleColors", "voiceVisuals", "hideOwnPreview", "closeStreamsWhenAsleep", "disableCamerasWhenAsleep", "reopenOnWake"];
var GAMING = ["gameMode", "noAnimations", "reducedMotion", "noBlur", "noShadows", "gifsOnHover", "staticEmojis", "staticStickers", "hideTyping", "hideOwnPreview", "voiceVisuals", "hideQuestPopups", "blockTelemetry"];
var PRESETS = [
  { id: "light", name: t("Ligero", "Light"), desc: t("Recortes visuales sin perder funciones", "Visual cuts without losing features"), on: LIGHT },
  { id: "balanced", name: t("Equilibrado", "Balanced"), desc: t("Ligero + sin promos, sin adornos de perfil y sin telemetria", "Light + no promos, no profile decorations, no telemetry"), on: BALANCED },
  { id: "max", name: t("Maximo ahorro", "Maximum savings"), desc: t("Casi todo recortado: medios bajo demanda, silenciados sin cargar, sin lista de miembros", "Almost everything trimmed: media on demand, muted not loaded, no member list"), on: MAX },
  { id: "gaming", name: t("Gaming", "Gaming"), desc: t("Para jugar con Discord en segundo plano: modo juego y menos efectos", "For playing with Discord in the background: game mode and fewer effects"), on: GAMING }
];
var KEEP = ["hideWhenAsleep", "customLogo", "checkUpdates", "notifiedVersion"];
function applyPreset(p) {
  const def = settings.def;
  for (const key of Object.keys(def)) {
    if (KEEP.includes(key) || typeof def[key].default !== "boolean") continue;
    settings.store[key] = p.on.includes(key);
  }
}

// src/core/restart.ts
var RESTART_KEYS = ["ecoMode", "reducedMotion", "gifsOnHover", "staticEmojis", "staticStickers", "avatarsOnHover", "defaultAvatars", "blockTypingEvents", "dropMutedMessages", "hideQuestPopups", "blockTelemetry"];
var asked = false;
function restartDiscord() {
  try {
    window.DiscordNative.app.relaunch();
  } catch (e) {
    console.error("[Whisper] relaunch fallo:", e);
  }
}
function onSettingChange(key) {
  if (asked || !RESTART_KEYS.includes(key)) return;
  asked = true;
  BdApi.UI.showConfirmationModal(
    t("Reiniciar Discord", "Restart Discord"),
    t("Este ajuste puede necesitar reiniciar Discord para aplicarse del todo.", "This setting may need a Discord restart to fully apply."),
    { confirmText: t("Reiniciar ahora", "Restart now"), cancelText: t("Mas tarde", "Later"), onConfirm: restartDiscord }
  );
}

// src/ui/settingsMeta.ts
var CATEGORIES = [
  { id: "sleep", title: t("Dormir y ventana", "Sleep and window"), icon: "😴", color: "#8b5cf6" },
  { id: "game", title: t("Modo juego y FPS", "Game mode and FPS"), icon: "🎮", color: "#22c55e" },
  { id: "fx", title: t("Animaciones y efectos", "Animations and effects"), icon: "✨", color: "#f59e0b" },
  { id: "media", title: t("Media del chat", "Chat media"), icon: "🖼️", color: "#06b6d4" },
  { id: "msgs", title: t("Mensajes y silenciados", "Messages and muted"), icon: "💬", color: "#3b82f6" },
  { id: "ui", title: t("Interfaz", "Interface"), icon: "🧩", color: "#ec4899" },
  { id: "profiles", title: t("Perfiles y personalizacion", "Profiles and personalization"), icon: "👤", color: "#f97316" },
  { id: "voice", title: t("Llamadas y voz", "Calls and voice"), icon: "🎙️", color: "#14b8a6" },
  { id: "promos", title: t("Promos y anuncios", "Promos and ads"), icon: "📢", color: "#ef4444" },
  { id: "privacy", title: t("Privacidad", "Privacy"), icon: "🔒", color: "#64748b" },
  { id: "brand", title: t("Marca", "Branding"), icon: "🏷️", color: "#a855f7" },
  { id: "updates", title: t("Actualizaciones", "Updates"), icon: "🔄", color: "#84cc16" }
];
var META = [
  {
    key: "hideWhenAsleep",
    cat: "sleep",
    type: "bool",
    title: t("Dormir al minimizar o taparse", "Sleep when minimized or covered"),
    desc: t("Dormir (apagado por defecto): oculta la interfaz (CSS, sin desmontar React: la voz sigue) SOLO cuando Discord se minimiza o queda tapado por completo por otra ventana (por ejemplo OBS a pantalla completa). Lo segundo usa la deteccion de ventana tapada de Chromium y funciona sin flags en las versiones probadas (Discord estable y Canary); si en tu version solo detecta minimizar, inicia Discord con --enable-features=CalculateNativeWinOcclusion. Perder el foco (hacer click en otra ventana o monitor) NO lo duerme: ideal para un segundo monitor. Si lo dejas apagado, Discord nunca se duerme", "Sleep (off by default): hides the UI (CSS only, React stays mounted so voice keeps working) ONLY when Discord is minimized or fully covered by another window (e.g. fullscreen OBS). The covered case uses Chromium's covered-window detection and works without flags on the tested builds (Discord stable and Canary); if on yours it only detects minimizing, start Discord with --enable-features=CalculateNativeWinOcclusion. Losing focus (clicking another window or monitor) does NOT sleep it: ideal for a second monitor. If left off, Discord never sleeps")
  },
  {
    key: "delaySeconds",
    cat: "sleep",
    type: "number",
    title: t("Segundos antes de dormir", "Seconds before sleeping"),
    desc: t("Dormir: segundos minimizado u oculto antes de dormir", "Sleep: seconds minimized/hidden before sleeping")
  },
  {
    key: "gameMode",
    cat: "game",
    type: "bool",
    title: t("Modo juego", "Game mode"),
    desc: t("Modo juego: con un juego abierto fuerza sin animaciones, sin blur, movimiento reducido y GIF/emoji/stickers estaticos; al empezar el juego libera una vez las caches de Blink (unos 25 MB de RAM)", "Game mode: while a game is running, force no animations, no blur, reduced motion and static GIFs/emojis/stickers; when the game starts it frees Blink's caches once (about 25 MB of RAM)")
  },
  {
    key: "fpsLimit",
    cat: "game",
    type: "number",
    title: t("Limite de FPS", "FPS limit"),
    desc: t("Limite de FPS de la ventana cuando esta dormida o hay un juego y Discord no tiene foco (0 = no limitar, recomendado). Usa la misma API nativa que el Game Mode de Discord; en versiones sin esa API no hace nada", "Window FPS limit while asleep, or while a game runs and Discord is unfocused (0 = no limit, recommended). Uses the same native API as Discord's Game Mode; does nothing on versions without it")
  },
  {
    key: "ecoMode",
    cat: "fx",
    type: "bool",
    title: t("Ahorro maximo (maestro)", "Maximum savings (master)"),
    desc: t("MAESTRO: Ahorro maximo. Fuerza: sin animaciones, movimiento reducido, sin blur, GIFs/emojis/stickers solo con el mouse, avatares animados solo con el mouse, sin efectos de perfil, sin decoraciones de avatar, sin nameplates, nombres planos, ocultar previews de streams/efectos de voz y mi propia vista previa en llamadas. NO fuerza sombras, embeds, mensajes diferidos, indicador de escritura, banners, temas de perfil ni avatares por defecto (esos siguen con su propio ajuste)", "MASTER: Maximum savings. Forces: no animations, reduced motion, no blur, GIFs/emojis/stickers only on hover, animated avatars only on hover, no profile effects, no avatar decorations, no nameplates, plain names, hide stream previews/voice effects and my own call preview. Does NOT force shadows, embeds, lazy messages, typing indicator, banners, profile themes or default avatars (those keep their own setting)")
  },
  {
    key: "group:g0",
    cat: "fx",
    type: "bool",
    keys: ["noAnimations", "reducedMotion", "noBlur", "noShadows"],
    title: t("Efectos visuales apagados", "Visual effects off"),
    desc: t("Sin animaciones, movimiento reducido, sin desenfoques y sin sombras, todo junto", "No animations, reduced motion, no blur and no shadows, all together")
  },
  {
    key: "group:g1",
    cat: "media",
    type: "bool",
    keys: ["gifsOnHover", "staticEmojis", "staticStickers"],
    title: t("Emojis, stickers y GIFs al pasar el mouse", "Emojis, stickers and GIFs on hover"),
    desc: t("GIFs, emojis y stickers quietos hasta pasar el mouse", "GIFs, emojis and stickers still until hovered")
  },
  {
    key: "hideEmbeds",
    cat: "media",
    type: "bool",
    title: t("Ocultar embeds", "Hide embeds"),
    desc: t("Ocultar previews de links (embeds) con CSS. Para cortar tambien la descarga usa el ajuste de Discord 'Mostrar vista previa de enlaces'", "Hide link previews (embeds) with CSS. To also stop the download, use Discord's 'Show link previews' setting")
  },
  {
    key: "lazyImages",
    cat: "media",
    type: "bool",
    title: t("Imagenes bajo demanda", "Images on demand"),
    desc: t("[Experimental] Las imagenes de adjuntos y embeds en los mensajes se reemplazan por una miniatura borrosa y se cargan al pasar el mouse (150 ms), al hacer clic o con el teclado; una vez cargadas se quedan. No toca avatares, emojis, stickers ni el visor. Limitacion: si Discord ya pidio la imagen antes del reemplazo, la descarga no se evita (solo se evita mostrarla/decodificarla)", "[Experimental] Attachment and embed images in messages are swapped for a tiny blurred thumbnail and load on hover (150 ms), click or keyboard focus; once loaded they stay. Does not touch avatars, emojis, stickers or the viewer. Limitation: if Discord already requested the image before the swap, the download is not avoided (only displaying/decoding it is)")
  },
  {
    key: "hideGroupIcons",
    cat: "media",
    type: "bool",
    title: t("Fotos de servidores y grupos bajo demanda", "Server and group icons on demand"),
    desc: t("[Experimental] Los iconos de servidores y de grupos de mensajes privados no se muestran hasta pasar el mouse sobre ellos (quedan en gris). Limitacion: si Discord ya pidio el icono antes del reemplazo, la descarga no se evita", "[Experimental] Server and group-DM icons are not shown until you hover them (they stay gray). Limitation: if Discord already requested the icon before the swap, the download is not avoided")
  },
  {
    key: "blurImages",
    cat: "media",
    type: "bool",
    title: t("Imagenes borrosas", "Blurred images"),
    desc: t("Las imagenes de adjuntos y embeds se ven borrosas y en grises hasta pasar el mouse. No evita la descarga, solo el aspecto", "Attachment and embed images look blurred and gray until hovered. Does not avoid the download, only the look")
  },
  {
    key: "blurAmount",
    cat: "media",
    type: "number",
    title: t("Intensidad del desenfoque (px)", "Blur strength (px)"),
    desc: t("Desenfoque de 'Imagenes borrosas' en pixeles (0 a 50)", "Blur of 'Blurred images' in pixels (0 to 50)")
  },
  {
    key: "lazyMessages",
    cat: "msgs",
    type: "bool",
    title: t("Mensajes diferidos", "Lazy messages"),
    desc: t("[Experimental] No pintar mensajes fuera de pantalla (content-visibility). Puede causar saltos de scroll", "[Experimental] Skip painting off-screen messages (content-visibility). May cause scroll jumps")
  },
  {
    key: "group:g4",
    cat: "msgs",
    type: "bool",
    keys: ["hideTyping", "blockTypingEvents"],
    title: t("Escritura ignorada", "Typing ignored"),
    desc: t("Oculta 'esta escribiendo' y descarta los eventos de escritura", "Hides 'is typing' and drops typing events")
  },
  {
    key: "dropMutedMessages",
    cat: "msgs",
    type: "bool",
    title: t("Silenciados no cargan nada", "Muted load nothing"),
    desc: t("[Experimental] Silenciados no cargan nada: descarta (filtro de Flux) los mensajes nuevos, ediciones y 'esta escribiendo' de servidores, canales y chats directos/grupos silenciados, para que Discord no los procese ni guarde en memoria. Nunca descarta: el canal abierto, tus mensajes, menciones directas a ti ni respuestas a tus mensajes; ante cualquier duda no descarta. Al abrir un canal silenciado Discord vuelve a cargar sus mensajes normalmente. Los silenciados no mostraran indicador de no leido", "[Experimental] Muted load nothing: drops (Flux filter) new messages, edits and typing events from muted servers, channels and DMs/group chats, so Discord does not process or cache them. Never drops: the open channel, your messages, direct mentions of you or replies to your messages; when in doubt it does not drop. Opening a muted channel makes Discord load its messages normally. Muted ones will not show an unread indicator")
  },
  {
    key: "noPersonalization",
    cat: "profiles",
    type: "bool",
    title: t("Sin personalizacion (maestro)", "No personalization (master)"),
    desc: t("MAESTRO: desactivar toda la personalizacion (fuerza todos los ajustes de perfil de abajo, excepto 'avatares por defecto'; ademas fuerza ocultar etiquetas de servidor, colores de rol planos y ocultar insignias, que estan en Interfaz y Perfiles)", "MASTER: disable all personalization (forces every profile setting below, except 'default avatars'; it also forces hide server tags, plain role colors and hide badges, which live in Interface and Profiles)")
  },
  {
    key: "group:g2",
    cat: "profiles",
    type: "bool",
    keys: ["hideProfileEffects", "hideAvatarDecorations", "hideNameplates", "hideBanners", "plainProfileThemes"],
    title: t("Perfiles sin adornos", "Plain profiles"),
    desc: t("Oculta efectos de perfil, decoraciones de avatar, nameplates, banners y temas de perfil", "Hides profile effects, avatar decorations, nameplates, banners and profile themes")
  },
  {
    key: "plainNames",
    cat: "profiles",
    type: "bool",
    title: t("Nombres planos", "Plain names"),
    desc: t("Perfil: nombres planos (sin fuente, color, degradado ni efecto de estilos de nombre, en mensajes, miembros, perfiles, llamadas y DM). El color del rol del servidor es aparte: quitalo con 'Colores de rol planos'", "Profile: plain names (no custom font, color, gradient or effect from name styles, in messages, members, profiles, calls and DMs). The server role color is separate: remove it with 'Plain role colors'")
  },
  {
    key: "avatarsOnHover",
    cat: "profiles",
    type: "bool",
    title: t("Avatares animados al pasar el mouse", "Animated avatars on hover"),
    desc: t("Avatares, banners e iconos animados solo con el mouse encima (en reposo, frame estatico)", "Animated avatars, banners and icons only on hover (static frame otherwise)")
  },
  {
    key: "defaultAvatars",
    cat: "profiles",
    type: "bool",
    title: t("Avatares por defecto", "Default avatars"),
    desc: t("Reemplazar todas las fotos de perfil por el avatar por defecto de Discord", "Replace all profile pictures with Discord's default avatar")
  },
  {
    key: "hideGuildTags",
    cat: "ui",
    type: "bool",
    title: t("Ocultar etiquetas de servidor", "Hide server tags"),
    desc: t("[Experimental] Interfaz: ocultar las etiquetas de servidor (los chips tipo 'Loaf' o 'ZZZ' junto al nombre) en mensajes, lista de miembros y perfiles. Usa una clase con hash por prefijo (chipletContainerInner): puede dejar de funcionar tras una actualizacion. Ahorro minimo: solo evita dibujarlas", "[Experimental] Interface: hide server tags (the 'Loaf' or 'ZZZ' style chips next to the name) in messages, the member list and profiles. Uses a hashed class by prefix (chipletContainerInner): may stop working after an update. Minimal savings: it only avoids drawing them")
  },
  {
    key: "plainRoleColors",
    cat: "ui",
    type: "bool",
    title: t("Colores de rol planos", "Plain role colors"),
    desc: t("[Experimental] Interfaz: nombres sin el color ni el degradado del rol (color neutro/heredado) en mensajes y lista de miembros. El ahorro es minimo, es mas estetico. Usa clases con hash por prefijo (nameContainer, username, usernameGradient); la cabecera de los mensajes no se pudo comprobar en el codigo de Discord", "[Experimental] Interface: names without the role color or role gradient (neutral/inherited color) in messages and the member list. Savings are minimal, it is mostly aesthetic. Uses hashed classes by prefix (nameContainer, username, usernameGradient); the message header could not be checked in Discord's code")
  },
  {
    key: "systemFonts",
    cat: "ui",
    type: "bool",
    title: t("Fuentes del sistema", "System fonts"),
    desc: t("Interfaz: usar la fuente del sistema (system-ui, Segoe UI) en vez de las fuentes de Discord (gg sans, titulares y Nitro) sobreescribiendo las variables CSS --font-primary, --font-headline y --font-nitro. La fuente de codigo no se toca. Las reglas de Discord con la fuente escrita a mano pueden seguir usando la suya y el ancho del texto cambia un poco", "Interface: use the system font (system-ui, Segoe UI) instead of Discord's fonts (gg sans, headline and Nitro) by overriding the CSS variables --font-primary, --font-headline and --font-nitro. The code font is untouched. Discord rules with a hard-coded font may keep theirs, and text width changes slightly")
  },
  {
    key: "hideActiveNow",
    cat: "ui",
    type: "bool",
    title: t("Ocultar 'Activos ahora'", "Hide 'Active Now'"),
    desc: t("[Experimental] Interfaz: ocultar la columna 'Activos ahora' de la pestana Amigos (clase con hash por prefijo: nowPlayingColumn). Solo la oculta con CSS: Discord sigue calculando su contenido", "[Experimental] Interface: hide the 'Active Now' column of the Friends tab (hashed class by prefix: nowPlayingColumn). It is only hidden with CSS: Discord keeps computing its content")
  },
  {
    key: "hideMemberList",
    cat: "ui",
    type: "bool",
    title: t("Ocultar lista de miembros", "Hide member list"),
    desc: t("Interfaz: ocultar la lista de miembros del canal con CSS (atributo data-list-id='members-...'). Discord tiene su propio boton para esto que ademas la desmonta y ahorra mas; este ajuste solo la oculta (sigue montada y actualizandose)", "Interface: hide the channel member list with CSS (data-list-id='members-...' attribute). Discord has its own button for this that also unmounts it and saves more; this setting only hides it (it stays mounted and updating)")
  },
  {
    key: "group:g3",
    cat: "profiles",
    type: "bool",
    keys: ["hideProfileBadges", "hideProfileTabs"],
    title: t("Perfil sin extras", "Profile without extras"),
    desc: t("Oculta insignias y las pestanas Tablero, Actividad y Lista de deseados", "Hides badges and the Board, Activity and Wishlist tabs")
  },
  {
    key: "hideMutualTabs",
    cat: "profiles",
    type: "bool",
    title: t("Ocultar pestanas de en comun", "Hide mutual tabs"),
    desc: t("Oculta las pestanas de amigos y servidores en comun del perfil (apagado: son las unicas que quedan junto con 'Perfil sin extras')", "Hides the mutual friends and servers tabs on profiles (off: they are the only ones left when 'Profile without extras' is on)")
  },
  {
    key: "dropPresence",
    cat: "msgs",
    type: "bool",
    title: t("Descartar presencia", "Drop presence"),
    desc: t("[Experimental] CPU: descarta las actualizaciones de presencia (accion Flux PRESENCE_UPDATES) para reducir CPU en servidores grandes. AVISO: dejaras de ver el estado en vivo de tus amigos y miembros (en linea, ausente, jugando). Tu propio estado no se toca (un lote que te incluya pasa completo) y ante cualquier duda o error no descarta. No cubre PRESENCES_REPLACE ni las presencias que llegan dentro de GUILD_CREATE", "[Experimental] CPU: drops presence updates (Flux action PRESENCE_UPDATES) to cut CPU in big servers. WARNING: you will stop seeing live status of your friends and members (online, idle, playing). Your own status is untouched (a batch that includes you passes whole) and on any doubt or error nothing is dropped. Does not cover PRESENCES_REPLACE or the presences inside GUILD_CREATE")
  },
  {
    key: "group:g6",
    cat: "voice",
    type: "bool",
    keys: ["hideOwnPreview", "voiceVisuals"],
    title: t("Llamada sin vistas previas", "Call without previews"),
    desc: t("Oculta mi vista previa, previews de streams y efectos de voz", "Hides my preview, stream previews and voice effects")
  },
  {
    key: "group:g7",
    cat: "voice",
    type: "bool",
    keys: ["closeStreamsWhenAsleep", "disableCamerasWhenAsleep", "reopenOnWake"],
    title: t("Ahorro al dormir en llamada", "Call savings when asleep"),
    desc: t("Al dormir cierra streams y apaga camaras de otros; al despertar los reabre", "When asleep closes streams and turns off others' cameras; reopens them on wake")
  },
  {
    key: "voiceLite",
    cat: "voice",
    type: "bool",
    title: t("Voz ligera en juego", "Light voice while gaming"),
    desc: t("Mientras hay un juego abierto (requiere 'Modo juego') y estas en una llamada, cambia la supresion de ruido de Krisp a una mas liviana para tu microfono. Al cerrar el juego, salir de la llamada o apagar esto vuelve exactamente a lo que tenias; si Discord se cierra en medio, se restaura al abrirlo de nuevo. Si la cambias a mano mientras esta activo, se respeta tu eleccion. Lo que escuchas no cambia", "While a game is running (requires 'Game mode') and you are in a call, switch noise suppression from Krisp to a lighter one for your microphone. Closing the game, leaving the call or turning this off restores exactly what you had; if Discord closes meanwhile, it is restored on the next start. If you change it by hand while active, your choice is kept. What you hear is unchanged")
  },
  {
    key: "voiceLiteMode",
    cat: "voice",
    type: "select",
    title: t("Supresion de ruido en juego", "Noise suppression while gaming"),
    desc: t("Nivel a usar con 'Voz ligera en juego': Estandar (filtro liviano de Discord) o Ninguna (sin filtro, minimo consumo). Solo baja, nunca sube; un cambio se aplica la proxima vez que se active", "Level used by 'Light voice while gaming': Standard (Discord's light filter) or None (no filter, lowest cost). Only lowers, never raises; a change applies the next time it activates")
  },
  {
    key: "streamHelp",
    cat: "voice",
    type: "note",
    title: t("Transmisiones mas livianas (manual)", "Lighter streams (manual)"),
    desc: t("Whisper no cambia la calidad de tu transmision: Discord solo permite hacerlo reiniciando la captura en vivo y lo guarda como tu preferencia. Para que pese menos: al iniciar Go Live elige 720p y 30 FPS. La codificacion por hardware ya la usa Discord automaticamente. Deja activada la aceleracion por hardware en Ajustes > Avanzado (Advanced). Discord no tiene un ajuste para recibir transmisiones ajenas en menor calidad: cierra las que no mires ('Cerrar streams al dormir' lo hace al minimizar)", "Whisper does not change your stream quality: Discord only allows it by restarting the live capture and saves it as your preference. To make it lighter: pick 720p and 30 FPS when starting Go Live. Discord already uses hardware encoding automatically. Keep hardware acceleration on in Settings > Advanced. Discord has no setting to receive others' streams at lower quality: close the ones you are not watching ('Close streams when asleep' does it when minimized)")
  },
  {
    key: "group:g5",
    cat: "promos",
    type: "bool",
    keys: ["hideQuestPopups", "hideQuestsEntry", "hideShopNitro", "hidePromoBanners"],
    title: t("Sin promos de Discord", "No Discord promos"),
    desc: t("Misiones promocionadas, entrada de Misiones, Tienda/Nitro/lista de deseados y banners de promocion", "Promoted Quests, Quests entry, Shop/Nitro/wishlist and promo banners")
  },
  {
    key: "blockTelemetry",
    cat: "privacy",
    type: "bool",
    title: t("Bloquear telemetria", "Block telemetry"),
    desc: t("Privacidad: descarta las acciones Flux 'TRACK' (la cola de analiticas/'science' de Discord) antes de procesarlas. NO cubre Sentry ni las metricas internas (BetterDiscord no los bloquea); puede detener el progreso de insignias por horas jugadas", "Privacy: drops Flux 'TRACK' actions (Discord's analytics/'science' queue) before they are processed. Does NOT cover Sentry or internal metrics (BetterDiscord does not block them); may stop hours-played badge progress")
  },
  {
    key: "customLogo",
    cat: "brand",
    type: "bool",
    title: t("Logo de Whisper", "Whisper logo"),
    desc: t("Marca: reemplazar el icono de Discord del boton Inicio por el logo de Whisper (CSS, por el atributo data-guilds-bar-home)", "Branding: replace the Discord icon on the Home button with the Whisper logo (CSS, via the data-guilds-bar-home attribute)")
  },
  {
    key: "checkUpdates",
    cat: "updates",
    type: "bool",
    title: t("Avisar de nuevas versiones", "Notify of new versions"),
    desc: t("Avisar cuando haya una version nueva en GitHub (solo avisa, no descarga nada)", "Notify when a new version is on GitHub (notify only, downloads nothing)")
  }
];

// src/ui/panel.ts
var MASTERS = [
  { key: "ecoMode", list: ECO, name: t("Ahorro maximo", "Maximum savings") },
  { key: "noPersonalization", list: PERSONALIZATION, name: t("Sin personalizacion", "No personalization") }
];
var MAX2 = { delaySeconds: 3600, fpsLimit: 240, blurAmount: 50 };
var store2 = settings.store;
var ported = (k) => k in settings.def;
var forcedBy = (k) => MASTERS.find((x) => store2[x.key] && x.list.includes(k));
var drawers = {};
var RESET_BODY = t("Todos los ajustes de Whisper volveran a su valor por defecto.", "All Whisper settings will go back to their defaults.");
function row(m, refresh) {
  if (m.keys) {
    const keys = m.keys.filter(ported);
    if (!keys.length) return null;
    return {
      type: "switch",
      id: m.key,
      name: m.title,
      note: m.desc,
      value: keys.every((k) => forcedBy(k) || store2[k]),
      disabled: keys.every((k) => forcedBy(k)),
      onChange: (v) => {
        for (const k of keys) store2[k] = v;
        refresh();
      }
    };
  }
  if (!ported(m.key)) return null;
  if (m.type === "bool") {
    const master = forcedBy(m.key);
    return {
      type: "switch",
      id: m.key,
      name: m.title,
      note: m.desc + (master ? ` (${t("forzado por", "forced by")} ${master.name})` : ""),
      value: !!master || !!store2[m.key],
      disabled: !!master,
      onChange: (v) => {
        store2[m.key] = v;
        if (MASTERS.some((x) => x.key === m.key)) refresh();
      }
    };
  }
  if (m.type === "number") {
    const max = MAX2[m.key] ?? 9999;
    return {
      type: "number",
      id: m.key,
      name: m.title,
      note: m.desc,
      value: store2[m.key],
      min: 0,
      max,
      step: 1,
      onChange: (v) => {
        store2[m.key] = Math.min(max, Math.max(0, Number(v) || 0));
      }
    };
  }
  return null;
}
var button = (id, name, note, label, onClick, color) => ({ type: "button", id, name, note, children: label, onClick, ...color ? { color } : {} });
var confirm = (title, body, ok, onConfirm) => BdApi.UI.showConfirmationModal(title, body, { confirmText: ok, cancelText: t("Cancelar", "Cancel"), onConfirm });
var open = (url) => window.open(url, "_blank", "noopener");
function build2(refresh) {
  const top = [];
  if (KOFI.startsWith("https://")) top.push(button("kofi", `Whisper v${VERSION}`, t("Apoyar en Ko-fi", "Support on Ko-fi"), "Ko-fi", () => open(KOFI)));
  if (SOCIALS.startsWith("https://")) top.push(button("socials", t("Mis redes", "My socials"), SOCIALS, t("Redes", "Socials"), () => open(SOCIALS)));
  const resetTitle = t("Restablecer valores por defecto", "Reset to defaults");
  const presets = {
    type: "category",
    id: "presets",
    name: t("Perfiles", "Presets"),
    collapsible: true,
    shown: drawers.presets ?? true,
    settings: [
      ...PRESETS.map((p) => button(
        `preset-${p.id}`,
        p.name,
        p.desc,
        t("Aplicar", "Apply"),
        () => confirm(p.name, p.desc, t("Aplicar", "Apply"), () => {
          applyPreset(p);
          refresh();
        })
      )),
      button("restart", t("Reiniciar Discord", "Restart Discord"), "", t("Reiniciar", "Restart"), restartDiscord),
      button(
        "reset",
        resetTitle,
        RESET_BODY,
        t("Restablecer", "Reset"),
        () => confirm(resetTitle, RESET_BODY, t("Restablecer", "Reset"), () => {
          resetDefaults();
          refresh();
        }),
        "bd-button-color-red"
      )
    ]
  };
  const cats = CATEGORIES.map((c) => ({
    type: "category",
    id: c.id,
    name: `${c.icon} ${c.title}`,
    collapsible: true,
    shown: drawers[c.id] ?? false,
    settings: META.filter((m) => m.cat === c.id).map((m) => row(m, refresh)).filter(Boolean)
  })).filter((c) => c.settings.length);
  return [...top, presets, ...cats];
}
function SettingsPanel() {
  const { useState, createElement } = BdApi.React;
  const [rev, setRev] = useState(0);
  const refresh = () => setRev((r) => r + 1);
  return createElement("div", { key: rev }, BdApi.UI.buildSettingsPanel({
    settings: build2(refresh),
    getDrawerState: (id, def) => drawers[id] ?? def,
    onDrawerToggle: (id, shown) => {
      drawers[id] = shown;
    }
  }));
}

// src/filters/presence.ts
var dispatcher3 = () => FluxDispatcher;
var block3 = (action) => {
  if (action.type !== "PRESENCE_UPDATES") return false;
  try {
    const me = UserStore.getCurrentUser()?.id;
    const { updates } = action;
    return !!me && Array.isArray(updates) && updates.length > 0 && updates.every((u) => !!u?.user?.id && u.user.id !== me);
  } catch {
    return false;
  }
};
function stopPresence() {
  const list = dispatcher3()._interceptors;
  if (list?.includes(block3)) list.splice(list.indexOf(block3), 1);
}
function syncPresence() {
  stopPresence();
  if (settings.store.dropPresence) dispatcher3().addInterceptor?.(block3);
}

// src/features/profileTabs.ts
var SECTIONS = ["WIDGETS", "ACTIVITY", "WISHLIST", "MUTUAL_FRIENDS", "MUTUAL_GUILDS"];
var TAB = "data-whisper-tab";
var HIDE = "data-whisper-hide";
var observer5;
var timer2;
function sectionOf(el) {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  let fiber = key ? el[key] : null;
  for (let i = 0; fiber && i < 8; i++, fiber = fiber.return) {
    const p = fiber.memoizedProps;
    if (p && typeof p.id === "string" && "onItemSelect" in p && "itemType" in p) return SECTIONS.includes(p.id) ? p.id : void 0;
  }
}
function scan() {
  timer2 = void 0;
  const hidden = /* @__PURE__ */ new Set();
  if (on("hideProfileTabs")) hidden.add("WIDGETS").add("ACTIVITY").add("WISHLIST");
  if (on("hideMutualTabs")) hidden.add("MUTUAL_FRIENDS").add("MUTUAL_GUILDS");
  for (const list of document.querySelectorAll('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll(':scope > [role="tab"]')];
    const info = tabs.map((el) => ({ el, section: sectionOf(el) }));
    if (!info.some((i) => i.section)) continue;
    const visible = info.filter((i) => !i.section || !hidden.has(i.section));
    for (const { el, section } of info) {
      if (section) el.setAttribute(TAB, section);
      if (section && hidden.has(section)) el.setAttribute(HIDE, "");
      else el.removeAttribute(HIDE);
    }
    const box2 = list.parentElement?.parentElement;
    if (box2 && box2.querySelector(':scope > [role="tabpanel"]')) {
      if (visible.length) box2.removeAttribute(HIDE);
      else box2.setAttribute(HIDE, "");
    }
    const selected = info.find((i) => i.el.getAttribute("aria-selected") === "true");
    if (selected?.el.hasAttribute(HIDE)) visible[0]?.el?.click();
  }
}
function clean() {
  for (const el of document.querySelectorAll(`[${TAB}],[${HIDE}]`)) {
    el.removeAttribute(TAB);
    el.removeAttribute(HIDE);
  }
}
var schedule = () => {
  timer2 ??= setTimeout(scan, 80);
};
function stopProfileTabs() {
  observer5?.disconnect();
  observer5 = void 0;
  clearTimeout(timer2);
  timer2 = void 0;
  clean();
}
function syncProfileTabs() {
  if (!on("hideProfileTabs") && !on("hideMutualTabs")) return stopProfileTabs();
  if (!observer5) {
    observer5 = new MutationObserver(schedule);
    observer5.observe(document.body, { childList: true, subtree: true });
  }
  scan();
}

// src/features/sleep.ts
var timer3;
var watchdog;
var lastWake = 0;
var nativeWin = window.DiscordNative?.window;
var shouldSleep = () => document.hidden;
function update() {
  clearTimeout(timer3);
  nativeWin?.setBackgroundThrottling?.(!!settings.store.hideWhenAsleep);
  setState("focused", document.hasFocus());
  if (!settings.store.hideWhenAsleep || !shouldSleep()) return setState("asleep", false);
  timer3 = setTimeout(() => {
    if (!shouldSleep()) return;
    setState("asleep", true);
    try {
      window.DiscordNative?.processUtils?.purgeMemory?.();
    } catch {
    }
  }, Math.max(0, settings.store.delaySeconds) * 1e3);
}
var INTERACTION = ["pointerdown", "keydown", "mousemove"];
var opts = { passive: true, capture: true };
function wakeIfNeeded() {
  if (!state.asleep || shouldSleep()) return;
  clearTimeout(timer3);
  setState("asleep", false);
}
function onInteraction() {
  const now = Date.now();
  if (now - lastWake < 500 || !state.asleep) return;
  wakeIfNeeded();
  if (!state.asleep) lastWake = now;
}
function startSleep() {
  stopSleep();
  document.addEventListener("visibilitychange", update);
  window.addEventListener("blur", update);
  window.addEventListener("focus", update);
  for (const e of INTERACTION) window.addEventListener(e, onInteraction, opts);
  watchdog = setInterval(wakeIfNeeded, 2e3);
  update();
}
function stopSleep() {
  nativeWin?.setBackgroundThrottling?.(false);
  clearTimeout(timer3);
  clearInterval(watchdog);
  document.removeEventListener("visibilitychange", update);
  window.removeEventListener("blur", update);
  window.removeEventListener("focus", update);
  for (const e of INTERACTION) window.removeEventListener(e, onInteraction, opts);
}

// src/ui/titleBar.ts
var ID = "whisper-titlebar";
function open2(url) {
  window.open(url, "_blank", "noopener");
}
function stopTitleBar() {
  document.getElementById(ID)?.remove();
}
function syncTitleBar() {
  stopTitleBar();
  const bar = document.createElement("div");
  bar.id = ID;
  const label = document.createElement("span");
  label.textContent = `Whisper v${VERSION}`;
  bar.append(label);
  for (const [text, url] of [["Ko-fi", KOFI], [t("Redes", "Socials"), SOCIALS]]) {
    if (!url.startsWith("https://")) continue;
    const button2 = document.createElement("button");
    button2.type = "button";
    button2.textContent = text;
    button2.title = url;
    button2.onclick = () => open2(url);
    bar.append(button2);
  }
  document.body.append(bar);
}

// src/filters/typing.ts
var block4 = (action) => action.type === "TYPING_START";
var dispatcher4 = () => FluxDispatcher;
function stopTyping() {
  const list = dispatcher4()._interceptors;
  if (list?.includes(block4)) list.splice(list.indexOf(block4), 1);
}
function syncTyping() {
  stopTyping();
  if (settings.store.blockTypingEvents) dispatcher4().addInterceptor?.(block4);
}

// src/index.ts
function safe(name, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`[Whisper] ${name} fallo:`, e);
  }
}
function syncState() {
  safe("syncCss", syncCss);
  safe("syncPrefs", syncPrefs);
  safe("syncFps", syncFps);
}
function syncAll() {
  safe("detectGame", detectGame);
  syncState();
  safe("syncAvatars", syncAvatars);
  safe("syncLazyImages", syncLazyImages);
  safe("syncGifs", syncGifs);
  safe("syncTyping", syncTyping);
  safe("syncBlocker", syncBlocker);
  safe("syncMutedDrop", syncMutedDrop);
  safe("syncPresence", syncPresence);
  safe("syncProfileTabs", syncProfileTabs);
  safe("syncSleep", update);
  safe("syncTitleBar", syncTitleBar);
}
var running = false;
var queued = false;
function queueSync() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    if (running) syncAll();
  });
}
var onGames = () => safe("RUNNING_GAMES_CHANGE", detectGame);
var onOpen = () => safe("CONNECTION_OPEN", syncAll);
module.exports = class Whisper {
  start() {
    running = true;
    safe("loadSettings", loadSettings);
    onSettingsChange((key) => {
      queueSync();
      safe("onSettingChange", () => onSettingChange(key));
    });
    safe("onStateChange", () => onStateChange(syncState));
    safe("startSleep", startSleep);
    syncAll();
    safe("subscribe", () => {
      FluxDispatcher.subscribe("RUNNING_GAMES_CHANGE", onGames);
      FluxDispatcher.subscribe("CONNECTION_OPEN", onOpen);
    });
  }
  stop() {
    running = false;
    safe("unsubscribe", () => {
      FluxDispatcher.unsubscribe("RUNNING_GAMES_CHANGE", onGames);
      FluxDispatcher.unsubscribe("CONNECTION_OPEN", onOpen);
    });
    onSettingsChange(() => {
    });
    safe("stopSleep", stopSleep);
    safe("resetState", resetState);
    safe("stopCss", stopCss);
    safe("stopPrefs", stopPrefs);
    safe("stopFps", stopFps);
    safe("stopAvatars", stopAvatars);
    safe("stopLazyImages", stopLazyImages);
    safe("stopGifs", stopGifs);
    safe("stopTyping", stopTyping);
    safe("stopBlocker", stopBlocker);
    safe("stopMutedDrop", stopMutedDrop);
    safe("stopPresence", stopPresence);
    safe("stopProfileTabs", stopProfileTabs);
    safe("stopTitleBar", stopTitleBar);
  }
  getSettingsPanel() {
    return SettingsPanel;
  }
};
