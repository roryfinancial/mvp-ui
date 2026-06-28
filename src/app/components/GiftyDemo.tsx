"use client";

import { useEffect, useState } from "react";
import { RigGifty, type BrowPos } from "./shared/gifty/RigGifty";

/**
 * /gifty-demo — primitive tester. Auto-populates its controls from the catalog
 * manifest (public/gifty/catalog/catalog.json), so every eye/mouth/brow/arm/leg
 * primitive that exists in the rig shows up here automatically. There are no
 * hardcoded mood presets — the rig renders PRIMITIVES; the AI composes moods.
 */

type Item = { key: string; file: string; label?: string; do?: string; rel?: string };
type Catalog = {
  eyes: Item[]; mouths: Item[]; brows: Item[];
  armR: Item[]; armL: Item[]; legs: Item[]; puppy: Item | null;
};

const BROWS: BrowPos[] = ["neutral", "raised", "lowered", "angry", "worried", "skeptical"];

export default function GiftyDemo() {
  const [cat, setCat] = useState<Catalog | null>(null);
  const [talking, setTalking] = useState(false);
  const [wave, setWave] = useState(false);
  const [eyes, setEyes] = useState("normal");
  const [mouth, setMouth] = useState("smile");
  const [brow, setBrow] = useState<BrowPos>("neutral");
  const [armR, setArmR] = useState("thumbsup");
  const [armL, setArmL] = useState("down");
  const [legs, setLegs] = useState("stand");

  useEffect(() => {
    fetch("/gifty/catalog/catalog.json").then((r) => r.json()).then(setCat).catch(() => {});
  }, []);

  // Prevent nonsensical mirrored gestures (double thumbsup/wave/salute).
  const MIRROR = ["thumbsup", "wave", "salute"];
  const pickArmR = (a: string) => { setArmR(a); if (MIRROR.includes(a) && armL === a) setArmL("down"); };
  const pickArmL = (a: string) => { setArmL(a); if (MIRROR.includes(a) && armR === a) setArmR("down"); };

  const btn = (on: boolean): React.CSSProperties => ({
    padding: "7px 13px", borderRadius: 999, cursor: "pointer",
    border: "1px solid " + (on ? "#E5447F" : "#2a3a6a"),
    background: on ? "#E5447F" : "transparent", color: "#fff", fontWeight: 600, fontSize: 12,
  });
  const row = (title: string, items: string[], cur: string, set: (v: string) => void) => (
    <>
      <p style={{ marginTop: 10, opacity: 0.5, fontSize: 12 }}>{title}</p>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", maxWidth: 480 }}>
        {items.map((a) => <button key={a} style={btn(a === cur)} onClick={() => set(a)}>{a}</button>)}
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a" }}>
      <div style={{ textAlign: "center", color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 40 }}>
        <div style={{ width: 400, height: 400, margin: "0 auto", display: "grid", placeItems: "center",
                      background: "radial-gradient(circle at 50% 42%, #1b2f63, #0d1b3a)", borderRadius: 28 }}>
          <RigGifty size={340} talking={talking} wave={wave}
                    eyes={eyes} mouth={mouth} brow={brow} armR={armR} armL={armL} legs={legs} />
        </div>

        <p style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
          eyes <b>{eyes}</b> · mouth <b>{mouth}</b> · brow <b>{brow}</b>
          {talking && " · talking"}{wave && " · waving"}
        </p>

        <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "center" }}>
          <button style={btn(talking)} onClick={() => setTalking((v) => !v)}>🗣 talk</button>
          <button style={btn(wave)} onClick={() => setWave((v) => !v)}>👋 wave anim</button>
        </div>

        {!cat ? <p style={{ opacity: 0.6, marginTop: 20 }}>loading catalog…</p> : (
          <>
            {row("eyes", [...cat.eyes.map((e) => e.key), ...(cat.puppy ? ["puppy"] : [])], eyes, setEyes)}
            {row("mouth", cat.mouths.map((m) => m.key), mouth, setMouth)}
            {row("brow", BROWS, brow, (v) => setBrow(v as BrowPos))}
            {row("right arm", cat.armR.map((a) => a.key), armR, pickArmR)}
            {row("left arm", cat.armL.map((a) => a.key), armL, pickArmL)}
            {row("legs", cat.legs.map((l) => l.key), legs, setLegs)}
          </>
        )}
      </div>
    </div>
  );
}
