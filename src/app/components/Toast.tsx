import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Star, Gift, Zap, Trophy } from "lucide-react";

export type ToastKind = "xp" | "badge" | "gift" | "quest" | "success" | "levelup" | "funded" | "error" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

const KIND_STYLES: Record<ToastKind, { bg: string; border: string; icon: React.ReactNode }> = {
  xp:      { bg: "bg-accent/10",       border: "border-accent/40",        icon: <Zap className="w-4 h-4 text-accent" /> },
  badge:   { bg: "bg-purple-500/10",   border: "border-purple-500/40",    icon: <Trophy className="w-4 h-4 text-purple-400" /> },
  gift:    { bg: "bg-pink-500/10",     border: "border-pink-500/40",      icon: <Gift className="w-4 h-4 text-pink-400" /> },
  quest:   { bg: "bg-success/10",    border: "border-success/40",     icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
  success: { bg: "bg-emerald-500/10",  border: "border-emerald-500/40",   icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
  levelup: { bg: "bg-yellow-400/10",   border: "border-yellow-400/50",    icon: <Star className="w-4 h-4 text-yellow-400" /> },
  funded:  { bg: "bg-yellow-400/10",   border: "border-yellow-400/50",    icon: <span className="text-base">🎰</span> },
  error:   { bg: "bg-red-500/10",      border: "border-red-500/40",       icon: <span className="text-base text-red-400">✕</span> },
  info:    { bg: "bg-blue-500/10",     border: "border-blue-500/40",      icon: <span className="text-base text-blue-400">ℹ</span> },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { bg, border, icon } = KIND_STYLES[toast.kind];

  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onDismiss}
      className={`flex items-center gap-3 px-4 py-3 border ${bg} ${border} shadow-lg cursor-pointer min-w-[200px] max-w-[300px]`}
    >
      {icon}
      <p className="text-sm font-bold text-white">{toast.message}</p>
    </motion.div>
  );
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing toast state
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function push(kind: ToastKind, message: string) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, kind, message }]);
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, push, dismiss };
}
