import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ConfettiBurstProps {
  active: boolean;
  /** "local" renders in parent (needs relative overflow-hidden parent), "fullscreen" renders fixed */
  mode?: "local" | "fullscreen";
  count?: number;
}

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#f97316", "#06b6d4"];
const SHAPES = ["rounded-sm", "rounded-full", "rotate-45"];

interface Particle {
  color: string; startX: string; spread: number; delay: number;
  duration: number; size: number; shape: string; fallY: string; spin: number;
}

function generateParticles(count: number, mode: "local" | "fullscreen"): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    color: COLORS[i % COLORS.length],
    startX: mode === "fullscreen" ? `${20 + Math.random() * 60}vw` : `${(i / count) * 100}%`,
    spread: (Math.random() - 0.5) * (mode === "fullscreen" ? 300 : 120),
    delay: (i % 6) * 0.06,
    duration: 1.2 + Math.random() * 0.8,
    size: 6 + Math.floor(Math.random() * 6),
    shape: SHAPES[i % SHAPES.length],
    fallY: `${150 + Math.random() * 200}%`,
    spin: (i % 2 === 0 ? 1 : -1) * (180 + Math.random() * 180),
  }));
}

export default function ConfettiBurst({ active, mode = "local", count = 28 }: ConfettiBurstProps) {
  const particles = useMemo(() => generateParticles(count, mode), [count, mode]);

  const posClass = mode === "fullscreen"
    ? "fixed inset-0 pointer-events-none z-[999] overflow-hidden"
    : "absolute inset-0 pointer-events-none z-10 overflow-hidden";

  return (
    <AnimatePresence>
      {active && (
        <div className={posClass}>
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className={`absolute ${p.shape}`}
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                left: p.startX,
                top: mode === "fullscreen" ? "30%" : "10%",
              }}
              initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
              animate={{
                opacity: [1, 1, 0],
                y: ["0%", p.fallY],
                x: [0, p.spread],
                rotate: [0, p.spin],
                scale: [1, 0.6],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
