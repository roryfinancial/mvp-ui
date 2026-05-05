import { useEffect, useRef, useState } from "react";
import type { FeedEvent } from "../../lib/types";

interface LiveTickerProps {
  events: FeedEvent[];
}

function formatEvent(e: FeedEvent): string {
  switch (e.type) {
    case "gift":      return `${e.actorName} gifted $${e.amount} to ${e.targetName}`;
    case "milestone": return `🎰 FUNDED — ${e.actorName}'s ${e.targetName} hit its goal!`;
    case "league_up": return `${e.actorName} reached ${e.targetName} tier 🏆`;
    case "new_item":  return `${e.actorName} added a new item: ${e.targetName}`;
    case "streak":    return `${e.actorName} is on a ${e.targetName}-day streak 🔥`;
    case "follow":    return `${e.actorName} started following ${e.targetName}`;
    default:          return `${e.actorName} → ${e.targetName}`;
  }
}

function eventColor(type: FeedEvent["type"]): string {
  const map: Record<FeedEvent["type"], string> = {
    gift:      "text-accent",
    milestone: "text-yellow-400",
    league_up: "text-cyan-400",
    new_item:  "text-green-400",
    streak:    "text-orange-400",
    follow:    "text-white/60",
  };
  return map[type] ?? "text-white/60";
}

export default function LiveTicker({ events }: LiveTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const speed = 0.6; // px per frame
    function tick() {
      setOffset((prev) => {
        const track = trackRef.current;
        if (!track) return prev;
        const halfWidth = track.scrollWidth / 2;
        const next = prev + speed;
        return next >= halfWidth ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Duplicate events so marquee loops seamlessly
  const doubled = [...events, ...events];

  return (
    <div className="w-full bg-white/5 border-b border-accent/20 overflow-hidden py-2">
      <div
        ref={trackRef}
        className="flex gap-0 whitespace-nowrap will-change-transform"
        style={{ transform: `translateX(-${offset}px)` }}
      >
        {doubled.map((event, i) => (
          <span key={`${event.id}-${i}`} className="flex items-center gap-2 text-xs font-medium px-6">
            <span className="text-white/20">◆</span>
            <span className={eventColor(event.type)}>{formatEvent(event)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
