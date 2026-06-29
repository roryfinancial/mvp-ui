"use client";
import { useEffect, useState } from "react";
import type { Manifest, Frame } from "./spritePackTypes";

const BASE = "/gifty/packs/256";

export type HeroState = { url: string; frame: Frame };
export type SheetImg = { url: string; w: number; h: number };
export type LoadedPack = { manifest: Manifest; sheets: Record<string, SheetImg> };

function loadImg(url: string): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => rej(new Error(`load ${url}`));
    img.src = url;
  });
}

export function useSpritePack(): { hero: HeroState | null; pack: LoadedPack | null } {
  const [hero, setHero] = useState<HeroState | null>(null);
  const [pack, setPack] = useState<LoadedPack | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const manifest: Manifest = await fetch(`${BASE}/manifest.json`).then((r) => r.json());
      if (manifest.version !== 2) throw new Error(`unsupported pack version ${manifest.version}`);
      // hero first
      await loadImg(`${BASE}/hero.webp`);
      if (!alive) return;
      setHero({ url: `${BASE}/hero.webp`, frame: manifest.hero });
      // then channel sheets (face split into facebase/eyes/mouth sub-channels)
      const names = ["facebase", "eyes", "mouth", "arms", "body"] as const;
      const dims = await Promise.all(names.map((n) => loadImg(`${BASE}/${n}.webp`)));
      if (!alive) return;
      const sheets: Record<string, SheetImg> = {};
      names.forEach((n, i) => { sheets[n] = { url: `${BASE}/${n}.webp`, w: dims[i].w, h: dims[i].h }; });
      setPack({ manifest, sheets });
    })().catch(() => { /* keep hero; graceful degradation */ });
    return () => { alive = false; };
  }, []);

  return { hero, pack };
}
