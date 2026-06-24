# Launch Checklist

Use this checklist for the final production go-live of Maxbuy Ventures.

## 1. Infrastructure

- [ ] Final domain name is confirmed.
- [ ] DNS `A` record points to the correct production server or platform.
- [ ] Production hosting is selected:
  - [ ] Managed: Vercel + Neon/Postgres
  - [ ] Self-managed: VPS + Docker Compose
- [ ] HTTPS is active and tested.
- [ ] Production database is created and reachable.

## 2. Environment & Secrets

- [ ] Production `.env` is created from [.env.production.example](../.env.production.example).
- [ ] `JWT_SECRET` is a strong unique production secret.
- [ ] `NEXT_PUBLIC_APP_URL` matches the final live domain.
- [ ] Database credentials are production-only and not reused from staging.
- [ ] Any optional provider keys are reviewed.
- [ ] Secrets are stored in a secure password manager or vault.

## 3. Application Readiness

- [ ] Latest code is deployed from `main`.
- [ ] Build passes successfully.
- [ ] Login works with the real super admin account.
- [ ] Role-based access is verified for:
  - [ ] SUPER_ADMIN
  - [ ] MANAGER
  - [ ] CASHIER
  - [ ] STOCK_KEEPER
  - [ ] SALES_REP
- [ ] Settings page only shows super-admin tools and no placeholder actions.
- [ ] Reports page loads and shows real financial/customer data.
- [ ] Recycle Bin restore flow is verified.
- [ ] Branch management is verified if used at launch.

## 4. Data Preparation

- [ ] Demo or seed data is removed or replaced with real production data.
- [ ] Real products, categories, suppliers, and staff accounts are loaded.
- [ ] Default seeded passwords are changed immediately.
- [ ] Real branch structure is confirmed.

## 5. Security Checks

- [ ] httpOnly session login works in production.
- [ ] Session refresh and logout work correctly.
- [ ] Activity log is recording actions.
- [ ] CSRF and rate limiting are active.
- [ ] Only intended roles can access sensitive pages and APIs.

## 6. Backup & Recovery

- [ ] Backup strategy is selected and documented.
- [ ] Nightly backup job is configured.
- [ ] Optional encrypted backup recipient is configured.
- [ ] Optional offsite S3 bucket is configured.
- [ ] Restore script is tested against a scratch database.
- [ ] Recovery time from restore is recorded.

See also: [BACKUP.md](./BACKUP.md) and [DEPLOY.md](./DEPLOY.md)

## 7. Device & User Acceptance

- [ ] Browser smoke test completed on desktop.
- [ ] Browser smoke test completed on mobile.
- [ ] APK/PWA install tested on the client device.
- [ ] Offline sale queue tested.
- [ ] Reconnect and sync tested.
- [ ] Receipt print and WhatsApp share tested.

## 8. Go-Live Approval

- [ ] Client walkthrough completed.
- [ ] UAT checklist completed.
- [ ] Handover pack prepared.
- [ ] Sign-off received from client.

