# User Domain Migration: Next.js + Prisma + Neon.tech

**Date:** 2026-06-09  
**Status:** Approved  
**Scope:** User identity, auth, profiles, platforms, follows — only. Java backend unchanged for all other domains.

---

## Context

The current stack is a Vite+React SPA talking to a Java Spring Boot backend (`rory-backend`) at `localhost:8080`. Auth is handled by Supabase (email/password + OAuth), which issues JWTs the Java backend validates via its JWKS endpoint.

The problem: Supabase is a dependency we don't control; the Java build cycle is slow for iteration; and there is no path to OIDC/SAML without significant work in Spring Security.

**Decision:** Migrate the user domain (auth + user profiles + platforms + follows) to Next.js 15 + Better Auth + Prisma + Neon.tech. The Java backend continues unchanged for projects, gifts, wallet, Stripe, gamification, events, leaderboard, analytics, feed, and referrals.

---

## Architecture

### Repository layout after migration

```
mvp-ui/                              (this repo)
├── app/                             Next.js App Router root
│   ├── (app)/                       Authenticated app shell
│   │   └── layout.tsx               Wraps existing components
│   ├── login/
│   │   └── page.tsx                 Login page (uses existing Auth.tsx)
│   ├── signup/
│   │   └── page.tsx                 Signup page
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx             OAuth callback handler
│   └── api/
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts         Better Auth catch-all handler
│       └── users/
│           ├── [username]/
│           │   ├── route.ts         GET/PUT profile
│           │   ├── settings/route.ts
│           │   ├── platforms/route.ts
│           │   └── communities/route.ts
│           └── me/
│               └── route.ts        GET current user (replaces /api/auth/me on Java)
├── prisma/
│   ├── schema.prisma                User domain schema
│   ├── migrations/                  Prisma migration history
│   └── seed.ts                      Demo user seeder
├── src/                             Existing components/lib (mostly unchanged)
│   ├── app/components/              All existing components — no changes
│   ├── contexts/AuthContext.tsx     Rewritten to use Better Auth client
│   ├── lib/
│   │   ├── auth.ts                  Deleted (Supabase legacy)
│   │   ├── supabase.ts              Deleted
│   │   ├── auth-client.ts           New: Better Auth browser client
│   │   └── api.ts                   Updated: /api/auth/me → /api/users/me
│   └── ...
├── docs/
│   └── demo-users.md                Demo credentials (committed)
├── next.config.ts
├── package.json                     Adds: next, better-auth, prisma, @prisma/client
└── vite.config.ts                   Removed after migration
```

### Request routing

| Domain | Handler | Database |
|--------|---------|----------|
| Auth (login/signup/OAuth/session) | Next.js `/api/auth/[...all]` | Neon.tech via Prisma |
| User profile / settings / platforms / follows | Next.js `/api/users/*` | Neon.tech via Prisma |
| Projects, items | Java `localhost:8080/api/projects/*` | Java's Postgres |
| Gifts, wallet, Stripe | Java `localhost:8080/api/gifts/*` etc. | Java's Postgres |
| Feed, gamification, leaderboard, events | Java `localhost:8080/api/*` | Java's Postgres |

### JWT handshake

Better Auth issues standard JWTs (RS256, JWKS exposed at `/api/auth/.well-known/jwks.json`).

Java `SecurityConfig.java` change — replace:
```yaml
spring.security.oauth2.resourceserver.jwt.jwk-set-uri: ${SUPABASE_URL}/auth/v1/.well-known/jwks.json
```
with:
```yaml
spring.security.oauth2.resourceserver.jwt.jwk-set-uri: ${NEXT_PUBLIC_APP_URL}/api/auth/.well-known/jwks.json
```

Java's `JwtAuthenticationFilter` looks up users by the `sub` claim (user UUID). The Prisma `User.id` becomes the JWT `sub`. Java's `users` table gets a new column `auth_id UUID UNIQUE` populated during the user migration/re-registration flow; `supabase_id` is removed.

---

## Data Layer

