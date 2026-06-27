# Rory — Full Product & Engineering Spec

> A reference spec complete enough to recreate the project from scratch via an AI
> coding prompt. Covers product concept, design language, architecture, every
> screen, the data model, the full API surface, the gift/credit engine, the
> gamification system, performance/infra decisions, and the roadmap.
>
> A condensed "recreation prompt" is at the very bottom (§20).

---

## 1. What Rory Is

**Rory is a creator funding + tipping platform.** Creators publish **projects**
made of **gift items** (wishlist-style goals — gear, software, anything with a
dollar target). Fans ("supporters") **gift** credits toward those items. The
hook vs. crowdfunding incumbents: **creators keep 100%** (low/zero platform fee
framing), and gifting is **gamified** — supporters earn XP, streaks, badges, and
climb public leaderboards, which turns funding into a competitive social loop.

Two roles, chosen at signup:
- **Creator** — runs a dashboard, builds projects/items, posts content from
  connected platforms, hosts events, sees earnings + analytics + referrals.
- **Supporter** — discovers creators via a TikTok-ish community feed, gifts
  toward items, and competes on leaderboards with quests/XP/leagues.

It is currently an **MVP / investor-demo build**: real money is **stubbed** (a
virtual credit ledger stands in for Stripe), and it ships with a **demo mode**
(local SQLite + seeded data) for showing to backers without a live database.

---

## 2. Meta Concepts / Design Philosophy

- **Sharp brutalism.** `--radius: 0` everywhere — square corners on every card,
  button, input (avatars are the only circles). Flat, high-contrast, grid-based.
- **One accent.** A single hot pink — `oklch(65.6% 0.241 354.308)` — over a
  black/white/gray base. Used for CTAs, active states, progress fills, rank #1.
- **Loud typography.** `font-black` (900) + `uppercase` + `tracking-widest` for
  headings, labels, and CTAs. Tight tracking on big display headlines.
- **Game feel.** Subtle depth shadows (`--shadow-card`, `--shadow-cta` glow),
  procedural Web-Audio sound effects, confetti on funding, XP/level/streak UI.
- **Motion as polish.** `motion` (Framer Motion) fade/slide/stagger presets;
  scroll-triggered `whileInView` reveals on the landing page.
- **Dark mode native.** Everything is CSS-variable driven; `.dark` on `<html>`
  via `next-themes`.
- **Demo-first.** Every feature must work with no real Stripe and a wipe-and-seed
  database, so it can be shown to investors offline.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router) |
