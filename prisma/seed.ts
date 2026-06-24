// Demo seed — populates a rich, self-consistent dataset for investor/backer
// demos. Runs against SQLite (DEMO_MODE) or Postgres alike (same schema).
//
//   npm run demo:setup   # select sqlite, push schema, seed
//   npm run demo         # start Next on the demo db
//
// Login users (password: Rory2026!):
//   creator@demo.rory.dev / supporter@demo.rory.dev / mod@demo.rory.dev
//
// Consistency: gifts are applied through applyGift(), which mirrors the
// /api/gifts flow (debit supporter, write GIFT_SENT + GIFT_RECEIVED ledger
// rows, raise the first ACTIVE project item) so wallet summaries, analytics,
// and leaderboards all reconcile with the seeded gifts.

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

const PASSWORD = "Rory2026!";

type SeedUser = {
  id: string;
  email?: string; // only login users have credential accounts
  username: string;
  displayName: string;
  userType: "CREATOR" | "SUPPORTER" | "MODERATOR";
  bio?: string;
  creditBalance?: number;
  communities?: string[];
  stripeOnboardingComplete?: boolean;
};

const CREATORS: SeedUser[] = [
  { id: "seed_demo_creator", email: "creator@demo.rory.dev", username: "demo_creator", displayName: "Demo Creator", userType: "CREATOR", bio: "Building cozy pixel-art games and sharing the journey.", communities: ["gamedev", "pixelart"], stripeOnboardingComplete: true },
  { id: "seed_nova", username: "nova_streams", displayName: "Nova", userType: "CREATOR", bio: "Variety streamer · speedruns & chill.", communities: ["streaming"], stripeOnboardingComplete: true },
  { id: "seed_mira", username: "mira_makes", displayName: "Mira Makes", userType: "CREATOR", bio: "Ceramics, zines, and slow craft.", communities: ["art", "craft"], stripeOnboardingComplete: true },
  { id: "seed_kai", username: "kai_codes", displayName: "Kai", userType: "CREATOR", bio: "Open-source tools for tiny teams.", communities: ["gamedev"], stripeOnboardingComplete: true },
];

const SUPPORTERS: SeedUser[] = [
  { id: "seed_demo_supporter", email: "supporter@demo.rory.dev", username: "demo_supporter", displayName: "Demo Supporter", userType: "SUPPORTER", bio: "Here for the good stuff.", creditBalance: 500, communities: ["gamedev"] },
  { id: "seed_lee", username: "lee_supports", displayName: "Lee", userType: "SUPPORTER", creditBalance: 320 },
  { id: "seed_ari", username: "ari_b", displayName: "Ari", userType: "SUPPORTER", creditBalance: 180 },
  { id: "seed_sam", username: "sam_t", displayName: "Sam", userType: "SUPPORTER", creditBalance: 90 },
];

const MOD: SeedUser = { id: "seed_demo_mod", email: "mod@demo.rory.dev", username: "demo_mod", displayName: "Demo Mod", userType: "MODERATOR" };

function communitiesJson(list?: string[]) {
  return JSON.stringify(list ?? []);
}

async function createUser(u: SeedUser, passwordHash: string) {
  await prisma.user.create({
    data: {
      id: u.id,
      email: u.email ?? `${u.username}@seed.rory.dev`,
      name: u.displayName,
      emailVerified: true,
      username: u.username,
      displayName: u.displayName,
      bio: u.bio ?? null,
      userType: u.userType,
      creditBalance: u.creditBalance ?? 0,
      communities: communitiesJson(u.communities),
      isProfileComplete: true,
      referralCode: `RORY-${u.username.toUpperCase().slice(0, 8)}`,
      stripeOnboardingComplete: u.stripeOnboardingComplete ?? false,
      ...(u.email
        ? {
            accounts: {
              create: { id: `acc_${u.username}`, accountId: u.email, providerId: "credential", password: passwordHash },
            },
          }
        : {}),
    },
  });
}

let giftSeq = 0;

