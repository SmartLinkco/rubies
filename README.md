# Rubies Cuisine

Lightweight food-ordering webapp for **Rubies Cuisine** (Amamorley / Greater Accra).

- **Web:** Next.js → Vercel (`apps/web`)
- **API:** Express → Render (`apps/api`)
- **DB:** PostgreSQL on [Neon](https://neon.tech)

## Setup

### 1. Neon database

1. Create a Neon project (region close to Ghana/EU if you prefer).
2. Copy both connection strings from the Neon dashboard:
   - **Pooled** → `DATABASE_URL` (host often contains `-pooler`)
   - **Direct** → `DIRECT_URL` (same credentials, host **without** `-pooler`)
3. Ensure both URLs include `?sslmode=require`.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# edit apps/api/.env with your Neon URLs
```

### 2. Install & migrate

```bash
npm install
npm run db:generate -w @rubies/api
npm run db:migrate -w @rubies/api
# when prompted for a migration name: init
npm run db:seed -w @rubies/api
```

### 3. Run locally

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

Health check: `GET http://localhost:4000/health`

## Workspace layout

```
apps/web          Customer + (later) admin UI
apps/api          Express API + Prisma
packages/shared   Brand tokens + shared DTOs
docs/             Plan + design references
```

## Phase status

See `docs/IMPLEMENTATION_PLAN.md`.

- **Phase 0** — done (Neon + scaffold + seed)
- **Phase 1** — done (splash/onboarding, discovery, menu detail, local cart + Call/WhatsApp)
- **Next:** Phase 2 — auth & profile
