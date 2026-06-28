// src/app/components/shared/gifty/pickTier.ts
// Choose the initial render tier and an optional higher-res upgrade.
// The single seam where real frontend network/client config plugs in later.

export type Tier = 128 | 256 | 512 | 1024;

export function pickTier({ dpr }: { dpr: number }): { initial: Tier; upgrade: Tier | null } {
  return { initial: 512, upgrade: dpr > 1 ? 1024 : null };
}
