import { useState, useEffect } from "react";
import { recommendationApi, followApi, type RecommendedCreatorResponse } from "../../lib/api";

interface RecommendedCreatorsProps {
  onToast?: (kind: "success" | "error" | "info", message: string) => void;
}

export default function RecommendedCreators({ onToast }: RecommendedCreatorsProps) {
  const [creators, setCreators] = useState<RecommendedCreatorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await recommendationApi.getRecommendations(6);
        if (res.success && res.data) {
          setCreators(res.data);
        }
      } catch {
        // Backend unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFollow = async (username: string) => {
    try {
      const res = await followApi.follow(username);
      if (res.success) {
        setFollowingSet((prev) => new Set(prev).add(username));
        setCreators((prev) => prev.filter((c) => c.username !== username));
        onToast?.("success", `Now following ${username}`);
      }
    } catch {
      onToast?.("error", "Failed to follow");
    }
  };

  const handleDismiss = async (username: string) => {
    try {
      await recommendationApi.dismiss(username);
      setCreators((prev) => prev.filter((c) => c.username !== username));
    } catch {
      // silent fail
    }
  };

  if (loading) {
    return (
      <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Suggested for You</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-border" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-border rounded w-24" />
              <div className="h-2.5 bg-border rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (creators.length === 0) return null;

  return (
    <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Suggested for You</h3>

      <div className="space-y-3">
        {creators.map((creator) => (
          <div key={creator.username} className="flex items-start gap-3 group">
            {/* Avatar */}
            <a href={`/creator/${creator.username}`} className="flex-shrink-0">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
                  {creator.initials}
                </div>
              )}
            </a>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <a
                href={`/creator/${creator.username}`}
                className="text-sm font-semibold text-foreground hover:underline truncate block"
              >
                {creator.displayName || creator.username}
              </a>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                {creator.reason}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleFollow(creator.username)}
                disabled={followingSet.has(creator.username)}
                className="text-xs font-bold text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
              >
                {followingSet.has(creator.username) ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => handleDismiss(creator.username)}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                title="Not interested"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
