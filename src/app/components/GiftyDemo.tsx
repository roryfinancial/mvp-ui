"use client";

import { useState } from "react";
import { RigGifty, type Mood } from "./shared/gifty/RigGifty";

/**
 * /gifty-demo — layered Gifty rig: mood (eyes+mouth), talking (viseme cycle),
 * wave. All driven by swapping/animating real cut layers.
 */

const MOODS: Mood[] = ["normal", "happy", "smug", "proud", "shy", "thinking"];

export default function GiftyDemo() {
  const [mood, setMood] = useState<Mood>("normal");
  const [talking, setTalking] = useState(false);
  const [wave, setWave] = useState(false);

  const btn = (on: boolean): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 999, cursor: "pointer",
    border: "1px solid " + (on ? "#E5447F" : "#2a3a6a"),
    background: on ? "#E5447F" : "transparent", color: "#fff", fontWeight: 600, fontSize: 13,
  });

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a" }}>
      <div style={{ textAlign: "center", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ width: 400, height: 400, margin: "0 auto", display: "grid", placeItems: "center",
                      background: "radial-gradient(circle at 50% 42%, #1b2f63, #0d1b3a)", borderRadius: 28 }}>
          <RigGifty size={340} mood={mood} talking={talking} wave={wave} />
        </div>

        <p style={{ marginTop: 16, opacity: 0.7, fontSize: 13 }}>
          mood: <strong style={{ color: "#fff" }}>{mood}</strong>
          {talking && " · talking"}{wave && " · waving"}
        </p>

        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 440 }}>
          {MOODS.map((m) => (
            <button key={m} style={btn(m === mood)} onClick={() => setMood(m)}>{m}</button>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
          <button style={btn(talking)} onClick={() => setTalking((v) => !v)}>🗣 talk</button>
          <button style={btn(wave)} onClick={() => setWave((v) => !v)}>👋 wave</button>
        </div>
      </div>
    </div>
  );
}
