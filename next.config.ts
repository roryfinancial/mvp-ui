import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  // Allow overriding the build dir (the default .next has some root-owned files
  // left over from an earlier docker/sudo run; NEXT_DIST_DIR lets us build clean).
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
