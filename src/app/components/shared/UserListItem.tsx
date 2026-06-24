interface UserListItemProps {
  initials: string;
  name: string;
  subtitle: string;
  metric: string;
  metricClassName?: string;
  className?: string;
}

export function UserListItem({
  initials,
  name,
  subtitle,
  metric,
  metricClassName = "text-accent font-black text-sm",
  className = "",
}: UserListItemProps) {
  return (
    <div className={`flex items-center gap-3 p-4 border border-border bg-background ${className}`}>
      <div className="w-8 h-8 bg-secondary flex items-center justify-center text-foreground font-bold text-xs flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium text-sm truncate">{name}</p>
        <p className="text-subtle text-xs">{subtitle}</p>
      </div>
      <p className={`flex-shrink-0 ${metricClassName}`}>{metric}</p>
    </div>
  );
}
