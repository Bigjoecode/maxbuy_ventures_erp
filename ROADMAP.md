# Maxbuy Ventures ERP/POS — Production Readiness Roadmap

> Status: **Draft for review** · Last updated: 2026-06-22
> Architecture decision: **Keep Next.js 14 full-stack** (App Router API routes + Prisma/PostgreSQL).
> No NestJS split — the existing backend logic is reused and hardened in place.

## 1. Where we are today

This is **not** a bare frontend prototype. It is a working full-stack Next.js app:

- **Backend:** App Router API routes (`src/app/api/*`) for sales, products, customers, debts, suppliers, staff, expenses, reports, AI chat.
- **Database:** A solid 14-model Prisma/PostgreSQL schema (`prisma/schema.prisma`) including `Branch`, `StockMovement`, `ActivityLog`, `Debt`, loyalty.
- **Auth:** JWT (`src/lib/auth.ts`) + bcrypt + an RBAC permission map; `requireAuth(req, permission)` guard.
- **Domain logic:** The POS checkout (`src/app/api/sales/route.ts`) runs in a DB transaction — validates stock, deducts inventory, writes stock movements, awards loyalty, creates debts for credit sales, logs activity.

**Verdict: evolve, do not rebuild.** The schema and business logic are a strong, correct foundation.

## 2. Known gaps & risks (audited)

| # | Area | Finding | Severity |
|---|------|---------|----------|
| R1 | Auth secret | `JWT_SECRET` falls back to `'dev-secret-change-me'` (`src/lib/auth.ts:4`) | 🔴 High |
| R2 | Token storage | JWT persisted in `localStorage` via Zustand and sent as Bearer header (`src/store/authStore.ts`) — XSS-exposed. Spec requires httpOnly cookies. | 🔴 High |
| R3 | Invoice numbering | "last sale + 1" parse (`api/sales/route.ts:90`) — race condition under concurrent checkout; can produce duplicate invoice numbers. | 🔴 High |
| R4 | Session lifecycle | No refresh-token rotation, OTP, password reset, logout/revocation, or multi-device tracking. | 🔴 High |
| R5 | API hardening | No rate limiting, CSRF protection, or security headers (Helmet/CSP). | 🔴 High |
| R6 | Offline/PWA | None present — no manifest, service worker, IndexedDB cache, offline sales, or background sync. (Core requirement.) | 🟠 Med |
| R7 | Multi-branch | `Branch` model exists but queries are not branch-scoped; no tenant isolation. | 🟠 Med |
| R8 | Data integrity | No soft-delete/recovery; `ActivityLog` exists but coverage is partial; no encrypted backup strategy. | 🟠 Med |
| R9 | Packaging | No Capacitor (Android) or Electron/Tauri (desktop). | 🟠 Med |
| R10 | DevOps | No Docker, CI/CD, or automated tests. | 🟠 Med |
| R11 | Receipt/PDF deps | Closed in the current codebase: receipts use browser print-to-PDF + WhatsApp share, and no active `jspdf` / `jspdf-autotable` dependency remains in the app manifests. Keep the receipt flow regression-tested on release builds. | ✅ Closed |

