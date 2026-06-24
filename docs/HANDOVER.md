# Handover Pack

This document lists what should be handed over to the client at project closeout.

## 1. Source Code

- GitHub repository access
- Default branch name
- Latest production commit hash
- Instructions for cloning and running locally

Primary references:
- [README.md](../README.md)
- [DEPLOY.md](./DEPLOY.md)

## 2. Infrastructure Access

- Hosting platform or VPS access
- Domain registrar or DNS access
- Database provider access
- GitHub Actions / CI access if used

## 3. Secrets & Environment Variables

Share securely, not in plain chat or email:

- `JWT_SECRET`
- Database credentials
- Hosting platform environment variables
- Backup encryption recipient details
- Backup storage credentials
- Any optional provider credentials

Reference template:
- [.env.production.example](../.env.production.example)

## 4. Operations Documentation

- Deployment guide: [DEPLOY.md](./DEPLOY.md)
- Backup and recovery guide: [BACKUP.md](./BACKUP.md)
- Packaging guide: [PACKAGING.md](./PACKAGING.md)
- Launch checklist: [LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md)
- UAT checklist: [UAT-SIGNOFF.md](./UAT-SIGNOFF.md)

## 5. Admin Handover Tasks

- Provide real super admin credentials
- Force password change after first login
- Confirm staff roles and permissions
- Confirm branch setup
- Confirm backup schedule owner
- Confirm who is responsible for post-launch support

## 6. Recommended Walkthrough Agenda

1. System login and role overview
2. Dashboard and navigation
3. POS, sales, receipts, and debts
4. Inventory and suppliers
5. Reports
6. Staff, sessions, and audit log
7. Recycle Bin and recovery
8. Deployment and backup process
9. Questions, open issues, and sign-off

## 7. Known Deferred Items

These are not blockers unless specifically required for launch:

- SMS provider integration for OTP delivery
- Full TOTP / 2FA setup
- Server-sent web push notifications
- Expanded automated end-to-end coverage
- Advanced post-launch reporting enhancements

