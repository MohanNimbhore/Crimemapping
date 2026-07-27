import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-slate-700/40" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div
          className="absolute inset-1.5 h-9 w-9 rounded-full border-4 border-t-transparent border-r-blue-400/40 border-b-transparent border-l-transparent animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse-subtle">Loading...</p>
    </div>
  );
}

export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