## Progress log
- **2026-06-22:** Established clean build baseline (deps installed, Prisma client generated, 3 blocking type errors fixed, `next build` green).
- **2026-06-22:** Phase 1 started — upgraded Next.js 14.2.5 → 14.2.35 (security patch); R1 JWT secret now fails fast in production; removed the wildcard image `remotePatterns` (Image Optimizer DoS/SSRF). Remaining audit items were R11 (tracked at the time) + dev-only transitive (glob/eslint/postcss, deferred).
- **2026-06-22:** Staging live on Vercel + Neon (schema pushed + seeded; admin login working).
- **2026-06-23:** R2 + R4 done — httpOnly cookie auth with rotating refresh tokens and revocable `Session` model. Added `/api/auth/{refresh,logout,me}`, client silent-refresh, server-validated route gating. Full lifecycle smoke-tested (login/me/refresh/rotation/reuse-detection/logout) — all green.
- **2026-06-23:** **Phase 1 complete.** R3 (atomic invoice numbers, race-fixed + throughput fix), R5 (rate limiting, CSP/security headers, CSRF Origin check), OTP password reset, and multi-device session management. All smoke-tested live: CSRF 403/200, 8 concurrent sales → unique invoices, OTP reset + reuse-block, rate-limit 429, sessions current-flag. Test data cleaned from staging.
- **2026-06-24:** **Phase 5 complete (DevOps & deployment).** Multi-stage Dockerfile + docker-compose (app+Postgres+Nginx) + entrypoint, Nginx HTTPS reverse-proxy config, GitHub Actions CI (typecheck/lint/build) + manual VPS deploy workflow, and a full self-VPS `docs/DEPLOY.md` runbook (certbot TLS, seed, updates, rollback, migration guidance). Added `.eslintrc.json` (fixed one lint error); typecheck/lint/build all green locally. **All 5 roadmap phases now complete.**
- **2026-06-24:** **Phase 4 complete (packaging setup).** Capacitor (Android) + Tauri (Windows desktop) configured to wrap the deployed PWA, npm scripts added, and `docs/PACKAGING.md` covers PWABuilder + Capacitor + Tauri build paths. Web build verified; native binaries require toolchains on a build machine (documented).
- **2026-06-23:** **Phase 3 complete (data integrity & multi-branch foundation).** Soft-delete + Recycle Bin + restore (fixed destructive customer hard-delete), full audit-log instrumentation + viewer, branch-scoping + Branch management + stock transfers, and a pg_dump backup/restore toolkit with docs. Verified live: soft-delete→trash→restore round-trip, audit logging, branch creation + stock transfer (source 10→7, destination credited), over-transfer rejected. Test data cleaned.
- **2026-06-23:** **Phase 2 complete (offline-first PWA).** Installable PWA (manifest + icons + install prompt), hand-rolled service worker (static caching + offline fallback), Dexie offline catalog/customer cache, offline POS that queues sales with optimistic stock + idempotent sync engine (sync on reconnect/load/SW), conflict flagging, and local sync notifications. Verified live: idempotent re-POST (`deduped`, no duplicate), PWA assets serve correctly. Also fixed the Phase 1 CSP that was blocking Google Fonts + Font Awesome. Test data cleaned.

## 3. Phased plan

Phasing note: you chose **Offline/PWA** as the first focus. Offline depends on a trustworthy auth/sync boundary, so Phase 1 does the minimum security foundation needed to make offline safe, then Phase 2 builds the PWA. The remaining hardening follows.

### Phase 0 — Project hygiene (½ week)
- [ ] Add tooling: ESLint strict config, Prettier, `tsc --noEmit` typecheck script.
- [ ] `.env.example` already present; document required vars in README.
- [ ] Add a basic test harness (Vitest + Playwright) so later phases can land with coverage.
- [ ] Verify build + Prisma migrate against a real PostgreSQL instance.

### Phase 1 — Security foundation (1.5 weeks) — *prerequisite for safe offline*
- [x] **R1:** Require `JWT_SECRET` at boot (fail fast if unset/default).
- [x] **R2:** Move JWT to httpOnly, Secure, SameSite cookies; drop token from localStorage. `requireAuth` reads the cookie (Bearer fallback for API clients).
- [x] **R4:** Refresh-token rotation (15m access + 7d rotating refresh, hashed + revocable `Session` model); login/refresh/logout/me endpoints; reuse-detection revokes session.
- [x] **R4 (remainder):** Multi-device session list + "log out other devices" UI (Settings → Active Sessions).
- [x] **R3:** Atomic invoice numbering via `Counter` row; number reserved before the sale transaction so the lock isn't held during checkout (verified: 8 concurrent sales → unique numbers).
- [x] **R5:** Rate limiting (login + reset endpoints), security headers/CSP, and Origin-based CSRF protection for cookie mutations.
- [x] Password reset + OTP flow — `/api/auth/forgot-password` + `/reset-password`, hashed codes, attempt limits, session revocation on reset; provider-agnostic `notify.ts` seam (logs in dev until Termii/Twilio is wired).

**Phase 1 is complete.** Remaining hardening that can come later: nonce-based CSP, distributed (Redis) rate limiting for multi-instance hosting, and TOTP 2FA.