| UI runtime | **React 19** SPA via **react-router-dom v7**, mounted inside a Next catch-all route |
| Language | TypeScript (strict) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`), CSS-variable theme |
| Components | **shadcn/ui** (Radix primitives) — 45+ in `components/ui/` |
| Animation | **motion** (`motion/react`) |
| Auth | **Better Auth** (Prisma adapter, email+password, OAuth, JWT plugin) |
| ORM | **Prisma 6** |
| DB (prod) | **Neon Postgres** via the **Neon serverless driver adapter** |
| DB (demo) | **SQLite** (local file), same schema subset |
| Payments | **Stripe — stubbed** (virtual credit ledger; no real charges) |
| Hosting | **Vercel** |
| Icons | `lucide-react` |
| Charts | `recharts` |

**Key architectural quirk:** the app is a client-rendered React-Router SPA, but
it lives inside Next so it can use Next **API route handlers** for the backend
and **Better Auth** for sessions. The whole SPA mounts at one Next catch-all
route (`app/(app)/[[...slug]]/`), and all data flows through `app/api/**`.

---

## 4. Architecture

### 4.1 App shell (how the SPA lives in Next)
- `app/layout.tsx` — root HTML, global CSS, theme class.
- `app/(app)/[[...slug]]/page.tsx` — Next catch-all page (server) that renders…
- `app/(app)/[[...slug]]/client.tsx` — `"use client"` wrapper with the provider
  stack: `HelmetProvider` → `ThemeProvider` (next-themes) → `BrowserRouter` →
  `AuthProvider`, rendering `<App/>` from `src/app/App.tsx`.
- `src/app/App.tsx` — the **react-router route table** (the real app).

### 4.2 Data layer
- `lib/prisma.ts` — singleton Prisma client. On **Postgres** it uses the **Neon
  serverless adapter**: `poolQueryViaFetch=true` routes simple queries over HTTP
  (no per-invocation TCP handshake — fast serverless cold starts) while
  transactions use a WebSocket pool. Falls back to the default engine if the
  adapter can't load. On **SQLite** (demo) it uses the stock client.
- `prisma/schema.prisma` — single schema written in the **SQLite∩Postgres
  subset** (see §17). A `provider` line is swapped by `scripts/select-db.mjs`.
- `lib/api-helpers.ts` — response envelope `{success, data, error}` (`ok`,
  `fail`, `notFound/unauthorized/forbidden/badRequest`), `getSessionUser`,
  pagination (`paged`, `pageParams`), and display helpers (`getInitials`,
  `formatTimeAgo`, `progressPct`, community JSON parse/stringify).
- `lib/project-mapper.ts` — maps Prisma rows → API DTOs; sorts items
  **pinned-first** then by `sortOrder`; batch-resolves gifter usernames.
- `lib/gamification.ts` — the XP/quest/streak/league engine + write hooks.

### 4.3 Client data access
- `src/lib/api.ts` — typed fetch client. `apiFetch` (envelope-aware,
  `credentials: "include"`) for app data; domain modules: `projectApi`,
  `giftApi`, `walletApi`, `feedApi`, `eventApi`, `userApi`, `followApi`,
  `gamificationApi`, `leaderboardApi`, `referralApi`, `founderSuggestionsApi`.
- `src/contexts/AuthContext.tsx` — session + user state (see §8).
- `src/lib/auth-client.ts` — Better Auth browser client.

### 4.4 Auth
- `lib/auth.server.ts` — Better Auth server config (Prisma adapter, email+pwd,
  Google/Twitch/Twitter OAuth, `jwt()` plugin, ~20 `additionalFields` on user).
- `app/api/auth/[...all]/route.ts` — Better Auth's catch-all handler.

### 4.5 Payments (stubbed)
No real Stripe charges. Money is a **virtual credit ledger**:
- **Deposit** → atomically `creditBalance += amount` + `Deposit` row + ledger row
  (fake `cs_demo_*` session id).
- **Gift** → atomic transaction (see §10).
- **Stripe Connect** endpoints return mock "connected" status.
Stripe column names are kept on the models so a real integration can drop in.

### 4.6 Demo vs Prod
- **Prod:** Neon Postgres, `DATABASE_PROVIDER=postgresql`, Vercel.
- **Demo:** `npm run demo` → SQLite file `prisma/demo.db`, `DEMO_MODE=true`,
  seeded via `prisma/seed.ts` (4 creators, 4 supporters, 1 mod, projects, gifts,
  posts, gamification, referrals, events; login password `Rory2026!`).
- `scripts/select-db.mjs` swaps the schema `provider` line; `npm run demo:setup`
  flips to sqlite + pushes + seeds; `npm run prod:restore` flips back.

---

## 5. Annotated File Tree

```
mvp-ui/
├── app/                              # Next.js App Router (server + API)
│   ├── layout.tsx                    # root HTML + global CSS + theme
│   ├── (app)/[[...slug]]/
│   │   ├── page.tsx                  # Next catch-all → renders client.tsx
│   │   └── client.tsx                # provider stack → <App/> (the SPA)
│   └── api/                          # 59 route.ts files (the backend)
│       ├── auth/[...all]/            # Better Auth handler
│       ├── users/ … me, [username], settings, communities, platforms, complete-profile
│       ├── projects/ … [id], items, creator/[username]
│       ├── gifts/ … POST, creator/[username]/{recent,top}, item/[itemId]/recent, my/history
│       ├── wallet/ … deposit, summary, transactions
│       ├── feed/ … posts, following, trending, stories, creator/[username], [postId]/like, sync
│       ├── gamification/ … state, quests, weekly-leaderboard
│       ├── leaderboard/ … creators, supporters
│       ├── referrals/ … list, link, stats, track
│       ├── events/ … list, [id], creator/[username]
│       ├── follows/ … [username], status, count, following
│       ├── recommendations/ … list, dismiss/[username]
│       ├── search/                   # creators+supporters by name
│       ├── activity/creator/[username]   # synthesized activity feed
│       ├── analytics/                # creator analytics
│       ├── stripe/connect/ … onboard, status  (stubbed)
│       └── founder-suggestions/ … list/create, [id] (archive/delete)
├── src/
│   ├── app/
│   │   ├── App.tsx                   # react-router route table (~27 routes)
│   │   ├── pages/Home.tsx            # landing page
│   │   └── components/
│   │       ├── ui/                   # shadcn primitives (45+)
│   │       ├── CreatorDashboard.tsx  # creator home
│   │       ├── CreatorProfile.tsx    # public creator profile + tip modal
│   │       ├── SupporterProfile.tsx  # public supporter profile
│   │       ├── CommunityHub.tsx      # supporter home (feed+gamification)
│   │       ├── CommunityFeed.tsx     # for-you/following/trending feed
│   │       ├── ActivityFeed.tsx      # synthesized activity cards
│   │       ├── Dashboard.tsx         # generic welcome/discovery
│   │       ├── Settings.tsx          # 8-section settings
│   │       ├── Auth.tsx              # login/signup (2-step + OAuth + demo)
│   │       ├── OnboardingChoice.tsx  # role→username→communities→socials→explore
│   │       ├── ConnectPlatforms.tsx  # creator platform OAuth step
│   │       ├── GamificationSidebar.tsx, DailyQuests.tsx, XPBar.tsx, Leaderboard.tsx
│   │       ├── CreateProject.tsx, CreateProjectPage.tsx, CreateEventPage.tsx
│   │       ├── CreateWishlist.tsx, PublicWishlist.tsx, ProjectOverview.tsx
│   │       ├── AddPostDialog.tsx, Analytics.tsx, Referrals.tsx
│   │       ├── Navbar.tsx, CreatorCard.tsx, RecommendedCreators.tsx
│   │       ├── LiveTicker.tsx, Confetti.tsx, Toast.tsx, ThemeToggle.tsx
│   │       └── FounderSuggestions.tsx  # internal draggable feedback widget
│   ├── contexts/AuthContext.tsx
│   ├── lib/ … api.ts, auth-client.ts, motion.ts, sounds.ts, image-upload.ts, format.ts, types.ts, models.ts
│   └── styles/ … theme.css, tailwind.css, fonts.css, index.css
├── lib/                              # server libs
│   ├── prisma.ts                     # Neon adapter client
│   ├── auth.server.ts                # Better Auth config
│   ├── api-helpers.ts                # response envelope + utils
│   ├── project-mapper.ts             # row→DTO mappers
│   └── gamification.ts               # XP/quest/league engine
├── prisma/ … schema.prisma, seed.ts, demo.db (gitignored)
├── scripts/select-db.mjs             # swap sqlite/postgres provider
├── next.config.ts                    # serverExternalPackages, distDir override
├── vercel.json                       # framework: nextjs (pins builder)
└── docs/ … VERCEL_DEPLOY.md, BACKEND_MIGRATION.md, PROJECT_SPEC.md (this file)
```

---

## 6. Design System

### 6.1 Color tokens (`src/styles/theme.css`)
**Accent (brand pink):** `oklch(65.6% 0.241 354.308)` — used as `--accent`,
`--primary`, `--ring`, `--chart-1`. Frequently inlined as
`style={{ color: "oklch(65.6% 0.241 354.308)" }}`.

Light: `--background #fff`, `--foreground #111`, `--muted #f5f5f5`,
`--muted-foreground #6b6b6b`, `--subtle #999`, `--border #e0e0e0`,
`--secondary #ebebeb`, `--destructive #dc2626`, `--nav-bg #0e0e0e`.

Dark: `--background #0d0d0d`, `--foreground #f0f0f0`, `--card #161616`,
`--muted #1e1e1e`, `--subtle #686868`, `--border #2c2c2c`, `--sidebar #141414`.

**Radius:** `--radius: 0` (all sm/md/lg/xl → 0). Square corners everywhere.

**Shadows:** `--shadow-card`, `--shadow-card-hover`, `--shadow-cta` (pink glow
`0 4px 20px oklch(65.6% 0.241 354.308 / .35)`), `--glow-accent`. Dark mode uses
stronger black shadows.

**Charts:** pink / `#1d4ed8` / `#f59e0b` / `#059669` / `#7c3aed`.

**Custom utilities:** `.btn-cta` (pink + glow, hover-intensifies), `.card-game`
(depth shadow + hover lift), plus token classes `text-subtle`, `bg-muted`,
`text-accent`, `border-border`.

### 6.2 Typography
System font stack (no web font loaded). Base layer sets `h1` weight 800 / tight
tracking, down to `h4`/labels weight 500. UI leans hard on
`font-black uppercase tracking-widest` for labels and `text-7xl md:text-8xl
font-black tracking-tight` for display headlines. Tiny labels are
`text-[10px] font-black uppercase tracking-widest text-subtle`.

### 6.3 Motion presets (`src/lib/motion.ts`)
- `fadeUp` `{opacity:0,y:20}→{1,0}` 0.5s · `fadeUpFast` (+ exit `y:-8`) 0.3s
- `fadeIn`, `scaleIn` `{opacity:0,scale:.95,y:20}` 0.2s, `slideInLeft`
- `btnHover` `{whileHover:{scale:1.01}, whileTap:{scale:0.99}}`
- `staggerFadeUp(i, base=0, step=0.07)`, `staggerSlideLeft(i, base=0.3, step=0.05)`
- Landing uses `whileInView` + `viewport={{once:true}}` for scroll reveals.

### 6.4 Sound (`src/lib/sounds.ts`)
Procedural Web-Audio (zero bundle). Mute persisted in `localStorage["rory_sounds"]`
via `toggleMute()`/`isSoundMuted()`. Set: `click, softClick, hover, success,
error, pop, pageTransition, achievement, gift, xp, levelup, streak, quest, badge,
funded, promotion`. Used on buttons/tabs, gifting, XP/level/quest events,
project-funded. Lazy AudioContext with auto-resume.

### 6.5 Component library
`src/app/components/ui/` is **shadcn/ui** over Radix: accordion, alert(-dialog),
avatar, badge, button, calendar, card, carousel, chart, checkbox, command,
context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp,
label, menubar, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider,
sonner (toasts), switch, table, tabs, textarea, toggle(-group), tooltip + `cn()`
util and `use-mobile`.

---

## 7. Landing Page (`src/app/pages/Home.tsx`)

Single scrolling marketing page on a dark hero/section rhythm.

1. **Fixed nav** — `bg-[#0e0e0e]`, pink bottom-border. Logo `rory-word.svg`; links
   Features/Pricing/Creators/Leaderboard; **Log In** (outline) + **Sign Up**
   (`.btn-cta`).
2. **Hero** (dark) — **audience toggle** pill: `I'm a Creator | I'm a Supporter`
   (active = `.btn-cta`). Selecting one retargets the **badge**, **headline**,
   **subcopy**, and **CTA** via a `HERO_COPY` map:
   - creator → badge "For Creators · Keep 100%", headline "Your project, **funded.**",
     CTA "Start Your Project".
   - supporter → badge "For Supporters", headline "Fund the creators **you love.**",
     CTA "Find Creators to Support".
   Headline `text-7xl md:text-8xl font-black`, second word pink. Animated reveals.
3. **Stats strip** (`bg-foreground`) — `10,000+` Creators · `100%` Creators Keep ·
   `2 min` Setup Time (pink numbers, stagger-in on scroll).
4. **Feature §1 — Projects** (white) — left: "PROJECTS" badge + "Set goals, get
   funded." + 3 feature cards (slide-in stagger); right: product image.
5. **Feature §2 — Leaderboard** (muted) — left: a demo **Top Gifters** card with
   gold/silver/bronze ranks; right: "COMMUNITY" badge + "Your fans compete to gift
   you."
6. **Final CTA** (dark) — "Start your **project.**" + `.btn-cta` + trust bullets
   (low fees / 2-min setup / no card needed).
7. **Footer** — logo + Product/Resources/Company link columns + legal bar.

---

## 8. App Shell, Routing & Auth

### 8.1 Routes (`src/app/App.tsx`, react-router)
**Public (no navbar):** `/` Home · `/login` · `/signup` · `/auth`→login ·
`/auth/callback` · `/connect-platforms` · `/onboarding`.
**Public (navbar if logged in):** `/creator/:username` ·
`/creator/:username/project/:projectId` · `/supporter/:username` · `/leaderboard`.
**Authenticated (navbar, gated):** `/dashboard` (creator home) · `/supporter`
(community hub) · `/dashboard/new-project` · `/dashboard/new-item` ·
`/dashboard/new-event` · `/project/:id` · `/settings` · `/analytics` ·
`/referrals`.
**Guards:** `RequireAuth` → unauth to `/login`, incomplete profile to
`/onboarding`. `PublicLayout` shows navbar only when logged in.

### 8.2 Auth context (`src/contexts/AuthContext.tsx`)
Exposes `user|null`, `isAuthenticated`, `loading`, and `login`, `signUp`,
`signInWithProvider("google"|"twitch"|"twitter")`, `logout`, `completeProfile`,
`updateBalance` (optimistic), `refreshUser`. On mount → `GET /api/users/me`.
`User` shape includes `role: "creator"|"supporter"`, `creditBalance`,
`communities: string[]`, `isProfileComplete` (false while username is the
provisional `user_xxxxx`).

### 8.3 Better Auth (`lib/auth.server.ts`)
Prisma adapter; `emailAndPassword` + Google/Twitch/Twitter OAuth; `jwt()` plugin;
`additionalFields` mirror the User columns (username, displayName, bio, avatarUrl,
userType, creditBalance, stripe*, referralCode, communities, isProfileComplete,
notification/privacy flags). Browser client `src/lib/auth-client.ts` exposes
`signIn.email`, `signIn.social`, `signOut`.

### 8.4 Auth + onboarding flow
- **`Auth.tsx`** — two-column (brand panel + form). Steps: email → password
  (Sign Up / Log In); optional OTP code step (6 inputs, paste, resend countdown);
  **demo quick-login** blocks (creator + fan); social buttons (Google/Twitch/X).
- **`OnboardingChoice.tsx`** — 5 steps: (1) role creator/supporter; (2) **claim
  username** rendered as `rory.com/____` (youpay-style, live URL preview,
  sanitized to `[a-z0-9_]`, min 3) + display name + referral code → POST
  complete-profile; (3) communities (8-card multiselect) → PUT communities;
  (4) link socials (YouTube/Twitch OAuth, Twitter/Instagram/TikTok handle+URL);
  (5) explore (creator → create project, supporter → community hub).

---

## 9. Screens

### 9.1 Creator Dashboard (`CreatorDashboard.tsx`)
Two-column `lg:grid-cols-[320px_1fr]`; **mobile reorders main above sidebar** so
the gift CTA is first.
- **Sidebar:** profile (avatar, verified check, "Creator", social links); linked
  **Shopify** store card; **Overview** mini-stats (Total Raised pink, Active
  Items, Supporters); **Recent Supporters** (5); action buttons (Add Item · New
  Project · New Event · Sync Posts · Add Post).
- **Main:** **Earnings hero** — "Total Earned" (pink), "You keep 100% — Rory never
  takes a cut", **Create a New Gift** CTA, and a **Fan Spotlight** ("Your top
  gifter this week is X — $Y") from the `period=week` top-gifters query.
- **My Projects grid** (cover/placeholder, name, active/funded dots, goal +
  progress bar, item-count badge, hover-delete).
- **My Top Supporters** table (gold/silver/bronze top 3).
- **My Posts** grid (platform filter tabs, thumbnail+platform badge, stats,
  link-to-project dropdown, pagination).
- **My Events** grid (image, date/time/location icons, Past badge, delete).
- **Project → Item detail** (breadcrumb): item image/title/status + **Pin toggle**
  (one pinned item per project, floats to top of profile), goal box, recent
  supporters, Active/Completed/All tabs. Confetti+sound when an item funds.

### 9.2 Creator Profile (`CreatorProfile.tsx`, public)
Tall hero (image/gradient + overlay: display name, verified, global rank, bio,
follow button); connected-platform row; conditional banner ("This is your public
profile → Edit in Settings" for owner; sign-in CTA for guests); **Upcoming
Events**; **Posts/Activity** tabs; **Projects** sections, each a horizontal
**gift-item carousel** with **Pinned** badge and a **Send a Gift** card (auth-
gated). **Tip modal:** project select → amount presets `$5/$10/$25/$50/$100` +
custom → confirm → success screen.

### 9.3 Supporter experience
- **CommunityHub (`/supporter`)** — supporter home: feed + gamification sidebar.
- **CommunityFeed.tsx** — sticky tabs **For You / Following / Trending**; post
  cards (creator header, media, platform/content badges, caption, view/like/
  comment stats, linked-project % badge, like/comment/share/external actions);
  Load More.
- **SupporterProfile.tsx** — hero + stats (Total Gifted / Following / Best Rank);
  Following carousel; contribution history timeline with rank badges.
- **Dashboard.tsx** — generic welcome/discovery (creator-vs-supporter CTAs, top
  funded creators/projects, quick stats).

### 9.4 Settings (`Settings.tsx`)
Sidebar + panel, 8 sections: **Profile** (display name, bio, photo upload);
**Account** (email, change password, delete account); **Connected Platforms**
(OAuth + manual handles); **Credit & Spending** (balance, **Deposit** inline form,
transactions, Stripe Connect status for creators); **Communities** (card
multiselect); **Customization** (theme Light/Dark/System + **interface sound
toggle**); **Notifications** (toggles); **Privacy & Security** (profile/leaderboard
visibility).

### 9.5 Creation forms
- **CreateProject.tsx** (add item) — project picker, **image upload** (dashed
  dropzone, compressed to base64 via `src/lib/image-upload.ts`), title,
  description, goal amount (min $0.01). Image is persisted as a compressed JPEG
  data URL.
- **CreateEventPage.tsx** — title/description/date/time/location, **image upload**
  (same control), public toggle, live preview.
- **AddPostDialog.tsx** — paste URL → preview (platform/content inferred) →
  optional project link → add.

### 9.6 Navbar (`Navbar.tsx`)
Fixed, dark. Role-aware links (creator: Dashboard/Analytics/Referrals/Leaderboard/
Settings; supporter: Community/Leaderboard/Settings). Right side: XPBar
(supporter), **credit balance** button, **live search** dropdown (creators +
supporters), theme toggle, logout.

---

## 10. Wallet & Gift Engine (the credit ledger)

Money is virtual credit. **`creditBalance`** lives on `User`. Every movement
writes a `CreditTransaction` (`DEPOSIT | GIFT_SENT | GIFT_RECEIVED | REFUND`) with
a running `balanceAfter`.

**Deposit** (`POST /api/wallet/deposit`) — one transaction: create `Deposit`
(COMPLETED, `cs_demo_*`) + `creditBalance:{increment}` + `CreditTransaction`.

**Gift** (`POST /api/gifts`) — the core flow, designed for a **slow shared
Postgres host**:
1. Pre-reads parallelized (`project` + `supporter`), then `creator`; fast-fail
   balance check; the creator's running-total **aggregate runs OUTSIDE** the
   transaction (don't hold a connection for a scan).
2. **Interactive transaction** (`maxWait 10s, timeout 20s`):
   - create `Gift` (COMPLETED, no Stripe ids),
   - `creditBalance:{decrement}` then re-check `< 0` inside the tx → throw
     `INSUFFICIENT` (atomic guard, no lost updates / no overdraft),
   - write supporter `GIFT_SENT` + creator `GIFT_RECEIVED` ledger rows,
   - find first **ACTIVE** item by `sortOrder`, **`raisedAmount:{increment}`**
     (atomic — concurrent gifts can't clobber), flip to `GIFTED` + set
     `giftedById` only when the returned total crosses the goal.
3. Post-commit, best-effort **`onGift`** gamification (a hiccup must not 500 a
   committed gift / cause a double-charge on retry).

Creator `creditBalance` is intentionally **not** incremented (matches the legacy
Java service); creator earnings are derived from gifts/ledger.

---

## 11. Gamification (`lib/gamification.ts`)

Per-user `UserGamification` row: `xp`, `level` (derived from xp via
`levelFromXp`), `streakDays`, `lastActivityDate`, `leagueTier`
(`bronze/silver/gold/diamond` from `weeklyGifted` thresholds 50/200/500),
`weeklyGifted`.
- **Daily quests** — `getOrCreateTodayQuests` generates a day's quests from a
  pool (easy/medium/hard, gift- and follow-type). Completing one awards XP.
- **Write hooks** — `onGift(userId, amount)`: completes one eligible quest,
  updates streak, **atomically increments `weeklyGifted`**, recomputes league.
  `onFollow`: completes a follow-quest + streak.
- **Weekly leaderboard** — bounded candidate scan + batched user load, filters
  `showOnLeaderboard`, marks `isCurrentUser`.
- **UI** — `GamificationSidebar` (level + XP bar, streak with 2× framing, league,
  weekly top-5, 12-badge grid), `DailyQuests`, `XPBar`, plus sounds
  (xp/levelup/streak/quest/badge/funded).

---

## 12. Other Domains

- **Posts / Feed** — `Post` rows mirror connected-platform content
  (platform, urls, caption, media, like/comment counts, optional
  `linkedProjectId`). `PostLike`/`PostComment` relations. Feeds: following,
  trending (by likes), stories (creator rail), per-creator. `sync` + `preview`
  are stubs for real platform ingestion.
- **Events** — creator-scheduled `Event` (date/time/location/image/public),
  shown on dashboard + public profile.
- **Referrals** — `Referral` (referrer→referred, status, `commissionRate`,
  totals). Tiers Starter 5% / Builder 7% / Pro 9% / Elite 12%. `link`, `stats`
  (this-month commission via one grouped query), `track`.
- **Follows** — `Follow` (supporter→creator); status/count/following.
- **Recommendations** — personalized creators (follow-graph + community overlap,
  JS membership matching), with dismiss.
- **Search** — creators/supporters by username/displayName (min 2 chars).
- **Activity** — synthesized reverse-chron feed merging posts + gifts received +
  projects created + items fully gifted.
- **Leaderboards** — top creators (by gifts received) / supporters (by gifted),
  with batched user resolution.
- **Analytics** — revenue/supporters/gifts over week/month/year with comparisons,
  top projects, recent activity.

---

## 13. Founder Suggestions (internal tool)

A **draggable, dismissible feedback widget** (`FounderSuggestions.tsx`,
`createPortal` to body, deep-link `?founder=open`) for cofounders. Sign as
**Logan / Kayden / Annabella**, write a comment, optionally **capture the current
screen** (`modern-screenshot` `domToCanvas`, excluding the widget, downscaled +
JPEG-compressed) and **mark it up** (red pen vector strokes + a resizable
translucent-yellow highlight box), composited and stored as base64. List tab has
an **Active / Archived** switch with per-item **archive/restore/delete**.
Endpoints: `GET/POST /api/founder-suggestions` (`?archived=true` filter, author
allowlist, `data:image` + 4MB screenshot guard), `PATCH/DELETE
/api/founder-suggestions/[id]`. Backed by the `FounderSuggestion` model
(`archived` flag). Intentionally low-rigor / temporary.

---

## 14. Data Model (Prisma — SQLite∩Postgres subset)

**Compatibility rules (so one schema runs on both DBs):** no native `enum`
(use `String` + TS unions), no scalar lists (`communities` is a JSON string),
no `@db.*` types, money is `Float`, date-only fields are `'YYYY-MM-DD'` strings,
cross-domain User refs are **plain String FK columns (no relation)**; only
within-domain links (Project↔ProjectItem, Post↔Like/Comment) use relations.

| Model | Purpose / key fields |
|---|---|
| **User** | id, email, username?, displayName?, bio?, avatarUrl?, userType (CREATOR/SUPPORTER/MODERATOR), **creditBalance**, stripe* , referralCode?, **communities** (JSON string), isProfileComplete, notif/privacy flags |
| **Account / Session / Verification / Jwks** | Better Auth tables |
| **ConnectedPlatform** | userId, platform (YOUTUBE/TWITCH/…/SHOPIFY), handle, url, tokens |
| **Follow** | supporterId → creatorId (unique pair) |
| **Project** | creatorId, name, description, coverImageUrl, isPublic, sortOrder → has many ProjectItem |
| **ProjectItem** | projectId, title, thumbnailUrl, **goalAmount**, **raisedAmount**, status (ACTIVE/COMPLETED/GIFTED), giftedById?, **pinned**, sortOrder |
| **Gift** | supporterId, creatorId, projectId, amount, message?, status, stripe* ids?, commissionAmount? |
| **Deposit** | userId, amount, status, stripeCheckoutSessionId? |
| **CreditTransaction** | userId, type (DEPOSIT/GIFT_SENT/GIFT_RECEIVED/REFUND), amount, **balanceAfter**, referenceId? |
| **Post** | authorId, platform, platformPostId, urls, caption, media, like/commentCount, linkedProjectId? |
| **PostLike / PostComment** | relations to Post |
| **UserGamification** | userId (unique), xp, level, streakDays, lastActivityDate, leagueTier, weeklyGifted |
| **DailyQuest** | userId, questDate, difficulty, label, xpReward, completed, locked |
| **UserBadge** | userId, badgeId, earnedAt |
| **Referral** | referrerId, referredId, status, commissionRate, totals |
| **Event** | creatorId, title, eventDate (string), eventTime?, location?, imageUrl?, isPublic |
| **FounderSuggestion** | author, comment, pageUrl, screenshot? (base64), **archived** |

---

## 15. Full API Surface (59 route files)

Envelope `{success, data, error}`; pagination `?page&size` → `{content, page,
size, totalElements, totalPages, first, last}`. **[P]** public · **[S]** session ·
**[O]** owner-checked.

**Auth/Users:** `auth/[...all]` GET/POST [P] · `users/me` GET [S] ·
`users/[u]` GET [P] / PUT [S][O] · `users/[u]/complete-profile` POST [S][O] ·
`users/[u]/settings` PUT [S][O] · `users/[u]/communities` PUT [S][O] ·
`users/[u]/platforms` GET [P] / POST [S][O] · `users/[u]/platforms/[platform]`
DELETE [S][O].
**Projects:** `projects` GET/POST [S] · `projects/[id]` GET [P] / PUT,DELETE
[S][O] · `projects/creator/[u]` GET [P] · `projects/[id]/items` GET [P]/POST [S] ·
`projects/[id]/items/[itemId]` GET [P] / PUT,DELETE [S][O] (PUT accepts `pinned`).
**Gifts/Wallet:** `gifts` POST [S] · `gifts/creator/[u]/recent` [P] ·
`gifts/creator/[u]/top` [P] (`?period=week`) · `gifts/item/[itemId]/recent` [P] ·
`gifts/my/history` [S] · `wallet/deposit` POST [S] · `wallet/summary` [S] ·
`wallet/transactions` [S].
**Feed:** `feed/posts` GET/POST · `feed/posts/preview` · `feed/posts/my`,
`my/unlinked` · `feed/posts/[postId]/link-project` POST · `feed/posts/project/
[projectId]` · `feed/[postId]/like` POST · `feed/posts/sync` POST · `feed/
following`, `feed/trending`, `feed/stories`, `feed/creator/[u]`.
**Gamification:** `gamification/state` [S] · `gamification/quests` [S] ·
`gamification/weekly-leaderboard`.
**Leaderboard:** `leaderboard/creators`, `leaderboard/supporters` [P].
**Referrals:** `referrals` [S] · `referrals/link` [S] · `referrals/stats` [S] ·
`referrals/track` POST.
**Events:** `events` GET/POST [S] · `events/[id]` GET[P]/PUT,DELETE[S][O] ·
`events/creator/[u]` [P].
**Follows:** `follows/[u]` POST/DELETE [S] · `follows/[u]/status` [S] ·
`follows/[u]/count` [P] · `follows/following` [S].
**Misc:** `recommendations` [S] + `recommendations/dismiss/[u]` POST ·
`search` [P] · `activity/creator/[u]` [P] · `analytics` [S] (`?period`) ·
`stripe/connect/onboard`, `stripe/connect/status` (stub) ·
`founder-suggestions` GET/POST + `[id]` PATCH/DELETE.

---

## 16. Performance & Infra Decisions

- **Neon serverless adapter** — `poolQueryViaFetch` for HTTP-fast reads, WebSocket
  pool for transactions, longer connect/idle timeouts + `onPoolError` so a flaky
  shared host doesn't crash the process; safe fallback to the default engine.
- **No N+1** — hot read paths batch related rows in a single
  `findMany({where:{id:{in:[…]}}})` + Map (gift history, recent/top gifters,
  project mapper, activity, leaderboards); referral stats use one `groupBy`.
- **Atomic writes** — `{increment}`/`{decrement}` instead of read-modify-write
  for balances, raisedAmount, weeklyGifted; tx scope kept minimal.
- **Build/deploy** — `postinstall: prisma generate`; `serverExternalPackages`
  lists `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`,
  `ws`; `vercel.json` pins `framework: nextjs`. Runtime env: `DATABASE_URL`
  (`?sslmode=require`), `DATABASE_PROVIDER=postgresql`, `BETTER_AUTH_SECRET`,
  `NEXT_PUBLIC_APP_URL` (+ optional OAuth creds). Build never hits the DB.
- **No CDN caching** of reads — kept live/real-time (a stale-while-revalidate
  experiment was reverted intentionally).

---

## 17. Demo vs Production

- `npm run dev` — Next dev (uses current `provider`).
- `npm run demo:setup` → flips schema to sqlite, `prisma db push`, seeds
  `prisma/demo.db`; `npm run demo` runs with `DEMO_MODE=true` + sqlite.
- `npm run prod:restore` → flips to postgresql + regenerates client.
- `prisma/seed.ts` — 4 creators, 4 supporters, 1 mod, 4 projects, 10 gifts (via a
  ledger-mirroring `applyGift`), 5 posts, gamification, a referral, events. Demo
  login password: `Rory2026!`.

---

## 18. Roadmap / "Wanted" Features

**Shipped from beta feedback:** creator/supporter landing toggle; "keep 100%"
emphasis; youpay-style `rory.com/____` username; image upload on gifts + events
(base64); dashboard earnings hero + "Create a New Gift" first (mobile-first);
**fan spotlight** ("top gifter this week"); **pin a gift item**; settings **sound
toggle**; gift-image persistence fix.

**Still wanted / not built:**
- **Real Stripe** — replace the credit-ledger stub with real charges,
  Connect onboarding, and **creator payouts/withdrawals** (not implemented).
- **Explore / Reels page** — full-screen vertical TikTok-style scroll through
  creator content (flagged "maybe post-MVP"); later, **live streaming**.
- **Richer content display options** — more layouts for how YouTube/Twitch clips
  and merch are showcased on the creator profile.
- **Real platform sync** — `feed/posts/sync` and `preview` are stubs; wire actual
  YouTube/Twitch/etc. ingestion + OAuth token use.
- **Notifications delivery** — flags exist; no email/push pipeline yet.
- **Email verification / OTP** — UI exists; verification not enforced.
- **Mobile-first store surfacing** — show a creator's linked Shopify store first
  on mobile.
- Pinned-item polish, "your top gifted this week is X" surfaced wider, sound
  effects per-event coverage.

---

## 19. Conventions / Gotchas (for a faithful rebuild)

- Every API response uses the `{success,data,error}` envelope — client unwraps via
  `apiFetch`.
- The SPA is **client-rendered**; build doesn't touch the DB. All dynamic data is
  fetched at runtime through `app/api/**`.
- Schema stays in the **SQLite∩Postgres subset** (no enums/arrays/`@db.*`); enums
  are TS string unions; `communities` and any list are JSON strings.
- Cross-domain User references are **plain String columns** (no Prisma relation) —
  resolve usernames via batched lookups in mappers.
- Money math uses atomic increments/decrements; never read-then-write a balance.
- `--radius:0` and `font-black uppercase tracking-widest` are the visual signature
  — keep them.
- Stripe column names persist on models even though charges are stubbed.

---

## 20. Condensed Recreation Prompt

> Build **Rory**, a creator funding/tipping web app. Stack: **Next.js 15 (App
> Router) + React 19 SPA via react-router-dom mounted in a single Next catch-all
> route**, **TypeScript**, **Tailwind v4** (CSS-variable theme, `--radius:0`,
> single pink accent `oklch(65.6% 0.241 354.308)`, `font-black uppercase
> tracking-widest` labels, dark mode), **shadcn/ui** components, **motion** for
> animation, **Better Auth** (Prisma adapter, email+password + Google/Twitch/
> Twitter OAuth, JWT), **Prisma 6** on **Neon Postgres** (serverless adapter, with
> a **SQLite demo mode**). Backend = **Next API route handlers** returning a
> `{success,data,error}` envelope.
>
> Domains: users/auth, creator **projects** containing **gift items** (goal/raised,
> pinnable), **gifts** that move a **virtual credit ledger** (Stripe stubbed — no
> real charges; deposits and gifts are atomic transactions with `{increment}`/
> `{decrement}` and an overdraft guard), **wallet**, **posts/feed** (for-you/
> following/trending), **gamification** (XP/level/streak/daily quests/league
> tiers/weekly leaderboard), **referrals**, **events**, **follows**,
> **recommendations**, **search**, **activity feed**, **analytics**, and public
> **leaderboards**.
>
> Two roles (creator/supporter) chosen in a 5-step onboarding (role → youpay-style
> `rory.com/username` claim → communities → social links → explore). Creator
> **dashboard** leads with an earnings hero + "Create a New Gift" CTA + "your top
> gifter this week" spotlight. Public **creator profile** has gift-item carousels
> (pinned-first) and a tip modal ($5/$10/$25/$50/$100 + custom). **Landing page**
> has a creator/supporter audience toggle that retargets the hero copy and pushes
> "creators keep 100%". Include a draggable internal **Founder Suggestions**
> feedback widget (sign as one of three names, annotated screenshot, archive).
> Keep a SQLite∩Postgres schema subset (string-union enums, JSON-string lists,
> plain-String cross-domain FKs, Float money, string dates). Ship a demo seed.
```
