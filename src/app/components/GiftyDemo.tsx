"use client";

import { useState } from "react";
import { Gifty, type GiftyState } from "./shared/gifty/Gifty";

/**
 * /gifty-demo — playground for the layered mascot. idle is rigged (breathe +
 * blink); every other button cross-fades to a high-quality pose render.
 */

const STATES: GiftyState[] = [
  "idle", "wave", "thumbsup", "salute", "present",
  "proud", "think", "celebrate", "sad", "sleep",
];

export default function GiftyDemo() {
  const [state, setState] = useState<GiftyState>("idle");

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d1b3a" }}>
      <div style={{ textAlign: "center", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            width: 360, height: 360, margin: "0 auto",
            display: "grid", placeItems: "center",
            background: "radial-gradient(circle at 50% 42%, #1b2f63, #0d1b3a)",
            borderRadius: 28,
          }}
        >
          <Gifty state={state} size={300} />
        </div>

        <p style={{ marginTop: 18, opacity: 0.7, fontSize: 14 }}>
          state: <strong style={{ color: "#fff" }}>{state}</strong>
          {state === "celebrate" && " · one-shot, returns to idle"}
        </p>

        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 460 }}>
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
