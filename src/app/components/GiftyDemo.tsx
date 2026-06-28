"use client";

import { useState } from "react";
import { RigGifty, type RigState } from "./shared/gifty/RigGifty";

/**
 * /gifty-demo — the layered (VTuber-style) Gifty rig. idle breathes + blinks;
 * buttons drive per-layer motion (wave = arm rotate, happy = brow lift).
 */

const STATES: RigState[] = ["idle", "wave", "happy", "blinkonly"];

export default function GiftyDemo() {
  const [state, setState] = useState<RigState>("idle");

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a" }}>
      <div style={{ textAlign: "center", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            width: 380, height: 380, margin: "0 auto",
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 42%, #1b2f63, #0d1b3a)",
            borderRadius: 28,
          }}
        >
          <RigGifty size={320} state={state} />
        </div>

        <p style={{ marginTop: 18, opacity: 0.7, fontSize: 14 }}>
          layered rig · state: <strong style={{ color: "#fff" }}>{state}</strong>
        </p>

        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 420 }}>
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              style={{
                padding: "8px 16px", borderRadius: 999, cursor: "pointer",
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
