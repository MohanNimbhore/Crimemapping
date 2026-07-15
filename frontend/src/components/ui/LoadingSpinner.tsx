import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 animate-fade-in">
      <div className="relative">
        <Loader2 className={`${sizes[size]} animate-spin text-blue-500`} />
        <div className="absolute inset-0 blur-md opacity-40">
          <Loader2 className={`${sizes[size]} animate-spin text-blue-400`} />
        </div>
      </div>
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}

export function ButtonLoader() {
  return (
    <div className="relative">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );
}
