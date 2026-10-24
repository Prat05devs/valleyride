# Valley Ride deployment: Hostinger + the shared DigitalOcean server

The public contract is `https://api.valleyride.in/api/v1`. Production iOS and Android builds always use
`https://api.valleyride.in`; development builds can use a LAN address. Never put a provider hostname or IP in a release.

| Component | Location | Public address |
| --- | --- | --- |
| Next.js website, customer account, staff/admin dashboards | Hostinger Node.js hosting | `https://valleyride.in` |
| Express API and BullMQ worker | Shared DigitalOcean droplet, `/opt/apps/valleyride` | `https://api.valleyride.in` |
| PostgreSQL 17, `valleyride` database and role | The server's shared PostgreSQL (internal `data` network) | None |
| Redis for jobs, OTPs and rate limits | Valley Ride's own container, private to this app | None |
| Private KYC, handover photos, agreements, invoices | Valley Ride's `uploads` volume on the droplet, archived daily to `infra/production/backups` | Short-lived signed API links only |

The droplet (Bangalore, **139.59.72.220**, 2 vCPU / 2 GB) is already set up with `server` from Batra Connect's
[`infra/server.sh`](https://github.com/Prat05devs/batraconnect/blob/main/infra/server.sh): one Caddy proxy owns ports
80/443 for every app, one PostgreSQL holds a separate database per app, and nightly plus pre-deploy backups of every
database land in `/opt/backups/postgres`. Valley Ride plugs into that; it runs no proxy or database of its own.

## 1. DNS

In the DNS for `valleyride.in`, create **A / api / 139.59.72.220**, and remove any other `api` record or stale AAAA
record. Keep the apex and `www` pointed at Hostinger. The firewall, swap, SSH hardening and HTTPS are already handled by
the server setup; the certificate for `api.valleyride.in` is issued on the first visit once this record resolves.

## 2. First deployment (as `deploy`, about 15 minutes)

```sh
ssh deploy@139.59.72.220
git clone <this repository> /opt/apps/valleyride   # a private repo needs a read-only deploy key first, see below
cd /opt/apps/valleyride/infra/production
server add-db valleyride          # prints the database password once: copy it
cp .env.example .env && chmod 600 .env
nano .env                         # DB_PASSWORD, JWT_ACCESS_SECRET (openssl rand -hex 32), Razorpay, login SMS
server add-site api.valleyride.in api.caddy
server deploy .
curl https://api.valleyride.in/ready
```

`server deploy` pulls the code, backs up every database, builds the image on the server, runs any new migrations
before the API starts, and waits until the API, worker and Redis are healthy. The first build takes about 10 minutes
on the droplet; later ones reuse the cache. Every release afterwards is just
`server deploy /opt/apps/valleyride/infra/production`.

**Private repository:** on the server run `ssh-keygen -t ed25519 -f ~/.ssh/valleyride -N ""`, add
`~/.ssh/valleyride.pub` to the GitHub repository under *Settings → Deploy keys* (read-only), and clone with
`git clone git@github.com:OWNER/REPO.git` after adding to `~/.ssh/config`:
`Host github.com` / `IdentityFile ~/.ssh/valleyride`.

**First data:** the catalogue (pickup locations, bike models, prices, route guides) loads from the seed files; the
sample vehicles and demo people do not (demo accounts are skipped in production anyway):

```sh
for s in 20261022-01-locations 20261022-02-vehicle-models 20261022-04-route-guides 20261022-05-pricing-rules \
         20261025-01-model-specs-and-route-details 20261026-01-route-maps; do
  docker compose exec api ./node_modules/.bin/sequelize-cli db:seed --seed $s.js
done
```

Check the locations' addresses and the prices in the admin console, then add the real bikes under *Fleet*.

**First administrator:** log in once on the website with your phone number, then promote that account and log in again:

```sh
docker compose -f /opt/platform/compose.yaml exec postgres psql -U postgres -d valleyride \
  -c "UPDATE users SET role='admin' WHERE phone='+91XXXXXXXXXX'"
```

Memory is capped per container (API and worker 384 MB each, Redis 192 MB); together they use about 150 MB at rest.
Each process keeps at most 5 database connections. Check `server status` after each new app goes live.

## 3. Production data and services

Do not import the local database or run the full development seed set as launch data: it includes sample vehicles,
demo people, prices, location details and investments. Load and verify the real pickup locations, fleet, rates, guides,
and first administrator deliberately. Demo OTP and payment-simulation routes are disabled under `NODE_ENV=production`.

Before launch provide and test:

- Razorpay live key ID/secret and webhook secret. Follow [payment activation](PAYMENTS.md). Register
  `https://api.valleyride.in/api/v1/webhooks/razorpay` for captured/failed payments and processed/failed refunds.
- MSG91 credentials and an approved OTP template; verify login on a real phone number.
- A document photo upload from the website and from a phone, then the same file opened in the admin console.
- SMTP credentials and verified sender; WhatsApp credentials/template setup if that channel is enabled.
- Support contacts, GSTIN, SAC code, registered address, real rental terms and cancellation policy. Existing placeholders
  are recorded in the root README. Set the Expo project ID in `apps/mobile/app.json` and configure native push credentials
  to enable push notifications. Those account values have not been supplied.

## 4. Hostinger website

Use **Node.js Web App** hosting (the app needs a running Next.js server). Import this monorepo, select Node 22,
keep root directory `./`, and use:

| Setting | Value |
| --- | --- |
| Install | `pnpm install --frozen-lockfile` (Hostinger detects pnpm from the lock file) |
| Build | `pnpm build:hostinger` |
| Output directory | `apps/web/.next/standalone` |
| Entry file within output | `apps/web/server.js` |
| Equivalent start command from repository root | `node apps/web/.next/standalone/apps/web/server.js` |

Set these **before building** (Razorpay keys are configured on the backend only):

```dotenv
NEXT_PUBLIC_API_URL=https://api.valleyride.in
NEXT_PUBLIC_SITE_URL=https://valleyride.in
NEXT_PUBLIC_SUPPORT_WHATSAPP=<real E.164 support number>
NEXT_PUBLIC_SUPPORT_EMAIL=<real support email>
```

Use the port provided by Hostinger at runtime; the standalone server respects `PORT`. Do not copy the backend `.env`
to Hostinger. API-backed pages fetch catalogue content at build time, so bring up the API and production catalogue first.
The build helper copies public assets and Next.js chunks into the standalone output. `COOKIE_DOMAIN=.valleyride.in`
allows browser login cookies from the API to reach the website middleware. CORS allows both website origins.

## 5. Mobile releases

`apps/mobile/eas.json` includes internal APK and store build profiles with the permanent domain. Release code pins
both production domains even if a developer's local `.env` contains localhost. Expo Go / development previews still
honor `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` for local testing.

Link the Expo project, supply its project ID, signing credentials, push configuration and real support numbers before building.
Razorpay uses the official native SDK; the public key is fetched from the API when checkout opens. No Razorpay keys belong in the app environment. Public variables contain no secrets. Build from `apps/mobile` using
`eas build --profile preview --platform android` or `eas build --profile production --platform all`.
Keep `ANDROID_ALLOW_CLEARTEXT` unset and regenerate native projects for production; existing native test projects may
contain development cleartext allowances. App-store submission and physical-device payment/push checks are still required.

## 6. Releases, rollback and backups

Push to `main`, then on the server: `server deploy /opt/apps/valleyride/infra/production`. Hostinger rebuilds the
website by itself.

**Backups:** the server dumps every database nightly and before every deploy to `/opt/backups/postgres/valleyride/`.
A backup on the same disk isn't a backup: copy `/opt/backups` off the droplet (DigitalOcean droplet backups, or
`rclone` to Spaces from cron). Redis holds queued jobs in its `valleyride_redis` volume. Uploaded files are archived daily and before every deploy to `/opt/apps/valleyride/infra/production/backups` (kept 14 days): copy that folder off the droplet too.

