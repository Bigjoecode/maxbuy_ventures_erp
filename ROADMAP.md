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

## 3. Phased plan

Phasing note: you chose **Offline/PWA** as the first focus. Offline depends on a trustworthy auth/sync boundary, so Phase 1 does the minimum security foundation needed to make offline safe, then Phase 2 builds the PWA. The remaining hardening follows.

### Phase 0 — Project hygiene (½ week)
- [ ] Add tooling: ESLint strict config, Prettier, `tsc --noEmit` typecheck script.
- [ ] `.env.example` already present; document required vars in README.
- [ ] Add a basic test harness (Vitest + Playwright) so later phases can land with coverage.
- [ ] Verify build + Prisma migrate against a real PostgreSQL instance.

### Phase 1 — Security foundation (1.5 weeks) — *prerequisite for safe offline*
- [ ] **R1:** Require `JWT_SECRET` at boot (fail fast if unset/default).
- [ ] **R2:** Move JWT to httpOnly, Secure, SameSite cookies; drop token from localStorage. Update `requireAuth` to read the cookie.
- [ ] **R4:** Add refresh-token rotation (short-lived access + long-lived rotating refresh, persisted/revocable). Add a `Session` model + logout/revoke + multi-device list.
- [ ] **R3:** Replace invoice numbering with a DB sequence or dedicated counter row updated inside the transaction.
- [ ] **R5:** Add rate limiting (per-IP/per-user), security headers/CSP, and CSRF protection for cookie-based mutations.
- [ ] Password reset + OTP flow (email/SMS provider stubbed via existing `SMS_API_KEY`).

### Phase 2 — Offline-first PWA (2.5 weeks) — *your priority*
- [ ] Web app manifest + icons + "Add to Home Screen" + install prompt.
- [ ] Service worker (next-pwa or Workbox) — app shell + static asset caching.
- [ ] IndexedDB layer with **Dexie.js**: cache product catalog, customers, and pending sales.
- [ ] **Offline POS:** queue sales locally when offline; show offline indicator.
- [ ] **Background Sync:** flush queued sales to `/api/sales` when connectivity returns.
- [ ] **Conflict resolution:** server-authoritative stock; reject/flag oversells on sync; surface conflicts to the cashier. (Requires client-generated idempotency keys so re-sync can't double-post — ties back to R3.)
- [ ] Push notifications (low-stock, sync results).

### Phase 3 — Data integrity & multi-branch (1.5 weeks)
- [ ] **R8:** Soft-delete (`deletedAt`) + recovery on core models; widen `ActivityLog` coverage to all mutations.
- [ ] **R7:** Branch-scope all queries by `branchId` from the auth payload; add stock-transfer flows between branches.
- [ ] Backup strategy: scheduled `pg_dump` + encrypted offsite storage (existing `CLOUD_STORAGE_*` vars).

### Phase 4 — Packaging (1.5 weeks)
- [ ] **Android:** Capacitor wrap → APK + AAB, Play Store config.
- [ ] **Desktop:** Tauri (recommended over Electron — smaller, more secure) → Windows installer + auto-update channel.

### Phase 5 — DevOps & deployment (1 week)
- [ ] **R10:** Dockerfile + docker-compose (app + PostgreSQL + Nginx).
- [ ] GitHub Actions: lint → typecheck → test → build → deploy.
- [ ] Production hosting: **Railway or Render** (managed Postgres, simplest path) for first launch; Nginx reverse proxy + HTTPS. AWS later if scale demands.
- [ ] Staging environment + migration runbook.

## 4. Open questions for you
1. **Hosting budget/preference:** managed (Railway/Render — recommended, ~$20-50/mo to start) vs. self-managed VPS/AWS?
2. **OTP/SMS provider:** Termii and Twilio are both fine for Nigeria — do you have an account/preference?
3. **Currency/locale:** code assumes ₦ (Naira) — confirm single-currency for now.
4. **Branch rollout:** single branch at launch with multi-branch built but dormant, or multiple branches live on day one?

## 5. Indicative timeline
~9–10 weeks of focused work to reach the full spec, with a **usable secure + offline POS by end of Phase 2 (~4.5 weeks)**.
