import { useState, useEffect } from 'react';
import { GooeyLoader } from '@/components/ui/loader-10';

export default function RouteFallback() {
  const [showSpinner, setShowSpinner] = useState(false);

  // Delay spinner to avoid flash on fast loads
  useEffect(() => {
    const t = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!showSpinner) return <div className="min-h-[60vh]" />;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <GooeyLoader />
    </div>
  );
}
