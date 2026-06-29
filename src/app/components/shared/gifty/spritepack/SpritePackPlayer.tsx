"use client";
import { useEffect, useRef, useState } from "react";
import { useSpritePack } from "./useSpritePack";
import { frameCss } from "./frameStyle";
import { moodToFace } from "./moodMap";
import type { Frame, Channel } from "./spritePackTypes";

type Props = {
  size?: number; mood?: string; talking?: boolean; wave?: boolean;
  armR?: string; armL?: string; legs?: string; brow?: string;
  eyes?: string; mouth?: string; tier?: string;
};

const TALK = ["talk_ah", "talk_oh", "talk_eh"];

function findFrame(ch: Channel | undefined, name: string): Frame | undefined {
  return ch?.frames.find((f) => f.name === name);
}

export function SpritePackPlayer({
  size = 320, mood = "normal", talking = false, wave = false,
  armR, armL, eyes, mouth,
}: Props) {
  const { hero, pack } = useSpritePack();
  const [viseme, setViseme] = useState(0);
  const [t, setT] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    let lastV = 0;
    const loop = (now: number) => {
      const e = now - start;
      setT(e / 1000);
      if (talking && e - lastV > 110) { lastV = e; setViseme((v) => (v + 1) % TALK.length); }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [talking]);

  // resolve current frame keys
  const face = moodToFace(mood);
  const eyesKey = eyes ?? face.eyes;
  const mouthKey = talking ? TALK[viseme] : (mouth ?? face.mouth);
  const armRKey = wave ? "wave" : (armR ?? "thumbsup");
  const armLKey = armL ?? "down";

  // breathe transform (matches RigGifty feel)
  const bob = Math.sin(t * 1.6) * size * 0.012;
  const breathe = 1 + Math.sin(t * 1.6) * 0.014;

  const box: React.CSSProperties = {
    position: "relative", width: size, height: size,
    transform: `translateY(${bob}px) scale(${breathe})`, willChange: "transform",
  };

  // before the pack loads: paint the hero crop full-box
  if (!pack) {
    if (!hero) return <div style={{ width: size, height: size }} />;
    return (
      <div style={box}>
        <div style={{ ...frameCss({ place: hero.frame.place, cell: hero.frame.cell, atlas: { w: hero.frame.cell.sw, h: hero.frame.cell.sh }, size }),
                      backgroundImage: `url(${hero.url})` }} />
      </div>
    );
  }

  const ch = (name: string) => pack.manifest.channels.find((c) => c.name === name);
  const facebaseCh = ch("facebase");
  const eyesCh = ch("eyes");
  const mouthCh = ch("mouth");
  const armsCh = ch("arms");
  const bodyCh = ch("body");

  const layer = (chName: string, frame: Frame | undefined, key: string, extra?: React.CSSProperties) => {
    if (!frame) return null;
    const sheet = pack.sheets[chName as import("./useSpritePack").Channel];
    const css = frameCss({ place: frame.place, cell: frame.cell, atlas: { w: sheet.w, h: sheet.h }, size });
    return <div key={key} style={{ ...css, backgroundImage: `url(${sheet.url})`, ...extra }} />;
  };

  const waveSwing = wave ? `rotate(${Math.sin(t * 8) * 12}deg)` : undefined;

  // z-order: body → armL → armR → facebase → eyes → mouth (matches bake draw order)
  return (
    <div style={box}>
      {layer("body", findFrame(bodyCh, "body"), "body")}
      {layer("arms", findFrame(armsCh, `armL_${armLKey}`), "armL")}
      {layer("arms", findFrame(armsCh, `armR_${armRKey}`), "armR", waveSwing ? { transform: waveSwing, transformOrigin: "30% 30%" } : undefined)}
      {layer("facebase", findFrame(facebaseCh, "facebase"), "facebase")}
      {layer("eyes", findFrame(eyesCh, `eyes_${eyesKey}`), "eyes")}
      {layer("mouth", findFrame(mouthCh, `mouth_${mouthKey}`), "mouth")}
    </div>
  );
}
