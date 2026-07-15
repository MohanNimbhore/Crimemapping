import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400 dark:text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="text-sm font-medium">Loading...</span>
    </div>
  );
}

export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
