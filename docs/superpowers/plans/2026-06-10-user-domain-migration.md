# User Domain Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate auth + user domain from Vite+React+Supabase to Next.js 15 + Better Auth + Prisma + Neon.tech, keeping the Java backend unchanged for all other domains.

**Architecture:** Next.js App Router handles `/api/auth/*` and `/api/users/*` routes; a catch-all page renders the existing React app (with React Router) as a client component. `AuthContext.tsx` is rewritten to call Better Auth instead of Supabase — with identical public interface so zero component changes are needed. Java stays for projects, gifts, wallet, Stripe, gamification, feed, events, leaderboard, referrals.

**Tech Stack:** Next.js 15, Better Auth v1, Prisma ORM, Neon.tech Postgres, React Router v7 (preserved inside Next.js), TypeScript

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `app/layout.tsx` | Root layout with providers |
| Create | `app/(app)/[[...slug]]/page.tsx` | Catch-all — renders existing `<App />` |
| Create | `app/api/auth/[...all]/route.ts` | Better Auth catch-all |
| Create | `app/api/users/me/route.ts` | GET current user |
| Create | `app/api/users/[username]/route.ts` | GET/PUT public profile |
| Create | `app/api/users/[username]/settings/route.ts` | PUT settings |
| Create | `app/api/users/[username]/platforms/route.ts` | GET/POST platforms |
| Create | `app/api/users/[username]/platforms/[platform]/route.ts` | DELETE platform |
| Create | `app/api/users/[username]/communities/route.ts` | PUT communities |
| Create | `app/api/follows/[username]/route.ts` | POST/DELETE follow |
| Create | `app/api/follows/following/route.ts` | GET following list |
| Create | `app/api/follows/[username]/count/route.ts` | GET follower count |
| Create | `app/api/follows/[username]/status/route.ts` | GET follow status |
| Create | `lib/auth.server.ts` | Better Auth server instance |
| Create | `lib/prisma.ts` | Prisma client singleton |
| Create | `prisma/schema.prisma` | User domain schema |
| Create | `prisma/seed.ts` | Seeds 3 demo users |
| Create | `next.config.ts` | Next.js config with Vite rewrites |
| Modify | `src/contexts/AuthContext.tsx` | Swap Supabase → Better Auth client |
| Modify | `src/lib/api.ts` | Swap auth/user/follow endpoints to Next.js |
| Create | `src/lib/auth-client.ts` | Better Auth browser client |
| Delete | `src/lib/supabase.ts` | Supabase legacy |
| Keep | `src/lib/auth.ts` | Check first — may already be deleted |
| Modify | `package.json` | Add next, better-auth, prisma; adjust scripts |
| Modify | `tsconfig.json` | Add Next.js paths |
| Delete | `vite.config.ts` | Remove after migration complete |

---

## Task 1: Install dependencies and configure Next.js

**Files:**
- Modify: `package.json`
- Create: `next.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Install Next.js + auth + ORM packages**

```bash
cd /Users/aap/Projects/Rory/mvp-ui
npm install next@^15 better-auth@^1 prisma @prisma/client
npm install --save-dev @types/node
```

Expected: packages install cleanly. If `@types/node` already present, skip.

- [ ] **Step 2: Update `package.json` scripts**

Replace the `scripts` block:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "preview": "next start",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:seed": "npx tsx prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allows importing ESM packages from node_modules
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Update `tsconfig.json`**

Add/merge into the existing `tsconfig.json` compilerOptions:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Verify Next.js starts**

```bash
npx next dev --port 3000
```

Expected: Next.js starts (no pages yet — 404 is fine). `Ctrl+C` to stop.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json
git commit -m "feat: add Next.js 15, Better Auth, Prisma dependencies"
```

---

## Task 2: Prisma schema + Neon.tech connection

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env` additions (DATABASE_URL etc.)

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`.

