# Backup & Disaster Recovery

Maxbuy Ventures stores all business data in PostgreSQL. This document covers
automated backups, encryption, offsite storage, and recovery.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/backup.sh` | Compressed `pg_dump`, optional GPG encryption, optional S3 upload, local rotation |
| `scripts/restore.sh` | Restore a backup into `DATABASE_URL` (interactive confirmation) |

Both read the database connection from `DATABASE_URL`.

## One-off backup

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/maxbuy_erp"
./scripts/backup.sh
# → ./backups/maxbuy_YYYYMMDD_HHMMSS.sql.gz
```

## Encrypted + offsite (recommended for production)

```bash
export DATABASE_URL="postgresql://..."
export BACKUP_GPG_RECIPIENT="ops@maxbuy.example"   # encrypt at rest
export BACKUP_S3_BUCKET="maxbuy-backups"           # needs awscli configured
export BACKUP_RETENTION_DAYS=30
./scripts/backup.sh
```

This satisfies the **encrypted backups** and **data-at-rest** requirements: the
dump never touches disk unencrypted when `BACKUP_GPG_RECIPIENT` is set, and the
offsite copy lives in S3.

## Schedule (production VPS)

Add a cron entry to run nightly at 02:30 and log output:

```cron
30 2 * * *  cd /var/www/maxbuy && DATABASE_URL="postgresql://..." \
  BACKUP_GPG_RECIPIENT="ops@maxbuy.example" BACKUP_S3_BUCKET="maxbuy-backups" \
  ./scripts/backup.sh >> /var/log/maxbuy-backup.log 2>&1
```

For managed Postgres (Neon/Railway/Render) automated daily backups and
point-in-time restore are also available in the provider dashboard — use both:
provider PITR for convenience, these dumps for portable, provider-independent
recovery.

## Restore

```bash
export DATABASE_URL="postgresql://...target-db..."
./scripts/restore.sh ./backups/maxbuy_20260623_023000.sql.gz       # or .gpg
```

## Recovery drill (do this quarterly)

1. Provision a scratch database.
2. Restore the latest backup into it with `restore.sh`.
3. Run `npx prisma db pull` / a quick `npm run db:studio` to confirm tables and
   row counts look right.
4. Record the restore time — that's your real RTO.

> Tip: a backup you have never restored is not a backup. Test it.
