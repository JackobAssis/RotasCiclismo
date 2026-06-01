interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <section className={className}>
      {title && (
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
