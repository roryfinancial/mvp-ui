// src/app/components/shared/gifty/useWebRig.ts
"use client";
import { useEffect, useState } from "react";
import { pickTier, type Tier } from "./pickTier";

const BASE = "/gifty/rig-web";

// WebP is supported in all current target browsers; cheap runtime check keeps a
// PNG fallback path open without a <picture> rewrite of every sprite.
function supportsWebp(): boolean {
  if (typeof document === "undefined") return true;
  const c = document.createElement("canvas");
  return c.toDataURL("image/webp").startsWith("data:image/webp");
}

export type WebRig = { data: any | null; atlasUrl: string | null };

export function useWebRig(): WebRig {
  const [tier, setTier] = useState<Tier | null>(null);
  const [data, setData] = useState<any | null>(null);

  // choose tiers once on mount (client only — dpr needs window)
  useEffect(() => {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const { initial, upgrade } = pickTier({ dpr });
    setTier(initial);
    if (upgrade) {
      // upgrade after first paint
      const id = window.setTimeout(() => setTier(upgrade), 0);
      return () => window.clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    if (!tier) return;
    let live = true;
    fetch(`${BASE}/rig-${tier}.json`)
      .then((r) => r.json())
      .then((j) => { if (live) setData(j); })
      .catch(() => {});
    return () => { live = false; };
  }, [tier]);

  const ext = supportsWebp() ? "webp" : "png";
  const atlasUrl = tier ? `${BASE}/rig-${tier}.${ext}` : null;
  return { data, atlasUrl };
}
