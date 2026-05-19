import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Link2 } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface ConnectPlatformsProps {
  userType: "creator" | "supporter";
  onBack?: () => void;
  onContinue?: () => void;
}

const creatorPlatforms: Platform[] = [
  {
    id: "twitch",
    name: "Twitch",
    icon: <TwitchIcon />,
    description: "Stream viewers can gift directly",
    color: "#9146FF",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <YouTubeIcon />,
    description: "Link your channel for subscribers",
    color: "#FF0000",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon />,
    description: "Share your project with followers",
    color: "#000000",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <InstagramIcon />,
    description: "Add your project link to bio",
    color: "#E4405F",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: <XIcon />,
    description: "Share your project with fans",
    color: "#000000",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: <ShopifyIcon />,
    description: "Sync products from your store",
    color: "#96BF48",
  },
];

const supporterPlatforms: Platform[] = [
  {
    id: "twitch",
    name: "Twitch",
    icon: <TwitchIcon />,
    description: "Find creators you follow",
    color: "#9146FF",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <YouTubeIcon />,
    description: "Import your subscriptions",
    color: "#FF0000",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <TikTokIcon />,
    description: "Discover creators you follow",
    color: "#000000",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <InstagramIcon />,
    description: "Find creators from your feed",
    color: "#E4405F",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    icon: <XIcon />,
    description: "Import creators you follow",
    color: "#000000",
  },
];

export default function ConnectPlatforms({ userType, onBack, onContinue }: ConnectPlatformsProps) {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const platforms = userType === "creator" ? creatorPlatforms : supporterPlatforms;

  function toggleConnect(id: string) {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      {onBack && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl mx-auto bg-background border border-border shadow-sm p-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-subtle mb-2">
            Step 1 of 2
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            Connect your platforms.
          </h1>
          <p className="text-muted-foreground text-sm">
            {userType === "creator"
              ? "Link your social accounts and storefronts so fans can find and support you."
              : "Connect your accounts to discover creators you already follow."}
          </p>
        </motion.div>

        {/* Platform Grid */}
        <div className="space-y-2 mb-8">
          {platforms.map((platform, index) => {
            const isConnected = connected.has(platform.id);
            return (
              <motion.button
                key={platform.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleConnect(platform.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 border transition-colors text-left ${
                  isConnected
                    ? "border-accent bg-accent/5"
                    : "border-border bg-muted hover:bg-background"
                }`}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ color: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-bold text-sm">{platform.name}</div>
                  <div className="text-muted-foreground text-xs">{platform.description}</div>
                </div>
                <div className="shrink-0">
                  {isConnected ? (
                    <div className="w-8 h-8 flex items-center justify-center bg-accent text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center border border-border text-subtle">
                      <Link2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-accent hover:bg-[#c9164f] text-white font-black text-sm uppercase tracking-widest transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onContinue}
            className="w-full px-6 py-3 text-muted-foreground font-medium text-sm hover:text-foreground transition-colors"
          >
            Skip for now
          </motion.button>
        </div>

        {/* Connected count */}
        {connected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-xs text-subtle"
          >
            {connected.size} platform{connected.size !== 1 ? "s" : ""} connected
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Inline SVG icons (lightweight, no extra deps) ──────────────────────── */

function TwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 1 1-2.882 0 1.441 1.441 0 0 1 2.882 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ShopifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.058-.121-.074l-.914 21.104zm-1.656-17.449a3.617 3.617 0 0 0-1.548-.399c-1.193 0-1.793.6-2.093 1.198 0 0-.6 1.497-.899 2.394l-1.796.553s.6-2.694.6-2.894c0-.199-1.593-5.288-1.593-5.288-.2-.399-.599-.599-.999-.599 0 0-1.746-.01-1.933-.01L6.41 8.057l2.195-.676s.898 2.693.998 2.993c.1.3.6 2.493.6 2.493l1.897-.584s-.6-1.793-.698-2.094c-.1-.3-.3-.599-.3-.599s.399-.898 1.298-.898c.599 0 .899.399.899 1.098 0 .6-.399 1.697-.599 2.595-.199.899.3 1.598 1.198 1.598 1.497 0 2.394-2.394 2.394-4.388 0-1.498-.899-2.695-2.611-2.695z" />
    </svg>
  );
}
