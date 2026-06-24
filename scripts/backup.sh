#!/usr/bin/env bash
#
# Maxbuy Ventures — database backup.
# Creates a compressed (and optionally encrypted) pg_dump of DATABASE_URL,
# rotates old local backups, and optionally uploads offsite.
#
# Usage:   ./scripts/backup.sh
# Env:
#   DATABASE_URL            (required) Postgres connection string
#   BACKUP_DIR              local output dir         (default: ./backups)
#   BACKUP_RETENTION_DAYS   delete local dumps older than N days (default: 14)
#   BACKUP_GPG_RECIPIENT    if set, encrypt the dump for this GPG key/email
#   BACKUP_S3_BUCKET        if set, upload to s3://<bucket>/maxbuy/ (needs awscli)
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
BASE="$BACKUP_DIR/maxbuy_${STAMP}.sql.gz"

echo "[backup] dumping database → $BASE"
# --no-owner/--no-privileges keeps the dump portable across environments.
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "$BASE"

OUT="$BASE"
if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  echo "[backup] encrypting for $BACKUP_GPG_RECIPIENT"
  gpg --yes --batch --encrypt --recipient "$BACKUP_GPG_RECIPIENT" "$BASE"
  rm -f "$BASE"
  OUT="${BASE}.gpg"
fi

echo "[backup] wrote $OUT ($(du -h "$OUT" | cut -f1))"

if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  echo "[backup] uploading to s3://${BACKUP_S3_BUCKET}/maxbuy/"
  aws s3 cp "$OUT" "s3://${BACKUP_S3_BUCKET}/maxbuy/$(basename "$OUT")"
fi

echo "[backup] pruning local backups older than ${RETENTION} days"
find "$BACKUP_DIR" -name 'maxbuy_*.sql.gz*' -type f -mtime "+${RETENTION}" -delete

echo "[backup] done."
