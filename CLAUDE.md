# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this is

Open LIMS: a Laboratory Information Management System for diagnostic labs. npm workspaces monorepo:

- `backend/` - Node.js 20+/Express 4/TypeScript/Prisma 6/PostgreSQL REST API
- `frontend/` - staff app (React 19 + Vite, port 3000): admin panel `/admin/*` and franchise portal `/portal/*`
- `frontend/superadmin/` - Superadmin app (port 3100), separate package (own `package.json`)
- `frontend/patient-web/` - patient website (port 3200), separate package
- `docs/` - module documentation; `shared-assets/` - shared SVG icons

## Commands

```bash
npm install && npm --prefix frontend/superadmin install && npm --prefix frontend/patient-web install
docker compose up -d                      # local PostgreSQL
npm run dev                               # backend + all frontends
npm run lint && npm run typecheck         # static checks (all workspaces)
npm test -w backend                       # vitest
npm run prisma:migrate -w backend -- --name <change>   # create a migration
npm run prisma:seed -w backend            # seed roles, admin user, masters (SEED_CATALOGUE=true for samples)
```

## Backend conventions

- Layers: `routes/` -> `controllers/` -> `services/` -> `repositories/`. Validation lives in `validations/` (express-validator) and zod for env (`config/env.ts`).
- Mount points are in `src/app.ts`: `/api/v1` (staff), `/api/v1/app` (patient app), `/api/v1/sample-boy` (phlebotomist app), `/api/v1/cms`, `/api/webhook/whatsapp`.
- Three separate JWT secrets (staff / patient app / phlebo app). Never share them.
- Roles are database rows (`ADMIN`, `FRANCHISE` seeded); franchise users see only their own organization's data - keep new endpoints scoped (see `franchiseOrderScope.ts`).
- Schema is `backend/prisma/schema.prisma`; every change needs a committed migration.
- New env vars go in `config/env.ts`, `backend/.env.example` and the README table.

## Frontend conventions

- TanStack Query for server state, React Hook Form + Zod for forms, shadcn/ui + Tailwind v4 components under `components/ui`.
- API clients live in `services/api/`; hooks in `hooks/queries/`.
- Patient-web uses mock data under `src/mocks/` for demo/dev paths; all of it is fictional.

## Rules for this repo

- Never commit secrets, `.env` files, database dumps or real patient/customer data. All sample data must be fictional.
- Keep branding generic ("Open LIMS", "Example Diagnostics Lab", `example.com`).
- Prefer editing existing modules over adding parallel ones; match surrounding style.
- Run lint, typecheck and backend tests before declaring work done.