- [ ] **Step 2: Replace `prisma/schema.prisma` with user domain schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  username                 String?   @unique @db.VarChar(50)
  displayName              String?   @db.VarChar(100)
  bio                      String?
  avatarUrl                String?   @db.VarChar(500)
  userType                 UserType?
  creditBalance            Decimal   @default(0) @db.Decimal(12, 2)
  stripeAccountId          String?   @db.VarChar(255)
  stripeOnboardingComplete Boolean   @default(false)
  stripeCustomerId         String?   @db.VarChar(255)
  referralCode             String?   @unique @db.VarChar(50)
  communities              String[]  @default([])
  isProfileComplete        Boolean   @default(false)

  emailNotifications     Boolean @default(true)
  giftNotifications      Boolean @default(true)
  milestoneNotifications Boolean @default(true)
  marketingNotifications Boolean @default(false)

  profileVisible    Boolean @default(true)
  showOnLeaderboard Boolean @default(true)
  showGiftAmounts   Boolean @default(true)

  accounts           Account[]
  sessions           Session[]
  connectedPlatforms ConnectedPlatform[]
  following          Follow[] @relation("Supporter")
  followers          Follow[] @relation("Creator")

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
  MODERATOR
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

- [ ] **Step 3: Set DATABASE_URL in `.env`**

Edit `.env` and set:

```
DATABASE_URL=postgresql://neondb_owner:npg_REDACTED@ep-odd-term-a65zksmr-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

- [ ] **Step 4: Push schema to Neon.tech**

```bash
npx prisma db push
```

Expected: `✓ Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✓ Generated Prisma Client`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Prisma schema for user domain"
```

---

## Task 3: Prisma client singleton + environment variables

**Files:**
- Create: `lib/prisma.ts`
- Modify: `.env`

- [ ] **Step 1: Create `lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Add remaining env vars to `.env`**

Append to `.env`:

```
# Better Auth
BETTER_AUTH_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth (fill in when needed)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# Java backend (unchanged)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

- [ ] **Step 3: Generate BETTER_AUTH_SECRET**

```bash
openssl rand -hex 32
```

Copy the output and paste it as the value of `BETTER_AUTH_SECRET` in `.env`.

- [ ] **Step 4: Commit**

```bash
git add lib/prisma.ts
git commit -m "feat: add Prisma client singleton"
```

---

## Task 4: Better Auth server config

**Files:**
- Create: `lib/auth.server.ts`

- [ ] **Step 1: Create `lib/auth.server.ts`**

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      username: { type: "string", required: false },
      displayName: { type: "string", required: false },
      bio: { type: "string", required: false },
      avatarUrl: { type: "string", required: false },
      userType: { type: "string", required: false },
      creditBalance: { type: "number", required: false },
      stripeAccountId: { type: "string", required: false },
      stripeOnboardingComplete: { type: "boolean", required: false, defaultValue: false },
      stripeCustomerId: { type: "string", required: false },
      referralCode: { type: "string", required: false },
      communities: { type: "string[]", required: false },
      isProfileComplete: { type: "boolean", required: false, defaultValue: false },
      emailNotifications: { type: "boolean", required: false, defaultValue: true },
      giftNotifications: { type: "boolean", required: false, defaultValue: true },
      milestoneNotifications: { type: "boolean", required: false, defaultValue: true },
      marketingNotifications: { type: "boolean", required: false, defaultValue: false },
      profileVisible: { type: "boolean", required: false, defaultValue: true },
      showOnLeaderboard: { type: "boolean", required: false, defaultValue: true },
      showGiftAmounts: { type: "boolean", required: false, defaultValue: true },
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth.server.ts
git commit -m "feat: add Better Auth server config"
```

---

## Task 5: Next.js App Router scaffold + catch-all page

**Files:**
- Create: `app/layout.tsx`
- Create: `app/(app)/[[...slug]]/page.tsx`

- [ ] **Step 1: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rory — Fan Gifts. Low Fees.",
  description: "Rory lets creators set goals for their projects and fans donate to help achieve them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create `app/globals.css`**

```bash
cp src/index.css app/globals.css
```

Then remove the `@import "./index.css"` from the root entry if it exists.

- [ ] **Step 3: Create `app/(app)/[[...slug]]/page.tsx`**

```tsx
"use client";