### Prisma schema (user domain)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Better Auth core tables
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Rory profile fields
  username                  String?   @unique @db.VarChar(50)
  displayName               String?   @db.VarChar(100)
  bio                       String?
  avatarUrl                 String?   @db.VarChar(500)
  userType                  UserType?
  creditBalance             Decimal   @default(0) @db.Decimal(12, 2)
  stripeAccountId           String?   @db.VarChar(255)
  stripeOnboardingComplete  Boolean   @default(false)
  stripeCustomerId          String?   @db.VarChar(255)
  referralCode              String?   @unique @db.VarChar(50)
  communities               String[]  @default([])
  isProfileComplete         Boolean   @default(false)

  // Notification settings
  emailNotifications        Boolean   @default(true)
  giftNotifications         Boolean   @default(true)
  milestoneNotifications    Boolean   @default(true)
  marketingNotifications    Boolean   @default(false)

  // Privacy settings
  profileVisible            Boolean   @default(true)
  showOnLeaderboard         Boolean   @default(true)
  showGiftAmounts           Boolean   @default(true)

  // Relations
  accounts           Account[]
  sessions           Session[]
  connectedPlatforms ConnectedPlatform[]
  following          Follow[]  @relation("Supporter")
  followers          Follow[]  @relation("Creator")

  @@map("users")
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("accounts")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verifications")
}

model ConnectedPlatform {
  id             String       @id @default(cuid())
  userId         String
  platform       PlatformType
  platformUserId String?      @db.VarChar(255)
  handle         String?      @db.VarChar(100)
  url            String?      @db.VarChar(500)
  accessToken    String?
  refreshToken   String?
  tokenExpiresAt DateTime?
  connectedAt    DateTime     @default(now())
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, platform])
  @@map("connected_platforms")
}

model Follow {
  id          String   @id @default(cuid())
  supporterId String
  creatorId   String
  createdAt   DateTime @default(now())
  supporter   User     @relation("Supporter", fields: [supporterId], references: [id], onDelete: Cascade)
  creator     User     @relation("Creator", fields: [creatorId], references: [id], onDelete: Cascade)

  @@unique([supporterId, creatorId])
  @@map("follows")
}

enum UserType {
  CREATOR
  SUPPORTER
}

enum PlatformType {
  YOUTUBE
  TWITCH
  TWITTER
  INSTAGRAM
  TIKTOK
  SHOPIFY
}
```

**Database:** `postgresql://neondb_owner:npg_REDACTED@ep-odd-term-a65zksmr-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

---

## Auth Layer

