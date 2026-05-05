import { useEffect, useRef, useState } from "react";
import type { FeedEvent } from "../../lib/types";

interface LiveTickerProps {
  events: FeedEvent[];
}

function formatEvent(e: FeedEvent): string {
  switch (e.type) {
    case "gift":      return `${e.actorName} gifted $${e.amount} to ${e.targetName}`;
    case "milestone": return `🎰 FUNDED — ${e.targetName} hit its goal!`;
    case "league_up": return `${e.actorName} reached ${e.targetName} tier`;
    case "new_item":  return `${e.actorName} added: ${e.targetName}`;
    case "streak":    return `${e.actorName} — ${e.targetName}-day streak 🔥`;
    case "follow":    return `${e.actorName} followed ${e.targetName}`;
    default:          return `${e.actorName} → ${e.targetName}`;
  }
}

const EVENT_ICON: Record<FeedEvent["type"], string> = {
  gift:      "🎁",
  milestone: "🏆",
  league_up: "💎",
  new_item:  "✨",
  streak:    "🔥",
  follow:    "👋",
};

const EVENT_COLOR: Record<FeedEvent["type"], string> = {
  gift:      "text-accent/80",
  milestone: "text-yellow-400/80",
  league_up: "text-cyan-400/80",
  new_item:  "text-green-400/80",
  streak:    "text-orange-400/80",
  follow:    "text-white/40",
};

export default function LiveTicker({ events }: LiveTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const speed = 0.32; // px per frame — noticeably slower
    function tick() {
      if (!pausedRef.current) {
        setOffset((prev) => {
          const track = trackRef.current;
          if (!track) return prev;
          const halfWidth = track.scrollWidth / 2;
          const next = prev + speed;
          return next >= halfWidth ? 0 : next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const doubled = [...events, ...events];

  return (
    <div
      className="w-full overflow-hidden py-1.5 border-b border-white/8 bg-gradient-to-r from-white/[0.03] to-transparent"
      onMouseEnter={() => { pausedRef.current = true; setHovered(true); }}
      onMouseLeave={() => { pausedRef.current = false; setHovered(false); }}
    >
      {/* Label */}
      <div className="flex items-center">
        <span className="flex-shrink-0 px-3 text-[9px] font-black uppercase tracking-widest text-white/25 border-r border-white/10 mr-0">
          Live
        </span>
        <div
          ref={trackRef}
          className="flex gap-0 whitespace-nowrap will-change-transform transition-opacity duration-300"
          style={{ transform: `translateX(-${offset}px)`, opacity: hovered ? 0.7 : 1 }}
        >
          {doubled.map((event, i) => (
            <span key={`${event.id}-${i}`} className="flex items-center gap-1.5 text-[11px] font-medium px-5">
              <span className="text-white/15">·</span>
              <span className="text-sm leading-none opacity-60">{EVENT_ICON[event.type]}</span>
              <span className={EVENT_COLOR[event.type]}>{formatEvent(event)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
