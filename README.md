# Valley Ride

Two-wheeler rental platform for Dehradun, Mussoorie and Rishikesh. The design source of truth is
[`valley-ride-architecture.html`](valley-ride-architecture.html).

| Path | What |
| --- | --- |
| `apps/web` | Next.js (App Router) — public site, `/account`, `/admin`, `/invest` |
| `apps/api` | Express 5 + Sequelize 6 — REST `/api/v1`, plus the BullMQ worker |
| `apps/mobile` | Expo app (iOS + Android), same API |
| `packages/shared` | Zod schemas, enums and `pricing.ts`, imported by every app |
| `infra` | Local services, Dockerfiles, production Caddy/Compose and Hostinger setup |

## Production hosting

The website and dashboards run on **Hostinger Node.js hosting**; the API and worker run on a **DigitalOcean VPS**
behind Caddy. PostgreSQL and Redis stay private. Mobile release builds always call **`https://api.valleyride.in`**
and use REST endpoints under `/api/v1`; changing backend providers only requires moving the services/data and
updating DNS while preserving that API contract.

Razorpay credentials are configured on the backend only. The website and mobile app fetch the public key at checkout,
so adding payment keys later does not require another frontend build. Follow [payment activation](infra/production/PAYMENTS.md)
for the key ID, key secret, webhook secret and dashboard configuration. The app now uses Razorpay's native SDK;
rebuild native apps once to include it.

Follow the [production setup and migration guide](infra/production/README.md) for the supplied droplet,
DNS, private database, HTTPS, Hostinger build settings, mobile releases, backups and launch requirements.

## Run locally

```bash
pnpm install
pnpm infra:up                        # postgres :5432, redis :6379, mailpit :8025
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate && pnpm db:seed      # locations, models, 30 vehicles, route guides; safe to re-run
pnpm dev                             # web :3000, api :4000, worker
```

Login is by mobile number and password ("Create account" on the website or app). A rider who forgets theirs gets a
temporary one from staff (admin → Customers → Reset a rider's password).

Mobile app:

```bash
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_API_URL must be your Mac's LAN IP on a real phone
pnpm --filter @valleyride/mobile dev
```

### Demo accounts (development and staging only)

Log in with the number and the password **valleyride** (in production these are ordinary numbers with no special access):

| Role | Phone | Sees |
| --- | --- | --- |
| Rider | 90000 00001 | Website, app, My bookings |
| Staff | 90000 00002 | `/admin`: pickups, returns, fleet, calendar, documents, content |
| Admin | 90000 00003 | Everything staff sees, plus finance, pricing, coupons, investors |
| Investor | 90000 00004 | `/invest/portal` with a sample ₹2,50,000 investment |

### Development modes (never active in production)

- **Mock payments.** While `RAZORPAY_KEY_ID` is the `.env.example` placeholder (ends in `xxx`), orders are
  `order_mock_*`. Checkout on web and mobile then shows test buttons that call `POST /api/v1/dev/payments/simulate`,
  which runs the same capture code as the Razorpay webhook.
- **Local file storage.** `STORAGE_DRIVER` defaults to `local` (also in production, where it is a Docker volume):
  KYC files, handover photos and signatures go to `apps/api/.uploads` behind HMAC-signed `/api/v1/files` links.
- **Staff and admin access.** Create an account (or use a demo login), then promote it:
  `docker exec valleyride-postgres-1 psql -U valley -d valleyride -c "UPDATE users SET role='admin' WHERE phone='+91…'"`,
  and log in again so the new role is in the token. The console is at `/admin`.

### Owner-supplied values still to fill in

GSTIN, SAC code and registered address (invoice), support WhatsApp / desk phone / email
(`NEXT_PUBLIC_SUPPORT_*`, `EXPO_PUBLIC_DESK_PHONE`, `EXPO_PUBLIC_SUPPORT_WHATSAPP`), fixed costs for the P&L, and the
final rental-agreement text. Cancellation refunds and the late fee come from the architecture document's prototype and
live in `packages/shared/src/policy.ts`; confirm them before launch.

## End-to-end tests

Full user flows in real browsers: the website as desktop Chrome, iPhone Safari and Android Chrome, and the app's
React Native screens (web build) at iPhone, iPhone SE and Pixel sizes. Needs the stack running in mock-payment mode:

```bash
pnpm infra:up && pnpm --filter @valleyride/api dev            # API + worker
pnpm --filter @valleyride/web build && pnpm --filter @valleyride/web start
cd apps/mobile && npx expo start --web --port 8090           # 8081 is often another project's Metro
cd e2e && npx playwright install chromium webkit && pnpm e2e   # pnpm e2e:web / pnpm e2e:app for one half
```

## Run the app on an iPhone (USB)

1. Xcode → Settings → Accounts: sign in with your Apple ID. On the iPhone: Settings → Privacy & Security →
   Developer Mode on, then trust the Mac when you plug it in.
2. `apps/mobile/.env`: `EXPO_PUBLIC_API_URL=http://<your Mac's Wi-Fi IP>:4000` (`ipconfig getifaddr en0`). The phone
   and the Mac must be on the same Wi-Fi; `localhost` on the phone is the phone itself.
3. `cd apps/mobile && npx expo run:ios --device` and pick the iPhone. The first build takes a few minutes; Xcode asks
   to set a signing team (your Apple ID's Personal Team is fine for testing).
4. Metro runs on 8081; stop other projects' Metro first or pass `--port 8082`.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test           # unit tests (pricing, amortization, state machine)
pnpm --filter @valleyride/api test:integration    # Supertest against valleyride_test + Redis db 1
```