**Library:** [Better Auth](https://www.better-auth.com/) v1.x

### Providers configured

| Provider | Replaces |
|----------|---------|
| Email + password | Supabase email/password |
| Google OAuth | Supabase Google |
| Twitch OAuth | Supabase Twitch |
| Twitter/X OAuth | Supabase Twitter |

### OIDC/SAML readiness

Better Auth exposes a standard OIDC discovery endpoint (`/.well-known/openid-configuration`) and supports SAML via plugin. These are configured but not required for initial launch — they exist so external clients (Claude MCP, enterprise SSO) can integrate without further backend changes.

### Server config (`lib/auth.ts` — server-side, not the deleted client file)

```ts
// lib/auth.server.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google:  { clientId: process.env.GOOGLE_CLIENT_ID!,  clientSecret: process.env.GOOGLE_CLIENT_SECRET! },
    twitch:  { clientId: process.env.TWITCH_CLIENT_ID!,  clientSecret: process.env.TWITCH_CLIENT_SECRET! },
    twitter: { clientId: process.env.TWITTER_CLIENT_ID!, clientSecret: process.env.TWITTER_CLIENT_SECRET! },
  },
});
```

### Client config (`src/lib/auth-client.ts`)

```ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({ baseURL: process.env.NEXT_PUBLIC_APP_URL });
```

### AuthContext rewrite

`AuthContext.tsx` interface stays **identical** — same `login`, `signUp`, `signInWithProvider`, `logout`, `completeProfile`, `updateBalance`, `refreshUser` signatures. Internals swap from Supabase SDK calls to `authClient.*` calls + fetch to `/api/users/me`. Zero changes to any component that consumes `useAuth()`.

---

## API Routes (Next.js)

### Auth — handled entirely by Better Auth catch-all
`app/api/auth/[...all]/route.ts` — two lines, delegates everything to Better Auth.

### User routes

| Method | Path | Replaces Java endpoint |
|--------|------|----------------------|
| GET | `/api/users/me` | `GET /api/auth/me` |
| PUT | `/api/users/[username]` | `PUT /api/users/{username}` |
| PUT | `/api/users/[username]/settings` | `PUT /api/users/{username}/settings` |
| GET/POST | `/api/users/[username]/platforms` | `GET/POST /api/users/{username}/platforms` |
| DELETE | `/api/users/[username]/platforms/[platform]` | `DELETE /api/users/{username}/platforms/{platform}` |
| PUT | `/api/users/[username]/communities` | `PUT /api/users/{username}/communities` |
| GET | `/api/users/[username]` | `GET /api/users/{username}` (public profile) |
| POST/DELETE | `/api/follows/[username]` | `POST/DELETE /api/follows/{username}` |
| GET | `/api/follows/following` | `GET /api/follows/following` |
| GET | `/api/follows/[username]/count` | `GET /api/follows/creator/{username}/count` |
| GET | `/api/follows/[username]/status` | `GET /api/follows/{creatorUsername}/status` |

All other endpoints in `src/lib/api.ts` continue pointing to Java `VITE_API_URL` unchanged.

---

## Demo Users

File: `docs/demo-users.md`

Seeded via `prisma/seed.ts`. All passwords follow the pattern `Rory2026!<name>` (e.g. `Rory2026!Alex`).

| Username | Type | Email | Password |
|----------|------|-------|---------|
| alex_creates | Creator | alex@demo.rory.dev | Rory2026!Alex |
| maya_streams | Creator | maya@demo.rory.dev | Rory2026!Maya |
| jordan_builds | Creator | jordan@demo.rory.dev | Rory2026!Jordan |
| sam_supports | Supporter | sam@demo.rory.dev | Rory2026!Sam |
| riley_tips | Supporter | riley@demo.rory.dev | Rory2026!Riley |
| casey_fans | Supporter | casey@demo.rory.dev | Rory2026!Casey |
| demo_admin | Creator | admin@demo.rory.dev | Rory2026!Admin |

---

## Migration Steps (high level)

1. Add Next.js to the repo (`next`, `better-auth`, `prisma`, `@prisma/client`)
2. Convert `vite.config.ts` → `next.config.ts`; move pages to App Router
3. Run `prisma migrate dev` against Neon.tech → creates schema
4. Run `prisma/seed.ts` → creates demo users
5. Implement `app/api/auth/[...all]/route.ts`
6. Implement user + follow API routes
7. Rewrite `AuthContext.tsx` to use Better Auth client
8. Update `src/lib/api.ts`: swap auth/user endpoints to Next.js paths, keep Java paths for everything else
9. Update Java `SecurityConfig.java`: point JWKS URI at Next.js
10. Delete `src/lib/supabase.ts`, `src/lib/auth.ts` (legacy)
11. Remove `@supabase/supabase-js` dependency
12. Smoke test all auth flows + verify Java endpoints still work with new JWTs

---

## Environment Variables

```env
# Neon.tech
DATABASE_URL=postgresql://neondb_owner:npg_REDACTED@ep-odd-term-a65zksmr-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Better Auth
BETTER_AUTH_SECRET=<generate: openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Java backend (unchanged)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## What Does NOT Change

- All components in `src/app/components/` — zero edits
- `src/lib/api.ts` non-auth endpoints — zero edits  
- Java backend code — only `SecurityConfig.java` JWKS URI changes
- Java database — no schema changes except adding `auth_id` column and dropping `supabase_id`
- Stripe integration — untouched
- Gamification, feed, leaderboard, events — untouched
