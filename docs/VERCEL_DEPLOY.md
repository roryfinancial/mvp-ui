# Vercel Launch — Data & Environment

Production runs on **Neon Postgres** (Vercel's filesystem is ephemeral/read-only,
so the SQLite demo DB cannot be used there). The committed schema's datasource
`provider` is `postgresql`; the SQLite path is only for local `npm run demo`.

## 1. Prisma on Vercel

`package.json` runs `prisma generate` in `postinstall`, so the Prisma client is
generated on every Vercel build (Vercel installs devDependencies during build).
No extra build command is needed — Vercel auto-detects Next.js and runs
`next build`. `next.config.ts` already lists `@prisma/client` under
`serverExternalPackages`.

The build does **not** connect to the database (all data routes are dynamic and
the app pages are client-rendered), so a missing/unreachable DB at build time is
fine — only the runtime needs `DATABASE_URL`.

## 2. Required environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** connection string | host contains `-pooler`. See pooling note below. |
| `DATABASE_PROVIDER` | `postgresql` | read by Better Auth's Prisma adapter |
| `BETTER_AUTH_SECRET` | 64-hex secret | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` | Better Auth `baseURL` + OAuth redirect base |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth creds | optional — only if Google login is used |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | OAuth creds | optional |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | OAuth creds | optional |

`DEMO_MODE` is **not** set in production (it only toggles the local SQLite demo).
Stripe keys are not required — Stripe is stubbed (no real charges).

> After deploying, set `NEXT_PUBLIC_APP_URL` to the real Vercel URL and add that
> URL as an authorized redirect/callback in each OAuth provider's console.

## 3. Neon connection pooling (serverless)

Use the **pooled** URL (`-pooler` host) for `DATABASE_URL` at runtime. If you see
`prepared statement "s0" already exists` errors under load, append
`?pgbouncer=true&connection_limit=1` (preserving the existing
`sslmode=require`). For schema changes/migrations, prefer a **direct**
(non-pooled) Neon URL.

## 4. Sync the schema to Neon

The schema changed substantially from the original Java/JPA shape (enums →
String, `communities` → JSON string, money → Float, plus all the new domain
tables and `founder_suggestions`). Push it to Neon once before launch:

```bash
# Uses DATABASE_URL from your local .env (Neon). --accept-data-loss is required
# because column types changed from the old schema.
DATABASE_PROVIDER=postgresql npx prisma db push --accept-data-loss
```

To populate the launch with the demo dataset (creators, projects, gifts, posts,
gamification, events) — **destructive: wipes existing domain rows**:

```bash
DATABASE_PROVIDER=postgresql npm run db:seed
```

For a versioned history instead of `db push`, use `prisma migrate deploy` with a
committed `prisma/migrations/` folder (not set up yet).

## 5. Switching back to local demo

```bash
npm run demo:setup   # flips schema to sqlite, pushes, seeds local demo.db
npm run demo
npm run prod:restore # flips back to postgresql + regenerates the client
```