/** Mirrors the /api/gifts credit flow so all aggregates reconcile. */
async function applyGift(opts: {
  supporterId: string;
  supporterUsername: string;
  creatorId: string;
  creatorUsername: string;
  projectId: string;
  amount: number;
  message?: string;
  daysAgo: number;
}) {
  const createdAt = new Date(Date.now() - opts.daysAgo * 86400_000);

  const gift = await prisma.gift.create({
    data: {
      supporterId: opts.supporterId,
      creatorId: opts.creatorId,
      projectId: opts.projectId,
      amount: opts.amount,
      message: opts.message ?? null,
      status: "COMPLETED",
      createdAt,
    },
  });

  // Debit supporter
  const supporter = await prisma.user.update({
    where: { id: opts.supporterId },
    data: { creditBalance: { decrement: opts.amount } },
  });
  await prisma.creditTransaction.create({
    data: {
      userId: opts.supporterId,
      type: "GIFT_SENT",
      amount: opts.amount,
      balanceAfter: supporter.creditBalance,
      referenceId: gift.id,
      description: `Gift to ${opts.creatorUsername}`,
      createdAt,
    },
  });

  // Creator received ledger (cumulative-received convention)
  const prior = await prisma.creditTransaction.aggregate({
    where: { userId: opts.creatorId, type: "GIFT_RECEIVED" },
    _sum: { amount: true },
  });
  await prisma.creditTransaction.create({
    data: {
      userId: opts.creatorId,
      type: "GIFT_RECEIVED",
      amount: opts.amount,
      balanceAfter: (prior._sum.amount ?? 0) + opts.amount,
      referenceId: gift.id,
      description: `Gift from ${opts.supporterUsername}`,
      createdAt,
    },
  });

  // Raise the first ACTIVE item on the project
  const item = await prisma.projectItem.findFirst({
    where: { projectId: opts.projectId, status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });
  if (item) {
    const raised = item.raisedAmount + opts.amount;
    await prisma.projectItem.update({
      where: { id: item.id },
      data: { raisedAmount: raised, status: raised >= item.goalAmount ? "GIFTED" : "ACTIVE", giftedById: raised >= item.goalAmount ? opts.supporterId : null },
    });
  }

  giftSeq++;
}

async function main() {
  // Clean slate (children first where no cascade covers them)
  await prisma.creditTransaction.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.projectItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.dailyQuest.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.userGamification.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.event.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.connectedPlatform.deleteMany();
  for (const u of [...CREATORS, ...SUPPORTERS, MOD]) {
    await prisma.user.deleteMany({ where: { id: u.id } });
  }

  const passwordHash = await hashPassword(PASSWORD);
  for (const u of [...CREATORS, ...SUPPORTERS, MOD]) await createUser(u, passwordHash);
  console.log(`Users: ${CREATORS.length} creators, ${SUPPORTERS.length} supporters, 1 mod`);

  // Connected platforms for demo creator + others
  await prisma.connectedPlatform.createMany({
    data: [
      { userId: "seed_demo_creator", platform: "YOUTUBE", handle: "@democreator", url: "https://youtube.com/@democreator" },
      { userId: "seed_demo_creator", platform: "TWITCH", handle: "democreator", url: "https://twitch.tv/democreator" },
      { userId: "seed_nova", platform: "TWITCH", handle: "nova", url: "https://twitch.tv/nova" },
      { userId: "seed_mira", platform: "INSTAGRAM", handle: "mira.makes", url: "https://instagram.com/mira.makes" },
      { userId: "seed_kai", platform: "TWITTER", handle: "kaicodes", url: "https://x.com/kaicodes" },
    ],
  });

  // Projects + items per creator
  type ItemSpec = { title: string; description: string; goal: number; sort: number };
  const projectPlan: { creatorId: string; creatorUsername: string; id: string; name: string; description: string; items: ItemSpec[] }[] = [
    {
      creatorId: "seed_demo_creator", creatorUsername: "demo_creator", id: "proj_pixel", name: "Pixel Quest — Chapter 2",
      description: "Funding the next chapter of my pixel-art adventure game.",
      items: [
        { title: "Upgrade to a drawing tablet", description: "A pro tablet to speed up animation work.", goal: 400, sort: 0 },
        { title: "Original soundtrack", description: "Commission a chiptune composer for 6 tracks.", goal: 600, sort: 1 },
        { title: "Steam release fee", description: "Cover the Steamworks publishing cost.", goal: 100, sort: 2 },
      ],
    },
    {
      creatorId: "seed_nova", creatorUsername: "nova_streams", id: "proj_nova", name: "Stream Studio Glow-up",
      description: "Better lighting and audio for higher-quality streams.",
      items: [
        { title: "Key light kit", description: "Two softbox lights for a clean look.", goal: 250, sort: 0 },
        { title: "Microphone", description: "A broadcast-quality mic.", goal: 200, sort: 1 },
      ],
    },
    {
      creatorId: "seed_mira", creatorUsername: "mira_makes", id: "proj_mira", name: "Community Kiln Fund",
      description: "A shared kiln so the local ceramics group can fire work.",
      items: [
        { title: "Electric kiln", description: "Mid-size kiln for the studio.", goal: 1200, sort: 0 },
        { title: "Glaze restock", description: "A season of glazes and tools.", goal: 300, sort: 1 },
      ],
    },
    {
      creatorId: "seed_kai", creatorUsername: "kai_codes", id: "proj_kai", name: "Open Tooling Sprint",
      description: "A month of full-time work on free dev tools.",
      items: [{ title: "One month of runway", description: "Rent + groceries to focus full-time.", goal: 2000, sort: 0 }],
    },
  ];

  for (const p of projectPlan) {
    await prisma.project.create({
      data: {
        id: p.id, creatorId: p.creatorId, name: p.name, description: p.description, isPublic: true, sortOrder: 0,
        items: { create: p.items.map((it) => ({ title: it.title, description: it.description, goalAmount: it.goal, sortOrder: it.sort })) },
      },
    });
  }
  console.log(`Projects: ${projectPlan.length}`);

  // Follows
  await prisma.follow.createMany({
    data: [
      { supporterId: "seed_demo_supporter", creatorId: "seed_demo_creator" },
      { supporterId: "seed_demo_supporter", creatorId: "seed_nova" },
      { supporterId: "seed_lee", creatorId: "seed_demo_creator" },
      { supporterId: "seed_ari", creatorId: "seed_demo_creator" },
      { supporterId: "seed_sam", creatorId: "seed_mira" },
      { supporterId: "seed_lee", creatorId: "seed_kai" },
    ],
  });

  // Gifts (drive raisedAmount + ledgers + analytics). Top up supporter balances
  // generously first so debits never go negative during seeding.
  await prisma.user.updateMany({ where: { userType: "SUPPORTER" }, data: { creditBalance: 1000 } });

  const gifts: { from: SeedUser; to: { id: string; username: string }; project: string; amount: number; message?: string; daysAgo: number }[] = [
    { from: SUPPORTERS[0], to: { id: "seed_demo_creator", username: "demo_creator" }, project: "proj_pixel", amount: 50, message: "Love the art style!", daysAgo: 1 },
    { from: SUPPORTERS[1], to: { id: "seed_demo_creator", username: "demo_creator" }, project: "proj_pixel", amount: 120, message: "Can't wait for chapter 2.", daysAgo: 2 },
    { from: SUPPORTERS[2], to: { id: "seed_demo_creator", username: "demo_creator" }, project: "proj_pixel", amount: 35, daysAgo: 4 },
    { from: SUPPORTERS[3], to: { id: "seed_demo_creator", username: "demo_creator" }, project: "proj_pixel", amount: 200, message: "For the soundtrack 🎵", daysAgo: 6 },
    { from: SUPPORTERS[0], to: { id: "seed_nova", username: "nova_streams" }, project: "proj_nova", amount: 80, message: "Better mic please!", daysAgo: 3 },
    { from: SUPPORTERS[1], to: { id: "seed_nova", username: "nova_streams" }, project: "proj_nova", amount: 45, daysAgo: 5 },
    { from: SUPPORTERS[2], to: { id: "seed_mira", username: "mira_makes" }, project: "proj_mira", amount: 150, message: "Kiln dreams!", daysAgo: 7 },
    { from: SUPPORTERS[0], to: { id: "seed_kai", username: "kai_codes" }, project: "proj_kai", amount: 100, message: "Thanks for the tools.", daysAgo: 2 },
    { from: SUPPORTERS[1], to: { id: "seed_demo_creator", username: "demo_creator" }, project: "proj_pixel", amount: 25, daysAgo: 9 },
    { from: SUPPORTERS[3], to: { id: "seed_nova", username: "nova_streams" }, project: "proj_nova", amount: 60, daysAgo: 11 },
  ];

  for (const g of gifts) {
    await applyGift({
      supporterId: g.from.id, supporterUsername: g.from.username,
      creatorId: g.to.id, creatorUsername: g.to.username,
      projectId: g.project, amount: g.amount, message: g.message, daysAgo: g.daysAgo,
    });
  }
  // Restore the demo supporter to a clean spendable balance for the live demo.
  await prisma.user.update({ where: { id: "seed_demo_supporter" }, data: { creditBalance: 500 } });
  console.log(`Gifts: ${giftSeq}`);

  // Deposits ledger for the demo supporter
  const dep = await prisma.deposit.create({
    data: { userId: "seed_demo_supporter", amount: 500, status: "COMPLETED", stripeCheckoutSessionId: "cs_demo_seed", stripePaymentIntentId: "demo", completedAt: new Date(Date.now() - 12 * 86400_000), createdAt: new Date(Date.now() - 12 * 86400_000) },
  });
  await prisma.creditTransaction.create({
    data: { userId: "seed_demo_supporter", type: "DEPOSIT", amount: 500, balanceAfter: 500, referenceId: dep.id, stripePaymentIntentId: "demo", description: "Credit deposit", createdAt: new Date(Date.now() - 12 * 86400_000) },
  });

  // Posts (feed content)
  const posts: { authorId: string; platform: string; contentType: string; caption: string; views: number; likes: number; linked?: string; daysAgo: number }[] = [
    { authorId: "seed_demo_creator", platform: "YOUTUBE", contentType: "VIDEO", caption: "Devlog #14 — animating the boss fight", views: 12400, likes: 870, linked: "proj_pixel", daysAgo: 1 },
    { authorId: "seed_demo_creator", platform: "TWITCH", contentType: "STREAM", caption: "Live: pixel-pushing the new tileset", views: 3200, likes: 210, daysAgo: 2 },
    { authorId: "seed_nova", platform: "TWITCH", contentType: "STREAM", caption: "Any% practice runs tonight", views: 5400, likes: 430, linked: "proj_nova", daysAgo: 1 },
    { authorId: "seed_mira", platform: "INSTAGRAM", contentType: "IMAGE", caption: "Fresh batch out of the kiln 🌿", views: 8900, likes: 1500, linked: "proj_mira", daysAgo: 3 },
    { authorId: "seed_kai", platform: "TWITTER", contentType: "TEXT", caption: "Shipped v0.3 of the CLI — changelog in thread", views: 2100, likes: 320, linked: "proj_kai", daysAgo: 2 },
  ];
  let postIdx = 0;
  for (const p of posts) {
    await prisma.post.create({
      data: {
        authorId: p.authorId, platform: p.platform, platformPostId: `seed_post_${postIdx++}`,
        platformUrl: "https://example.com/post", caption: p.caption, contentType: p.contentType,
        platformViews: p.views, platformLikes: p.likes, platformComments: Math.floor(p.likes / 12),
        likeCount: Math.floor(p.likes / 10), linkedProjectId: p.linked ?? null,
        platformCreatedAt: new Date(Date.now() - p.daysAgo * 86400_000), createdAt: new Date(Date.now() - p.daysAgo * 86400_000),
      },
    });
  }
  console.log(`Posts: ${posts.length}`);

  // Gamification for the demo supporter (active, mid-tier)
  await prisma.userGamification.create({
    data: { userId: "seed_demo_supporter", xp: 1240, level: 6, streakDays: 4, lastActivityDate: new Date().toISOString().slice(0, 10), leagueTier: "silver", weeklyGifted: 170 },
  });
  await prisma.userBadge.createMany({
    data: [
      { userId: "seed_demo_supporter", badgeId: "first_gift" },
      { userId: "seed_demo_supporter", badgeId: "streak_3" },
      { userId: "seed_demo_supporter", badgeId: "generous" },
    ],
  });

  // Referral (demo creator referred Kai)
  await prisma.referral.create({
    data: { referrerId: "seed_demo_creator", referredId: "seed_kai", status: "ACTIVE", commissionRate: 5.0, totalTipsGenerated: 100, totalCommissionEarned: 5 },
  });

  // Events
  await prisma.event.createMany({
    data: [
      { creatorId: "seed_demo_creator", title: "Pixel Quest — Community Playtest", description: "Help test the new chapter live on stream.", eventDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10), eventTime: "19:00", location: "Twitch", isPublic: true },
      { creatorId: "seed_nova", title: "24h Charity Speedrun Marathon", description: "All tips matched.", eventDate: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10), eventTime: "12:00", location: "Online", isPublic: true },
    ],
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
