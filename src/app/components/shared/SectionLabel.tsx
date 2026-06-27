interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "mb-3" }: SectionLabelProps) {
  return (
    <div className={`eyebrow ${className}`}>
      {children}
    </div>
  );
}
