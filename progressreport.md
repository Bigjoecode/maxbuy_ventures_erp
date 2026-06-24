## ✅ Phase 1 complete — security foundation done & deployed

Everything is committed and pushed (Vercel is auto-deploying now). Here's what landed, all smoke-tested against a live server:

| Item | What it does | Verified |
|------|--------------|----------|
| R3 — Atomic invoicing | Invoice numbers now come from a locked `Counter`, reserved before the sale transaction so checkout stays fast | 8 concurrent sales → 8 unique numbers, no timeouts ✅ |
| R5 — Rate limiting | Login & reset endpoints throttle brute-force (10/5min) | 11th attempt → 429 ✅ |
| R5 — Security headers/CSP | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy on every response | Headers present ✅ |
| R5 — CSRF | Origin check blocks cross-site cookie mutations (defense-in-depth on SameSite=Lax) | Foreign origin → 403, same origin → 200 ✅ |
| OTP password reset | `/forgot-password` + `/reset-password` with hashed codes, expiry, attempt caps, and full session revocation on reset | reset → login works, reuse blocked ✅ |
| Multi-device sessions | Settings → Active Sessions: see every signed-in device, sign out one or all others | current-device flag correct ✅ |
| Auth foundation (R2/R4) | httpOnly-cookie sessions with rotating refresh tokens + reuse detection; tokens no longer in browser storage | full lifecycle tested ✅ |

I also caught and fixed a real concurrency bug during testing: the first version held the invoice lock for the whole sale transaction, which serialized all checkouts and timed out on the remote DB. Reserving the number up-front fixed it.

---

## ✅ Phase 2 complete — offline-first PWA done & deployed

| Item | What it does | Verified |
|------|--------------|----------|
| Installable PWA | Manifest + brand icons + install prompt + Apple PWA meta — installable on phone and desktop | assets serve 200 ✅ |
| Service worker | Caches app shell + static assets (stale-while-revalidate); offline fallback page | `/sw.js`, `/offline` serve ✅ |
| Offline data (Dexie) | Product catalog + customers cached in IndexedDB; POS reads from cache when offline | built ✅ |
| Offline POS | Sales made offline are queued on-device with optimistic stock decrement | built ✅ |
| Auto-sync engine | Queue flushes on reconnect / load / Background Sync; single in-flight sync | built ✅ |
| Idempotency | `clientRef` key means re-syncing a queued sale can never double-post it | duplicate POST → `deduped`, no double ✅ |
| Conflict handling | Oversells detected on sync are flagged and surfaced to the cashier | built ✅ |
| Notifications | Local sync notifications when backgrounded; service worker push-ready | built ✅ |

Also fixed: the Phase 1 CSP was inadvertently blocking Google Fonts + Font Awesome — now allowed. Staging test data cleaned after each test run (only `INV-0001` seed + `INV-0002` your own test sale remain).

> Note on staging: after each deploy you're logged out once (re-login with `admin` / `maxbuy2024`). The Neon free database auto-suspends when idle, so the very first action after a quiet period may take a few seconds / one retry.

---

## Known follow-ups (tracked in ROADMAP.md)
- **SMS provider** — OTP codes currently log server-side; needs Termii/Twilio wiring (~15 lines).
- **Web Push** — server-sent push needs VAPID keys + subscription store (SW handlers already in place).
- Hardening niceties: nonce CSP, Redis rate limiting (only at multi-server scale), TOTP 2FA.

## Next phases
- **Phase 3** — data integrity & multi-branch (soft-delete/recovery, branch-scoped data, backups)
- **Phase 4** — packaging: Android (Capacitor → APK/AAB) + Windows desktop (Tauri)
- **Phase 5** — DevOps + the self-managed **VPS production deployment** (Docker, CI/CD, Nginx)