import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/src/contexts/AuthContext";
import App from "@/src/app/App";

export default function CatchAll() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
```

> **Note:** The existing `src/main.tsx` wraps `<App />` with `BrowserRouter` + `HelmetProvider` + `AuthProvider`. We replicate those wrappers here so the React app behaves identically.

- [ ] **Step 4: Check what `src/main.tsx` actually wraps**

Read `src/main.tsx` and verify the providers match what's in the catch-all page above. If `ThemeProvider` or any other context is present, add it to the catch-all.

- [ ] **Step 5: Run dev server and confirm app loads**

```bash
npx next dev --port 3000
```

Navigate to `http://localhost:3000`. The existing Rory app should render (login page or home). `Ctrl+C` when confirmed.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css "app/(app)/[[...slug]]/page.tsx"
git commit -m "feat: Next.js App Router scaffold with React app catch-all"
```

---

## Task 6: Better Auth API route

**Files:**
- Create: `app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create `app/api/auth/[...all]/route.ts`**

```ts
import { auth } from "@/lib/auth.server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Verify auth route responds**

```bash
npx next dev --port 3000 &
curl http://localhost:3000/api/auth/.well-known/jwks.json
```

Expected: JSON with a `keys` array (Better Auth's JWKS endpoint). Kill the server.

- [ ] **Step 3: Commit**

```bash
git add "app/api/auth/[...all]/route.ts"
git commit -m "feat: Better Auth catch-all API route"
```

---

## Task 7: `/api/users/me` route

**Files:**
- Create: `app/api/users/me/route.ts`

- [ ] **Step 1: Create `app/api/users/me/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { connectedPlatforms: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username ?? `user_${user.id.slice(0, 8)}`,
      displayName: user.displayName ?? user.name ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      userType: user.userType ?? "CREATOR",
      creditBalance: Number(user.creditBalance),
      stripeOnboardingComplete: user.stripeOnboardingComplete,
      referralCode: user.referralCode ?? null,
      communities: user.communities,
      isProfileComplete: user.isProfileComplete,
      settings: {
        emailNotifications: user.emailNotifications,
        giftNotifications: user.giftNotifications,
        milestoneNotifications: user.milestoneNotifications,
        marketingNotifications: user.marketingNotifications,
        profileVisible: user.profileVisible,
        showOnLeaderboard: user.showOnLeaderboard,
        showGiftAmounts: user.showGiftAmounts,
      },
      connectedPlatforms: user.connectedPlatforms.map((p) => ({
        platform: p.platform,
        handle: p.handle ?? "",
        url: p.url ?? "",
      })),
      createdAt: user.createdAt.toISOString(),
    },
    error: null,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/users/me/route.ts"