### Phase 2 — Offline-first PWA (2.5 weeks) — *your priority*
- [x] Web app manifest + generated icons + install prompt + Apple PWA meta.
- [x] Service worker (hand-rolled): static stale-while-revalidate + network-first navigations with `/offline` fallback.
- [x] IndexedDB layer with **Dexie.js**: caches product catalog + customers; queues pending sales.
- [x] **Offline POS:** queues sales locally with optimistic stock decrement; global offline/sync indicator banner.
- [x] **Background Sync:** flushes queued sales on reconnect / load / SW sync event; deduplicated single in-flight sync.
- [x] **Conflict resolution:** server-authoritative; oversells flagged as `conflict` and surfaced; client `clientRef` idempotency key makes re-sync safe (verified: duplicate POST → `deduped`, no double-post).
- [x] Notifications: local notifications for sync results (when backgrounded) + push-ready SW handlers. **Follow-up:** full server-sent Web Push needs VAPID keys + a subscription store.

### Phase 3 — Data integrity & multi-branch (1.5 weeks)
- [x] **R8:** Soft-delete (`deletedAt`) + recovery on Product/Customer/Supplier/Staff (customers were previously HARD-deleted); Recycle Bin UI + `/api/admin/{trash,restore}`. Central `logActivity()` instrumenting all mutations; Activity Log viewer + `/api/admin/activity`.
- [x] **R7:** Branch-scoping helper (`branchScope`) applied to product/sales/expense reads (super-admin sees all — backward compatible); Branch CRUD API + management UI; `StockTransfer` model + endpoint + UI (verified: transfer decrements source, creates/credits destination). New products inherit the creator's branch.
- [x] Backup strategy: `scripts/backup.sh` (pg_dump + gzip + optional GPG encryption + optional S3) + `restore.sh` + `docs/BACKUP.md` (cron + recovery drill).

> Multi-branch note: full per-branch SKUs/inventory (same product, separate stock per branch with branch-unique SKUs) needs a `BranchStock` redesign — intentionally deferred ("future-ready" per brief). Current transfer clones the product into the destination branch by name.

### Phase 4 — Packaging (1.5 weeks)
- [x] **Android:** Capacitor configured (`capacitor.config.ts`, hosted-PWA shell) + npm scripts. Also documented the **PWABuilder** route (no local toolchain → APK/AAB from the live PWA). Producing the binary needs Android Studio + JDK on a build machine.
- [x] **Desktop:** Tauri configured (`src-tauri/`: conf + Cargo + main.rs, loads the deployed URL) + npm scripts. Building the .msi/.exe needs Rust + MSVC build tools.
- [x] Full build guide in `docs/PACKAGING.md` (PWABuilder + Capacitor + Tauri; signing, icons, versioning, auto-update notes).

> Native binaries can't be compiled in this dev environment (no Android SDK / Rust toolchain). All config is in place and the web build is verified; run the documented commands on a build machine to produce APK/AAB and the Windows installer. PWABuilder needs no toolchain at all.

### Phase 5 — DevOps & deployment (1 week)
- [x] **R10:** Multi-stage `Dockerfile` + `docker-compose.yml` (app + PostgreSQL + Nginx) + entrypoint (schema sync on boot) + `.dockerignore`.
- [x] GitHub Actions: `ci.yml` (typecheck → lint → build on every push/PR) + `deploy.yml` (manual SSH deploy to VPS).
- [x] Nginx reverse proxy + HTTPS config (`nginx/nginx.conf`).
- [x] Production hosting: **self-managed VPS** runbook in `docs/DEPLOY.md` (provision → certbot TLS → compose up → seed → updates/rollback) + `.env.production.example`. (Staging already live on Vercel + Neon.)
- [ ] Test suite (Vitest/Playwright) wired into CI — deferred follow-up.

> Migration history: entrypoint uses `prisma db push` today (matches dev workflow); `docs/DEPLOY.md` documents adopting `prisma migrate` for production.

## 4. Open questions for you
1. **Hosting budget/preference:** managed (Railway/Render — recommended, ~$20-50/mo to start) vs. self-managed VPS/AWS?
2. **OTP/SMS provider:** Termii and Twilio are both fine for Nigeria — do you have an account/preference?
3. **Currency/locale:** code assumes ₦ (Naira) — confirm single-currency for now.
4. **Branch rollout:** single branch at launch with multi-branch built but dormant, or multiple branches live on day one?

## 5. Indicative timeline
~9–10 weeks of focused work to reach the full spec, with a **usable secure + offline POS by end of Phase 2 (~4.5 weeks)**.
