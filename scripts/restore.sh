#!/usr/bin/env bash
#
# Maxbuy Ventures — restore a backup created by backup.sh.
#
# Usage:   ./scripts/restore.sh <path-to-backup.sql.gz[.gpg]>
# Env:     DATABASE_URL (required) — target database (BE CAREFUL: this writes to it)
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
FILE="${1:?Usage: restore.sh <backup-file>}"
[[ -f "$FILE" ]] || { echo "File not found: $FILE" >&2; exit 1; }

echo "!! This will restore into the database in DATABASE_URL and may overwrite data."
read -r -p "Type 'yes' to continue: " confirm
[[ "$confirm" == "yes" ]] || { echo "Aborted."; exit 1; }

TMP="$(mktemp).sql"
trap 'rm -f "$TMP"' EXIT

if [[ "$FILE" == *.gpg ]]; then
  gpg --decrypt "$FILE" | gunzip > "$TMP"
else
  gunzip -c "$FILE" > "$TMP"
fi

echo "[restore] applying $FILE → database"
psql "$DATABASE_URL" < "$TMP"
echo "[restore] done."
