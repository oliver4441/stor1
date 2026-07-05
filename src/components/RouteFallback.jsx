import { useState, useEffect } from 'react';

export default function RouteFallback() {
  const [showSpinner, setShowSpinner] = useState(false);

  // Delay spinner to avoid flash on fast loads
  useEffect(() => {
    const t = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!showSpinner) return <div className="min-h-[60vh]" />;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-zinc-700 border-t-[var(--seasonal-primary,#1a5632)] rounded-full animate-spin" />
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}
