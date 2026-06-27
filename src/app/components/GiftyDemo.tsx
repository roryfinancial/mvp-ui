"use client";

import { useState } from "react";
import { Gifty, type GiftyState } from "./shared/gifty/Gifty";

/**
 * /gifty-demo — manual playground for the sprite engine. Click a state and
 * watch Gifty transition there through the idle hub. Toggle bridge strategy
 * to compare crossfade vs (once baked) rife.
 */

const STATES: GiftyState[] = ["idle", "wave", "think", "sleep", "wave_hd", "cheer_hd", "wave_hd2"];

export default function GiftyDemo() {
  const [state, setState] = useState<GiftyState>("idle");

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div
          style={{
            width: 320, height: 320, margin: "0 auto",
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 40%, #16285a, #0d1b3a)",
            borderRadius: 24,
          }}
        >
          <Gifty state={state} size={256} />
        </div>

        <p style={{ marginTop: 20, opacity: 0.7, fontSize: 14 }}>
          current: <strong>{state}</strong> · transitions route through idle
        </p>

        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 420 }}>
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              style={{
                padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                border: "1px solid " + (s === state ? "#E5447F" : "#2a3a6a"),
                background: s === state ? "#E5447F" : "transparent",
                color: "#fff", fontWeight: 600, fontSize: 13,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
