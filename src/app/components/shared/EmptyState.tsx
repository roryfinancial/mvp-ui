import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  sub?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, message, sub, className = "" }: EmptyStateProps) {
  return (
    <div className={`py-12 text-center border border-dashed border-border ${className}`}>
      <Icon className="w-10 h-10 text-subtle mx-auto mb-3" />
      <p className="text-sm text-muted-foreground mb-1">{message}</p>
      {sub && <p className="text-xs text-subtle">{sub}</p>}
    </div>
  );
}
