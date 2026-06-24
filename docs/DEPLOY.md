# Production Deployment — Self-managed VPS (Docker)

This deploys the full stack — Next.js app + PostgreSQL + Nginx (HTTPS) — with
Docker Compose on a single VPS. Budget VPS sizing: 2 vCPU / 2–4 GB RAM is ample
to start.

## 0. Prerequisites
- A VPS (Ubuntu 22.04+) with a public IP.
- A domain pointed at the VPS (`A` record → server IP).
- Docker Engine + Compose plugin installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```

## 1. Get the code
```bash
sudo mkdir -p /var/www && cd /var/www
git clone https://github.com/Bigjoecode/maxbuy_ventures_erp.git maxbuy
cd maxbuy
```

## 2. Configure environment
```bash
cp .env.production.example .env
# generate a strong JWT secret:
openssl rand -base64 48
nano .env   # set POSTGRES_PASSWORD, JWT_SECRET, NEXT_PUBLIC_APP_URL, etc.
```

Set your domain in two places:
- `nginx/nginx.conf` → replace `maxbuy.example.com`
- `.env` → `NEXT_PUBLIC_APP_URL=https://your-domain`

## 3. TLS certificate (Let's Encrypt)
Issue a cert once with the standalone certbot, then mount it for Nginx:
```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d your-domain --email you@example.com --agree-tos
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/your-domain/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/your-domain/privkey.pem   nginx/certs/
sudo chown $USER nginx/certs/*.pem
```
Add a renewal cron (certbot renews, then copy + reload nginx):
```cron
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain/*.pem /var/www/maxbuy/nginx/certs/ && docker compose -f /var/www/maxbuy/docker-compose.yml exec -T nginx nginx -s reload
```

## 4. Launch
```bash
docker compose up -d --build
docker compose logs -f app    # watch the schema sync + startup
```
The app container runs `prisma db push` on start (see `scripts/docker-entrypoint.sh`),
then serves on port 3000 behind Nginx.

## 5. Seed the first admin (one-time)
```bash
docker compose exec app npx tsx prisma/seed.ts
# default login: admin / maxbuy2024  → CHANGE THIS PASSWORD IMMEDIATELY via the app
```
> For a clean production start, edit `prisma/seed.ts` to create only your real
> admin account (remove demo data) before seeding.

## 6. Updates / redeploys
```bash
git pull && docker compose up -d --build && docker image prune -f
```
Or trigger the **Deploy to VPS** GitHub Action (configure `VPS_HOST`, `VPS_USER`,
`VPS_SSH_KEY`, `VPS_PATH` repo secrets first).

## 7. Backups
Schedule nightly encrypted backups (see `docs/BACKUP.md`). Inside the stack the
database host is `db`; from the host, exec into the db container or expose it on
localhost for `pg_dump`.

---

## Migrations (recommended hardening)
The entrypoint uses `prisma db push` (matches current dev workflow; refuses
destructive changes). To adopt a proper migration history for production:

1. Locally, create the baseline once: `npx prisma migrate dev --name init`.
2. Commit `prisma/migrations/`.
3. Change `scripts/docker-entrypoint.sh` to `npx prisma migrate deploy`.

This gives reviewable, reversible schema changes per release.

## Rollback
- App: `git checkout <previous-tag> && docker compose up -d --build`.
- Data: restore the latest dump with `scripts/restore.sh` (see `docs/BACKUP.md`).

## Health
- `docker compose ps` — container/health status (the app has a HEALTHCHECK).
- `docker compose logs -f app nginx db` — live logs.
