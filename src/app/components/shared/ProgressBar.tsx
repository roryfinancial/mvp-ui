import { motion } from "motion/react";

interface ProgressBarProps {
  /** Fill amount as a percentage, 0–100 (clamped). */
  value: number;
  /** Track classes — height, background, width (e.g. "h-2 bg-secondary"). */
  className?: string;
  /** Fill classes — color/gradient (default the accent). */
  barClassName?: string;
  /** Pill (rounded-full) vs the default square track/fill. */
  rounded?: boolean;
  duration?: number;
  delay?: number;
}

/**
 * The single source for the animated progress fills used across projects,
 * gamification, and feed cards: a track + a motion fill that grows from 0 to
 * `value`%. Replaces the repeated track-div + motion.div + animate-width markup.
 */
export function ProgressBar({
  value,
  className = "h-2 bg-secondary",
  barClassName = "bg-accent",
  rounded = false,
  duration = 0.6,
  delay = 0,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const radius = rounded ? "rounded-full" : "";
  return (
    <div className={`overflow-hidden ${radius} ${className}`}>
      <motion.div
        className={`h-full ${radius} ${barClassName}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration, delay, ease: "easeOut" }}
      />
    </div>
  );
}
