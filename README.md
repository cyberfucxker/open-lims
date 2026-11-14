# Open LIMS

Open LIMS is an open-source **Laboratory Information Management System for diagnostic labs**. It covers the whole life of a lab test: patient registration and booking, sample collection and tracking, result entry and report approval, billing and invoicing, B2B/franchise referral business, and a patient-facing website and API for online booking with home sample collection.

> All names, addresses, prices, copy and images in this repository are fictional placeholders ("Example Diagnostics Lab"). Replace them with your own before going live.

## Features

**Lab operations (staff app, `frontend/`)**
- Patient registration and order/appointment booking in one screen, with patient search and history
- Test, parameter and package catalogue; departments, categories, sample types, containers, sample rules and result configs
- Sample collection with barcode labels, status lifecycle (collected / received / rejected) and audit trail
- Result entry, per-test report workflow, signatories, report PDFs with configurable branding
- Billing, partial payments, invoice PDFs, expenses and finance reports
- B2B organizations / franchises with price lists, credit terms and a restricted franchise portal (`/portal/*`)
- Referral management (doctors, hospitals, clinics) with automatic commissions and settlements
- Marketing staff module: doctor visits, monthly targets, commission slabs, leaderboards

**Superadmin app (`frontend/superadmin/`)**
- Orders, customers, phlebotomists, centers, cities/areas, slot templates and capacity
- Coupons, wallet and recharge offers, payment gateway configuration (Razorpay)
- CMS pages, blog, banners, landing pages, home SEO content, notification campaigns
- WhatsApp AI booking assistant (Meta WhatsApp Cloud API + Claude) with knowledge base, concern-to-test mapping and follow-up reminders
- Support tickets, audit log, exports

**Patient website and API (`frontend/patient-web/`, `/api/v1/app`)**
- OTP login, family members, addresses, prescriptions upload
- Catalogue browsing, cart, coupons, wallet, online payment, home-visit booking, slot selection
- Reports, third-party report bridge, nearby labs, city landing pages with SEO prerendering and sitemap

**Phlebotomist API (`/api/v1/sample-boy`)** for sample-collector mobile apps: bookings, dashboard, notifications and profile.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20+, Express 4, TypeScript, Prisma 6, PostgreSQL |
| Auth | JWT access tokens, rotating refresh tokens, separate secrets for staff / patient app / phlebo app |
| Documents | pdfkit (invoices, reports, labels), exceljs, bwip-js (barcodes) |
| Integrations | Razorpay, SMS gateway (DLT), Firebase Cloud Messaging, WhatsApp Cloud API, Anthropic API, Nominatim geocoding |
| Frontends | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query/Table, React Hook Form + Zod, React Router 7 |
| Tests | Vitest (backend) |

## Architecture

```
open-lims/
├── backend/                 Express API  (routes -> controllers -> services -> repositories)
│   ├── prisma/              schema.prisma, migrations, seed + backfill scripts
│   └── src/                 app.ts, server.ts, config, middleware, services, ...
├── frontend/                Staff app (admin + franchise portal)      :3000
│   ├── superadmin/          Superadmin control center                 :3100
│   └── patient-web/         Patient-facing website                    :3200
├── shared-assets/           Shared SVG icons
└── docs/                    Module documentation and admin guide
```

The API is mounted at `/api/v1` (staff), `/api/v1/app` (patient app), `/api/v1/sample-boy` (phlebotomist app), `/api/v1/cms` (public CMS) and `/api/webhook/whatsapp`. API documentation for the patient/phlebo namespaces is served via Swagger UI by the backend.

## Quickstart

Prerequisites: Node.js 20 or 22 (see `.nvmrc`), npm, and PostgreSQL 14+ (or Docker).

```bash
# 1. Install dependencies (npm workspaces)
npm install
npm --prefix frontend/superadmin install
npm --prefix frontend/patient-web install

# 2. Start PostgreSQL (or point DATABASE_URL at your own server)
docker compose up -d

# 3. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp frontend/superadmin/.env.example frontend/superadmin/.env
cp frontend/patient-web/.env.example frontend/patient-web/.env
#    Edit backend/.env: generate the three JWT secrets, e.g.
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Create the schema and seed reference data + the admin user
npm run prisma:deploy -w backend
npm run prisma:generate -w backend
SEED_ADMIN_PASSWORD='choose-a-strong-password' SEED_CATALOGUE=true npm run prisma:seed -w backend

# 5. Run everything (API on :5001, apps on :3000 / :3100 / :3200)
npm run dev
```

