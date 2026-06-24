import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { jwt } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: (process.env.DATABASE_PROVIDER as "postgresql" | "sqlite") ?? "postgresql",
  }),
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
