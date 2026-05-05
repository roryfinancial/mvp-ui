import { motion, AnimatePresence } from "motion/react";

interface ConfettiBurstProps {
  active: boolean;
  /** "local" renders in parent (needs relative overflow-hidden parent), "fullscreen" renders fixed */
  mode?: "local" | "fullscreen";
  count?: number;
}

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#f97316", "#06b6d4"];

export default function ConfettiBurst({ active, mode = "local", count = 28 }: ConfettiBurstProps) {
  const posClass = mode === "fullscreen"
    ? "fixed inset-0 pointer-events-none z-[999] overflow-hidden"
    : "absolute inset-0 pointer-events-none z-10 overflow-hidden";

  return (
    <AnimatePresence>
      {active && (
        <div className={posClass}>
          {Array.from({ length: count }).map((_, i) => {
            const color = COLORS[i % COLORS.length];
            const startX = mode === "fullscreen"
              ? `${20 + Math.random() * 60}vw`
              : `${(i / count) * 100}%`;
            const spread = (Math.random() - 0.5) * (mode === "fullscreen" ? 300 : 120);
            const delay = (i % 6) * 0.06;
            const duration = 1.2 + Math.random() * 0.8;
            const size = 6 + Math.floor(Math.random() * 6);
            const shapes = ["rounded-sm", "rounded-full", "rotate-45"];
            const shape = shapes[i % shapes.length];

            return (
              <motion.div
                key={i}
                className={`absolute ${shape}`}
                style={{
                  backgroundColor: color,
                  width: size,
                  height: size,
                  left: startX,
                  top: mode === "fullscreen" ? "30%" : "10%",
                }}
                initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
                animate={{
                  opacity: [1, 1, 0],
                  y: ["0%", `${150 + Math.random() * 200}%`],
                  x: [0, spread],
                  rotate: [0, (i % 2 === 0 ? 1 : -1) * (180 + Math.random() * 180)],
                  scale: [1, 0.6],
                }}
                transition={{ duration, delay, ease: "easeIn" }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