git commit -m "feat: /api/users/me route"
```

---

## Task 8: User profile + settings + platforms + communities routes

**Files:**
- Create: `app/api/users/[username]/route.ts`
- Create: `app/api/users/[username]/settings/route.ts`
- Create: `app/api/users/[username]/platforms/route.ts`
- Create: `app/api/users/[username]/platforms/[platform]/route.ts`
- Create: `app/api/users/[username]/communities/route.ts`

- [ ] **Step 1: Create `app/api/users/[username]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    include: { connectedPlatforms: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? user.name ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? user.image ?? null,
      userType: user.userType ?? "CREATOR",
      rank: null,
      totalRaised: null,
      totalSupporters: null,
      totalItems: null,
      totalGifted: null,
      creatorsSupported: null,
      itemsSupported: null,
      communities: user.communities,
      connectedPlatforms: user.connectedPlatforms.map((p) => ({
        platform: p.platform,
        handle: p.handle ?? "",
        url: p.url ?? "",
      })),
      createdAt: user.createdAt.toISOString(),
    },
    error: null,
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const body = await req.json();
  const user = await prisma.user.update({
    where: { username },
    data: {
      displayName: body.displayName,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
    },
    include: { connectedPlatforms: true },
  });
  return NextResponse.json({ success: true, data: { id: user.id, username: user.username, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl }, error: null });
}
```

- [ ] **Step 2: Create `app/api/users/[username]/settings/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      emailNotifications: body.emailNotifications,
      giftNotifications: body.giftNotifications,
      milestoneNotifications: body.milestoneNotifications,
      marketingNotifications: body.marketingNotifications,
      profileVisible: body.profileVisible,
      showOnLeaderboard: body.showOnLeaderboard,
      showGiftAmounts: body.showGiftAmounts,
    },
  });
  return NextResponse.json({ success: true, data: { id: user.id }, error: null });
}
```

- [ ] **Step 3: Create `app/api/users/[username]/platforms/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  const platforms = await prisma.connectedPlatform.findMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true, data: platforms.map((p) => ({ platform: p.platform, handle: p.handle ?? "", url: p.url ?? "" })), error: null });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const body = await req.json();
  const platform = await prisma.connectedPlatform.upsert({
    where: { userId_platform: { userId: session.user.id, platform: body.platform } },
    update: { handle: body.handle, url: body.url },
    create: { userId: session.user.id, platform: body.platform, handle: body.handle, url: body.url },
  });
  return NextResponse.json({ success: true, data: { platform: platform.platform, handle: platform.handle, url: platform.url }, error: null });
}
```

- [ ] **Step 4: Create `app/api/users/[username]/platforms/[platform]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ username: string; platform: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { platform } = await params;
  await prisma.connectedPlatform.delete({
    where: { userId_platform: { userId: session.user.id, platform: platform.toUpperCase() as never } },
  });
  return NextResponse.json({ success: true, data: null, error: null });
}
```

- [ ] **Step 5: Create `app/api/users/[username]/communities/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const { communities } = await req.json();
  const user = await prisma.user.update({ where: { id: session.user.id }, data: { communities } });
  return NextResponse.json({ success: true, data: { communities: user.communities }, error: null });
}
```

- [ ] **Step 6: Commit**

```bash
git add "app/api/users/"
git commit -m "feat: user profile/settings/platforms/communities API routes"
```

---

## Task 9: Follows API routes

**Files:**
- Create: `app/api/follows/[username]/route.ts`
- Create: `app/api/follows/following/route.ts`
- Create: `app/api/follows/[username]/count/route.ts`
- Create: `app/api/follows/[username]/status/route.ts`

- [ ] **Step 1: Create `app/api/follows/[username]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function resolveCreatorId(username: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  return user?.id ?? null;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  const { username } = await params;
  const creatorId = await resolveCreatorId(username);
  if (!creatorId) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Creator not found" } }, { status: 404 });
  await prisma.follow.upsert({
    where: { supporterId_creatorId: { supporterId: session.user.id, creatorId } },
    update: {},
    create: { supporterId: session.user.id, creatorId },
  });
  return NextResponse.json({ success: true, data: null, error: null });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  const { username } = await params;
  const creatorId = await resolveCreatorId(username);
  if (!creatorId) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Creator not found" } }, { status: 404 });
  await prisma.follow.deleteMany({ where: { supporterId: session.user.id, creatorId } });
  return NextResponse.json({ success: true, data: null, error: null });
}
```

- [ ] **Step 2: Create `app/api/follows/following/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  const follows = await prisma.follow.findMany({
    where: { supporterId: session.user.id },
    include: { creator: { select: { username: true, displayName: true, name: true, avatarUrl: true, image: true } } },
  });
  return NextResponse.json({
    success: true,
    data: follows.map((f) => ({
      creatorUsername: f.creator.username,
      creatorDisplayName: f.creator.displayName ?? f.creator.name ?? "",
      creatorInitials: (f.creator.displayName ?? f.creator.name ?? "U").slice(0, 2).toUpperCase(),
      creatorAvatarUrl: f.creator.avatarUrl ?? f.creator.image ?? null,
      totalContributed: 0,
      projectsSupported: 0,
      followedAt: f.createdAt.toISOString(),
    })),
    error: null,
  });
}
```

- [ ] **Step 3: Create `app/api/follows/[username]/count/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  const count = await prisma.follow.count({ where: { creatorId: user.id } });
  return NextResponse.json({ success: true, data: { count }, error: null });
}
```

- [ ] **Step 4: Create `app/api/follows/[username]/status/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { username } = await params;
  if (!session?.user) return NextResponse.json({ success: true, data: { following: false }, error: null });
  const creator = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!creator) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
  const follow = await prisma.follow.findUnique({
    where: { supporterId_creatorId: { supporterId: session.user.id, creatorId: creator.id } },
  });
  return NextResponse.json({ success: true, data: { following: follow !== null }, error: null });
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/api/follows/"
git commit -m "feat: follows API routes"
```

---

## Task 10: Better Auth browser client + AuthContext rewrite

**Files:**
- Create: `src/lib/auth-client.ts`
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create `src/lib/auth-client.ts`**

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL,
});
```

