# Packaging — Android & Windows Desktop

Maxbuy Ventures is a server-rendered Next.js PWA. The mobile and desktop apps
are thin native shells that load the deployed app, so they inherit everything —
including offline POS, install, and background sync — from the PWA.

> Set your real production URL first. Replace `https://maxbuy-ventures-erp.vercel.app`
> in `capacitor.config.ts` and `src-tauri/tauri.conf.json` (or set `CAP_SERVER_URL`)
> with your final domain before building store releases.

There are three routes. Pick per need:

| Route | Output | Local toolchain needed | Best for |
|-------|--------|------------------------|----------|
| **PWABuilder** | APK, AAB, Windows (.msix) | None (web service) | Fastest path to installable files |
| **Capacitor** | APK, AAB | Android Studio + JDK | Full Android control, native plugins |
| **Tauri** | .exe / .msi installer | Rust + Windows build tools | Small, fast native desktop app |

---

## 1. PWABuilder — fastest, no local toolchain

Because the deployed site is a valid installable PWA, PWABuilder packages it for
you. The manifest is already hardened for this: it includes `id`, `scope`,
`lang`/`dir`, maskable + standard icons, **screenshots** (wide + narrow), and
shortcuts — so PWABuilder's report should pass cleanly.

1. Deploy the app (staging/production) so it's reachable over HTTPS.
2. Go to https://www.pwabuilder.com and enter your URL.
3. Review the report — manifest + service worker should both pass.
4. **Android** → "Package for stores" → download the **AAB** (Play Store) +
   **APK** (sideload/testing). PWABuilder builds a Trusted Web Activity (TWA)
   for the `com.maxbuy.erp` package id.
5. **Windows** → download the **.msixbundle** for the Microsoft Store / sideload.

### Android: finish Digital Asset Links (removes the browser address bar)
A TWA must prove it owns the domain, or it shows a Chrome address bar.

1. After PWABuilder generates the Android package, open the included
   `assetlinks.json` (or get the **SHA-256 signing fingerprint** from Play
   Console → *App signing*).
2. Paste that fingerprint into [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json)
   (replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT`).
3. Redeploy. Verify it's live at `https://your-domain/.well-known/assetlinks.json`.

> Replace the placeholder store screenshots in `public/screenshots/` with real
> captures of the running app for a better Play Store listing.

This is the recommended path for the first store submission.

---

## 2. Capacitor — Android (code-based)

Already configured: `capacitor.config.ts` (loads the deployed URL), deps in
`package.json`.

**Prerequisites:** Node, JDK 17, Android Studio (SDK + platform tools).

```bash
# one-time: generate the native android/ project
npm run cap:add:android

# after any config change
CAP_SERVER_URL="https://your-domain" npm run cap:sync

# open in Android Studio to run/build
npm run cap:open:android
```

In Android Studio: **Build → Generate Signed Bundle / APK** → choose **AAB**
(Play Store) or **APK**. Configure your signing key once; reuse it for updates.

The `android/` folder is generated (git-ignored) — recreate it with
`cap:add:android` on any build machine.

---

## 3. Tauri — Windows desktop (code-based)

Already configured: `src-tauri/` (`tauri.conf.json`, `Cargo.toml`, `src/main.rs`).
The window loads the deployed URL.

**Prerequisites:** Rust (`rustup`), and on Windows the **Microsoft C++ Build
Tools** + **WebView2** runtime (preinstalled on Windows 11).

```bash
# one-time: generate all app icons (.ico/.icns/.png) from the brand icon
npm run tauri icon public/icons/icon-512.png

# develop (opens the native window)
npm run tauri:dev

# build the installer (.msi + NSIS .exe) → src-tauri/target/release/bundle/
npm run tauri:build
```

`src-tauri/target/` and `src-tauri/icons/` are generated (git-ignored).

### Auto-updates (later)
Tauri supports signed auto-updates via the `updater` plugin: host a
`latest.json` + signed bundles, add the updater plugin + public key to
`tauri.conf.json`. Wire this once a release host is chosen.

---

## Versioning
Keep the version in sync across `package.json`, `src-tauri/tauri.conf.json`
(`version`), and the Android `versionCode`/`versionName` for each release.
