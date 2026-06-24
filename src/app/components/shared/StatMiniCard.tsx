import type React from "react";
import type { LucideIcon } from "lucide-react";

interface StatMiniCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  valueClassName?: string;
  valueStyle?: React.CSSProperties;
}

export function StatMiniCard({ label, value, icon: Icon, valueClassName = "text-foreground", valueStyle }: StatMiniCardProps) {
  return (
    <div className="p-4 bg-background border border-border card-game">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-subtle">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className={`text-2xl font-black ${valueClassName}`} style={valueStyle}>{value}</p>
    </div>
  );
}