Log in to the staff app at http://localhost:3000 with the username `admin` (or `SEED_ADMIN_USERNAME`) and the password you set. If you do not set `SEED_ADMIN_PASSWORD`, a random one is generated and printed by the seed script.

Useful scripts:

| Command | Purpose |
|---|---|
| `npm run dev` | Backend + all three frontends |
| `npm run build` | Build backend and all frontends |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm test -w backend` | Backend tests (WhatsApp integration tests need `WHATSAPP_TEST_DATABASE_URL`, see `docs/MODULES.md`) |
| `npm run seed:cities -w backend` / `seed:areas` | Sample city and area data |

## Environment variables

Backend (`backend/.env`, template in `backend/.env.example`):

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | no | `development` (default), `test` or `production` |
| `PORT` | no | API port (default 5000; the example uses 5001) |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `CORS_ORIGIN` | yes in prod | Comma-separated frontend origins; no localhost in production |
| `LOG_LEVEL` | no | `error`, `warn`, `info`, `http`, `debug` |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | no | Global rate limit |
| `JWT_ACCESS_SECRET` | yes | Staff JWT secret (32+ chars) |
| `JWT_APP_ACCESS_SECRET` | yes | Patient-app JWT secret (32+ chars) |
| `JWT_PHLEBO_ACCESS_SECRET` | yes | Phlebotomist-app JWT secret (32+ chars) |
| `JWT_*_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN_DAYS` | no | Token lifetimes |
| `BCRYPT_SALT_ROUNDS`, `AUTH_RATE_LIMIT_*` | no | Password hashing and auth rate limiting |
| `OTP_EXPIRES_IN_MINUTES`, `OTP_MAX_ATTEMPTS` | no | OTP behaviour |
| `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD` | no | Initial admin created by the seed script |
| `SEED_CATALOGUE` | no | `true` also seeds the sample test/package catalogue |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | for payments | Razorpay credentials |
| `SMS_API_URL`, `SMS_USERNAME`, `SMS_PASSWORD`, `SMS_FROM`, `SMS_DLT_ENTITY_ID`, `SMS_DLT_CONTENT_ID` | for SMS | SMS gateway (production only) |
| `SMS_TIMEOUT_MS`, `SMS_MAX_RETRIES`, `SMS_ORDER_ALERT_NUMBERS` | no | SMS tuning and head-office alert numbers |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | for push | Firebase service account |
| `THIRD_PARTY_LAB_ORIGIN`, `THIRD_PARTY_LAB_BASE_URL`, `THIRD_PARTY_LAB_ID` | optional | Partner-lab report bridge |
| `SITEMAP_OUTPUT_DIR`, `SITEMAP_SITE_ORIGIN` | no | Sitemap generation target and public origin |
| `WHATSAPP_ENCRYPTION_KEY` | yes in prod | 32 random bytes, base64; encrypts stored WhatsApp/AI keys |
| `PUBLIC_API_BASE_URL` | recommended | Public API origin (webhook URL, signed report links) |

Frontends (`frontend*/.env`):

| Variable | App | Description |
|---|---|---|
| `VITE_API_BASE_URL` | all | Backend base URL, e.g. `http://localhost:5001/api/v1` |
| `VITE_WEBSITE_ORIGIN` | superadmin | Public website origin for landing-page previews |
| `VITE_SITE_ORIGIN` | patient-web | Public origin used for sitemap/prerender |
| `VITE_GOOGLE_MAPS_API_KEY` | patient-web | Google Maps key for the address picker |
| `VITE_APP_STORE_URL`, `VITE_PLAY_STORE_URL` | patient-web | Mobile app store listings |

## Documentation

- [docs/MODULES.md](docs/MODULES.md) - module-by-module reference (marketing staff, referrals, WhatsApp assistant, landing pages)
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) - staff app feature guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - how to contribute

## Production notes

- Set `NODE_ENV=production`, strong unique JWT secrets, a real `CORS_ORIGIN`, and `WHATSAPP_ENCRYPTION_KEY`.
- Run `npm run build`, apply migrations with `npm run prisma:deploy -w backend`, and serve the frontend `dist/` folders from any static host or reverse proxy (an SPA fallback to `index.html` is required).
- The SMS template migration seeds **placeholder DLT template ids**; replace them with your registered ids.
- Legal pages (terms, privacy, refund) and the About/Careers/Franchise pages contain sample text. Replace them with content reviewed by your own counsel.
- Back up the database before every migration.

## License

[MIT](LICENSE)