- [ ] **Step 2: Rewrite `src/contexts/AuthContext.tsx`**

The public interface (`login`, `signUp`, `signInWithProvider`, `logout`, `completeProfile`, `updateBalance`, `refreshUser`) stays identical. Supabase calls are replaced by Better Auth + fetch to `/api/users/me` and `/api/users/[username]`.

```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authClient } from "../lib/auth-client";
import type { User, UserRole, LoginResult, SignUpResult } from "../lib/types";
import type { UserProfileResponse } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<SignUpResult>;
  signInWithProvider: (provider: "google" | "twitch" | "twitter") => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (username: string, displayName: string, userType: UserRole, referralCode?: string, communities?: string[]) => Promise<{ ok: boolean; error?: string }>;
  updateBalance: (balance: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfileToUser(profile: UserProfileResponse): User {
  const isProvisional = !profile.username || profile.username.startsWith("user_");
  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    role: (profile.userType ?? "CREATOR").toLowerCase() as UserRole,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    creditBalance: profile.creditBalance,
    referralCode: profile.referralCode,
    stripeOnboardingComplete: profile.stripeOnboardingComplete,
    communities: profile.communities ?? [],
    isProfileComplete: !isProvisional,
    createdAt: profile.createdAt,
  };
}

async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch("/api/users/me", { credentials: "include" });
    if (!res.ok) return null;
    const body = await res.json();
    if (body.success && body.data) return mapProfileToUser(body.data);
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    fetchMe().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await authClient.signIn.email({ email, password });
    if (error) return { ok: false, error: error.message ?? "Login failed", field: "general" };
    if (!data) return { ok: false, error: "No session returned", field: "general" };
    const profile = await fetchMe();
    if (profile) {
      setUser(profile);
      return { ok: true, user: profile };
    }
    return { ok: false, error: "Failed to load profile", field: "general" };
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: UserRole = "creator"): Promise<SignUpResult> => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
      callbackURL: `${window.location.origin}/auth/callback`,
    });
    if (error) return { ok: false, error: error.message ?? "Sign-up failed", field: "general" };
    if (!data) return { ok: false, error: "Sign-up failed. Please try again.", field: "general" };

    // Set provisional user type for onboarding
    await fetch("/api/users/me", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userType: role.toUpperCase() }) }).catch(() => {});

    const profile = await fetchMe();
    if (profile) {
      setUser(profile);
      return { ok: true, user: profile, confirmEmail: false };
    }
    return {
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        username: "",
        displayName: "",
        role,
        bio: "",
        avatarUrl: null,
        creditBalance: 0,
        referralCode: null,
        stripeOnboardingComplete: false,
        communities: [],
        isProfileComplete: false,
        createdAt: data.user.createdAt,
      },
      confirmEmail: false,
    };
  }, []);

  const signInWithProvider = useCallback(async (provider: "google" | "twitch" | "twitter") => {
    await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/auth/callback`,
    });
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
  }, []);

  const completeProfile = useCallback(async (
    username: string,
    displayName: string,
    userType: UserRole,
    referralCode?: string,
    communities?: string[]
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/users/${username}/complete-profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: displayName || undefined,
          userType: userType.toUpperCase(),
          referralCode: referralCode || undefined,
          communities: communities?.length ? communities : undefined,
        }),
      });
      const body = await res.json();
      if (body.success && body.data) {
        setUser(mapProfileToUser(body.data));
        return { ok: true };
      }
      return { ok: false, error: body.error?.message ?? "Failed to complete profile" };
    } catch {
      return { ok: false, error: "Network error" };
    }
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setUser((prev) => (prev ? { ...prev, creditBalance: balance } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchMe();
    if (profile) setUser(profile);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, loading, login, signUp, signInWithProvider, logout, completeProfile, updateBalance, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Add `complete-profile` route**

The `completeProfile` call above calls `/api/users/[username]/complete-profile`. Create `app/api/users/[username]/complete-profile/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth.server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }
  const body = await req.json();
  const { username, displayName, userType, referralCode, communities } = body;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ success: false, error: { code: "CONFLICT", message: "Username already taken" } }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username,
      displayName,
      userType,
      referralCode: referralCode ?? null,
      communities: communities ?? [],
      isProfileComplete: true,
    },
    include: { connectedPlatforms: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? null,
      userType: user.userType,
      creditBalance: Number(user.creditBalance),
      stripeOnboardingComplete: user.stripeOnboardingComplete,
      referralCode: user.referralCode ?? null,
      communities: user.communities,
      isProfileComplete: user.isProfileComplete,
      settings: {
        emailNotifications: user.emailNotifications,
        giftNotifications: user.giftNotifications,
        milestoneNotifications: user.milestoneNotifications,
        marketingNotifications: user.marketingNotifications,
        profileVisible: user.profileVisible,
        showOnLeaderboard: user.showOnLeaderboard,
        showGiftAmounts: user.showGiftAmounts,
      },
      connectedPlatforms: user.connectedPlatforms.map((p) => ({ platform: p.platform, handle: p.handle ?? "", url: p.url ?? "" })),
      createdAt: user.createdAt.toISOString(),
    },
    error: null,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth-client.ts src/contexts/AuthContext.tsx "app/api/users/[username]/complete-profile/route.ts"
git commit -m "feat: Better Auth browser client + rewrite AuthContext"
```

---

## Task 11: Update `src/lib/api.ts` — swap auth/user/follow endpoints

**Files:**
- Modify: `src/lib/api.ts`

The `authApi` currently calls Java at `API_BASE`. We need:
- `getMe()` → `GET /api/users/me` (Next.js, no Bearer token needed — session cookie)
- `completeProfile()` → `POST /api/users/[username]/complete-profile` (Next.js)
- Follow endpoints → `/api/follows/*` (Next.js)

All other endpoints remain pointing at Java `API_BASE`.

- [ ] **Step 1: Replace `getAuthToken` and `apiFetch` in `src/lib/api.ts`**

Find and replace the top section (lines 1–10 and the `getAuthToken` + `apiFetch` functions) as follows.

Replace:
```ts
import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
```

With:
```ts
const API_BASE = (import.meta.env.VITE_API_URL ?? import.meta.env.NEXT_PUBLIC_API_URL) ?? "http://localhost:8080";
const NEXT_BASE = "";  // same-origin: relative URLs work in both Next.js and dev
```

- [ ] **Step 2: Replace `getAuthToken` with cookie-based fetch helper for Next.js routes**

Add after the constants above:

```ts
// Fetch to Next.js API routes — uses session cookie automatically
async function nextFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${NEXT_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { success: false, data: null, error: body?.error ?? { code: `HTTP_${res.status}`, message: res.statusText } };
  }
  return res.json();
}
```

Keep the existing `apiFetch` function but remove the `supabase` import and change `getAuthToken` to return `null` for now (the Java backend will accept the Better Auth JWT once Task 13 is done — until then, unauthenticated calls are fine for public Java endpoints):

```ts
async function getAuthToken(): Promise<string | null> {
  // Token forwarding to Java handled by middleware once Better Auth JWT is live
  return null;
}
```

- [ ] **Step 3: Replace `authApi.getMe` and `authApi.completeProfile` to use `nextFetch`**

Find the `authApi` object. Replace `getMe` and `completeProfile`:

```ts
export const authApi = {
  getMe: (tokenOverride?: string) =>
    tokenOverride
      ? apiFetch<UserProfileResponse>("/api/auth/me", {}, tokenOverride)
      : nextFetch<UserProfileResponse>("/api/users/me"),
  completeProfile: (data: CompleteProfileRequest) =>
    nextFetch<UserProfileResponse>(`/api/users/${data.username}/complete-profile`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
```

- [ ] **Step 4: Replace `followApi` to use `nextFetch`**

Find the `followApi` object. Replace it:

```ts
export const followApi = {
  follow: (username: string) =>
    nextFetch<null>(`/api/follows/${username}`, { method: "POST" }),
  unfollow: (username: string) =>
    nextFetch<null>(`/api/follows/${username}`, { method: "DELETE" }),
  getFollowing: () =>
    nextFetch<FollowedCreatorResponse[]>("/api/follows/following"),
  getFollowerCount: (username: string) =>
    nextFetch<{ count: number }>(`/api/follows/${username}/count`),
  getFollowStatus: (username: string) =>
    nextFetch<{ following: boolean }>(`/api/follows/${username}/status`),
};
```

- [ ] **Step 5: Remove `supabase` import from `src/lib/api.ts`**

Delete the line:
```ts
import { supabase } from "./supabase";
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: redirect auth/user/follow endpoints to Next.js routes"
```

---

## Task 12: Demo user seeder

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Install tsx for running the seeder**

```bash
npm install --save-dev tsx
```

- [ ] **Step 2: Add seed script to `package.json`**

In the `prisma` section (or add it if absent):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Create `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import { auth } from "../lib/auth.server";

const prisma = new PrismaClient();

async function main() {
  const password = "Rory2026!";

  const demoUsers = [
    { email: "creator@demo.rory.dev", username: "demo_creator", displayName: "Demo Creator", userType: "CREATOR" as const },
    { email: "supporter@demo.rory.dev", username: "demo_supporter", displayName: "Demo Supporter", userType: "SUPPORTER" as const },
    { email: "mod@demo.rory.dev", username: "demo_mod", displayName: "Demo Mod", userType: "MODERATOR" as const },
  ];

  for (const demo of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } });
    if (existing) {
      console.log(`Skipping existing: ${demo.email}`);
      continue;
    }

    // Use Better Auth to hash password correctly
    const result = await auth.api.signUpEmail({
      body: { email: demo.email, password, name: demo.displayName },
    });

    if (!result?.user) {
      console.error(`Failed to create user: ${demo.email}`);
      continue;
    }

    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        username: demo.username,
        displayName: demo.displayName,
        userType: demo.userType,
        isProfileComplete: true,
        emailVerified: true,
      },
    });

    console.log(`Created: ${demo.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 4: Run the seeder**

```bash
npx prisma db seed
```

Expected output:
```
Created: creator@demo.rory.dev
Created: supporter@demo.rory.dev
Created: mod@demo.rory.dev
```

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: demo user seeder — 3 accounts, password Rory2026!"
```

---

## Task 13: Remove Supabase

**Files:**
- Delete: `src/lib/supabase.ts`
- Delete: `src/lib/auth.ts` (if it still exists as Supabase client wrapper)

- [ ] **Step 1: Check for remaining Supabase imports**

```bash
grep -r "supabase" src/ --include="*.ts" --include="*.tsx" -l
```

Expected: no files. If any remain, fix them before proceeding.

- [ ] **Step 2: Delete `src/lib/supabase.ts`**

```bash
rm src/lib/supabase.ts
```

- [ ] **Step 3: Check if `src/lib/auth.ts` exists and delete if it's a Supabase wrapper**

```bash
cat src/lib/auth.ts 2>/dev/null && rm src/lib/auth.ts || echo "File not found — skip"
```

- [ ] **Step 4: Remove `@supabase/supabase-js` from `package.json`**

```bash
npm uninstall @supabase/supabase-js
```

- [ ] **Step 5: Run build check**

```bash
npx next build 2>&1 | tail -20
```

Expected: no TypeScript errors related to Supabase. Fix any import errors that surface.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Supabase — auth fully migrated to Better Auth"
```

---

## Task 14: Smoke test all auth flows

**Files:** None (validation task)

- [ ] **Step 1: Start the dev server**

```bash
npx next dev --port 3000
```

- [ ] **Step 2: Test email/password login**

Navigate to `http://localhost:3000/login`.
Enter: `creator@demo.rory.dev` / `Rory2026!`
Expected: redirected to `/dashboard`.

- [ ] **Step 3: Test logout**

Click the avatar/menu → Log out.
Expected: redirected to `/login` or `/`.

- [ ] **Step 4: Test sign up**

Navigate to `/signup`.
Register a new email (e.g., `test+$(date +%s)@example.com`) with password `Test1234!`.
Expected: redirected to `/onboarding` (new user, profile incomplete).

- [ ] **Step 5: Test supporter flow**

Login as `supporter@demo.rory.dev` / `Rory2026!`.
Expected: redirected to `/supporter` (CommunityHub).

- [ ] **Step 6: Test moderator login**

Login as `mod@demo.rory.dev` / `Rory2026!`.
Expected: redirected to `/dashboard` (userType MODERATOR → falls into creator path).

- [ ] **Step 7: Test Java backend still works**

While logged in, navigate to `/leaderboard`.
Expected: leaderboard data loads from Java at `localhost:8080` (or shows empty state if Java is down — not an error).

- [ ] **Step 8: Commit final state**

```bash
git add -A
git commit -m "chore: smoke test complete — user domain migrated to Better Auth + Next.js"
```

---

## Task 15 (optional): Java SecurityConfig.java JWKS URI update

> **Do this when the Java backend needs to validate Better Auth JWTs.** Until then, Java endpoints that require auth will reject requests. If Java is the backend for all non-user endpoints and some are public (projects, leaderboard), this may be fine to defer.

**Files:** `../rory-backend/src/main/resources/application.yml` (or equivalent Spring config)

- [ ] **Step 1: Find the JWKS URI config**

```bash
grep -r "jwk-set-uri" ../rory-backend/src/ -l
```

- [ ] **Step 2: Update JWKS URI**

Change:
```yaml
spring.security.oauth2.resourceserver.jwt.jwk-set-uri: ${SUPABASE_URL}/auth/v1/.well-known/jwks.json
```
To:
```yaml
spring.security.oauth2.resourceserver.jwt.jwk-set-uri: ${NEXT_PUBLIC_APP_URL}/api/auth/.well-known/jwks.json
```

Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in the Java `.env` / application properties for local dev.

- [ ] **Step 3: Restart Java backend and test an authenticated Java endpoint**

```bash
# In rory-backend
./mvnw spring-boot:run
```

Then make a request to a Java endpoint that requires auth (e.g., `GET /api/gifts/history`) while logged in via Better Auth.

Expected: 200 response (not 401).

- [ ] **Step 4: Commit the Java change**

```bash
cd ../rory-backend
git add src/main/resources/application.yml
git commit -m "fix: update JWKS URI to Better Auth Next.js endpoint"
```
