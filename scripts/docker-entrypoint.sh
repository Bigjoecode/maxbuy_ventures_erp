#!/bin/sh
set -e

echo "[entrypoint] applying database schema…"
# Sync the Prisma schema to the database. db push (no --accept-data-loss) is safe:
# it refuses destructive changes rather than dropping data. For production with a
# migration history, switch this to: npx prisma migrate deploy (see docs/DEPLOY.md).
npx prisma db push --skip-generate

echo "[entrypoint] starting Maxbuy Ventures…"
exec npm run start
