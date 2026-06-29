import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { prisma } from "./prisma";

// BETTER_AUTH_URL lets local dev / demo override the production app URL without
// touching .env. localhost origins are trusted only outside production (or in
// demo mode) so the auth flow works on any dev port.
// On Vercel PREVIEW deploys, pin the auth baseURL to the STABLE per-branch URL
// (VERCEL_BRANCH_URL, e.g. mvp-ui-git-preview-<scope>.vercel.app) instead of the
// random per-deploy hash. That gives ONE fixed callback URL to register with the
// OAuth providers once, so social login works on every preview-branch deploy.
const PREVIEW_URL =
  process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : undefined;
const APP_URL = PREVIEW_URL ?? process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
const trustedOrigins = [APP_URL].filter((o): o is string => !!o);
if (process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true") {
  trustedOrigins.push("http://localhost:3000", "http://localhost:3300");
}
// Vercel preview deploys get dynamic *.vercel.app URLs that aren't APP_URL, so
// auth would reject them as invalid origins. Trust the Vercel wildcard domains —
// but ONLY on preview deploys (VERCEL_ENV=preview), never in production, so the
// live site stays locked to its real origin. better-auth supports `*` wildcards.
if (process.env.VERCEL_ENV === "preview") {
  trustedOrigins.push(
    "https://*.vercel.app",
    "https://*.vercel.dev",
  );
  // each preview also has a stable per-deploy URL Vercel exposes via VERCEL_URL
  if (process.env.VERCEL_URL) trustedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: (process.env.DATABASE_PROVIDER as "postgresql" | "sqlite") ?? "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: APP_URL,
  trustedOrigins,
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
      communities: { type: "string", required: false },
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
  plugins: [jwt()],
});