**Restore test** (into a scratch database, never over the live one):

```sh
docker compose -f /opt/platform/compose.yaml exec -T postgres createdb -U postgres valleyride_restore_test
docker compose -f /opt/platform/compose.yaml exec -T postgres pg_restore -U postgres -d valleyride_restore_test \
  --no-owner --no-acl --exit-on-error < /opt/backups/postgres/valleyride/<file>.dump
```

**Rollback:** `git -C /opt/apps/valleyride checkout <previous commit>`, then `docker compose up -d --build --wait` in
`infra/production`, after confirming the older code works with the current database (migrations are never undone
automatically). Run `git checkout main` before the next `server deploy`.

Monitor `https://api.valleyride.in/ready` (database and Redis) with a free uptime checker, and the worker with
`docker compose logs --tail=50 worker`.

## 7. Changing backend hosting later

Provision the new API and worker with the same `/api/v1` contract, database, storage access and JWT secrets.
Plan a write pause or database replication for consistent transfer; stop old workers during the final handover,
preserve queued jobs, and avoid running duplicate job schedulers against independent databases. Verify the new origin,
including readiness, OTP, uploads, payments and webhooks. Update `api` DNS to the new provider, keep the old backend
available through DNS-cache expiry, and monitor before retiring it. Webhook and app URLs remain unchanged.

No app rebuild is needed for a hosting move that preserves the domain and API contract. An older app already built
with a LAN IP requires one corrected release to start using this permanent domain.

## References

- [Hostinger monorepo configuration](https://www.hostinger.com/support/how-to-deploy-monorepos-with-npm-yarn-or-pnpm-on-hostinger/)
- [Hostinger Node.js hosting](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Expo build environment variables](https://docs.expo.dev/eas/environment-variables/usage/)
