"use client";
import { useState } from "react";
import { SpritePackPlayer } from "./shared/gifty/spritepack/SpritePackPlayer";

const MOODS = ["normal", "happy", "smug", "proud", "shy", "thinking", "puppy"];
const ARMS = ["thumbsup", "wave", "down", "salute", "open", "present", "calm", "fist", "sad"];

export default function GiftyPackDemo() {
  const [mood, setMood] = useState("normal");
  const [talking, setTalking] = useState(false);
  const [wave, setWave] = useState(false);
  const [armR, setArmR] = useState<string | undefined>(undefined);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a", color: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 400, height: 400, margin: "0 auto", display: "grid", placeItems: "center",
                      background: "radial-gradient(circle at 50% 42%, #1b2f63, #0d1b3a)", borderRadius: 28 }}>
          <SpritePackPlayer size={340} mood={mood} talking={talking} wave={wave} armR={armR} />
        </div>
        <p style={{ opacity: 0.7, fontSize: 13, marginTop: 12 }}>
          spritepack runtime · mood <b>{mood}</b>{talking && " · talking"}{wave && " · waving"}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 460, margin: "10px auto" }}>
          {MOODS.map((m) => <button key={m} onClick={() => setMood(m)} style={{ padding: "4px 10px" }}>{m}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 460, margin: "6px auto" }}>
          {ARMS.map((a) => <button key={a} onClick={() => setArmR(a)} style={{ padding: "4px 10px" }}>{a}</button>)}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={() => setTalking((v) => !v)}>🗣 talk</button>
          <button onClick={() => setWave((v) => !v)}>👋 wave</button>
        </div>
      </div>
    </div>
  );
}
