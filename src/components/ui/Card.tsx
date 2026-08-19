interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-slate-800/70 border border-slate-700/50 rounded-2xl card-lift ${className}`}>
      {children}
    </div>
  );
}
