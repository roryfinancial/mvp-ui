# Backend Migration — Java → Next.js + Prisma

The Spring Boot/JPA backend (`../rory-backend`) has been fully migrated into this
Next.js app. Every endpoint is now a same-origin Next.js API route backed by
Prisma. **The Java backend is no longer required to run the app.**

## What changed

- **Data layer:** all backend entities are now Prisma models in
  `prisma/schema.prisma` (project, project_items, gifts, deposits,
  credit_transactions, posts, post_likes, post_comments, user_gamification,
  daily_quests, user_badges, referrals, events — plus the existing auth/user
  models).
- **API:** the Java REST controllers were reimplemented as App Router routes
  under `app/api/**`. They return the same `ApiResponse<T>` / `PagedResponse<T>`
  envelopes the frontend already expects.
- **Frontend:** `src/lib/api.ts` now points at same-origin routes (`API_BASE = ""`,
  cookie auth). No component changes were needed.
- **Shared helpers:** `lib/api-helpers.ts` (response envelopes, auth, pagination,
  initials, time-ago, communities JSON) and `lib/gamification.ts` (XP/quests/league
  engine, also used by the gift flow).
- **Stripe:** route handlers are kept but **stubbed** — no real Stripe SDK calls.
  Deposits credit the balance immediately; gifts move internal credits; Connect
  onboarding/status return success. Gift responses return an empty `clientSecret`.

## Two databases, one schema

The schema is written in the SQLite/Postgres-compatible subset (enums → String
unions, no scalar lists, no native column types, money as Float). The datasource
`provider` is swapped by `scripts/select-db.mjs`.

### Production (Neon Postgres) — default
```bash
npm run prod:restore   # sets provider=postgresql + regenerates the client
npm run dev            # uses DATABASE_URL from .env (Neon)
```

### Demo mode (local SQLite, for backers/investors)
```bash
npm run demo:setup     # switch to sqlite, push schema, seed rich demo data
npm run demo           # next dev on the local demo.db (DEMO_MODE=true)
```

> The Prisma client is single-provider at a time, so always run `demo:setup`
> (regenerates for SQLite) before `demo`, and `prod:restore` before `dev`/`build`.

### Demo logins (password: `Rory2026!`)
- `creator@demo.rory.dev` — Demo Creator (projects, posts, gifts received)
- `supporter@demo.rory.dev` — Demo Supporter (500 credits, can gift)
- `mod@demo.rory.dev` — Demo Mod

The seed is self-consistent: seeded gifts run through the same ledger logic as the
live `/api/gifts` route, so wallet summaries, analytics, leaderboards, and project
progress all reconcile.

## Notes

- `.next` had some root-owned files from an earlier docker/sudo run. Build/dev
  honor `NEXT_DIST_DIR` to target a clean dir if needed
  (`NEXT_DIST_DIR=.next-build npm run build`). To reclaim the dir:
  `sudo chown -R $USER .next`.
- The Java-backend env vars (`NEXT_PUBLIC_API_URL`, etc.) are now unused.
