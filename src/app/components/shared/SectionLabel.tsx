interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "mb-3" }: SectionLabelProps) {
  return (
    <div className={`text-[10px] font-black uppercase tracking-widest text-subtle ${className}`}>
      {children}
    </div>
  );
}
