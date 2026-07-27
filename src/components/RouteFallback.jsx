import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function RouteFallback() {
  const [show, setShow] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Delay to avoid flash on fast loads, then fade in
  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 150);
    const t2 = setTimeout(() => setPulse(true), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className={cn(
        "min-h-[70vh] flex flex-col items-center justify-center px-4 transition-all duration-500",
        show ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Omix branded logo loader */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-1000",
            pulse ? "opacity-40 scale-150" : "opacity-0 scale-100"
          )}
          style={{
            background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Animated ring 1 */}
        <div
          className={cn(
            "absolute -inset-4 rounded-full border-2 transition-all duration-1000",
            pulse ? "opacity-30 scale-110 border-teal-500/30" : "opacity-0 scale-90 border-transparent"
          )}
          style={{ animation: pulse ? 'omix-ring-spin 3s linear infinite' : 'none' }}
        />

        {/* Animated ring 2 */}
        <div
          className={cn(
            "absolute -inset-8 rounded-full border transition-all duration-1000",
            pulse ? "opacity-20 scale-110 border-teal-400/20" : "opacity-0 scale-90 border-transparent"
          )}
          style={{ animation: pulse ? 'omix-ring-spin 4s linear infinite reverse' : 'none' }}
        />

        {/* Logo mark */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-500/20">
          <span className="text-white font-black text-2xl">O</span>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-700"
          style={{
            width: pulse ? '100%' : '0%',
            animation: pulse ? 'omix-load-bar 1.4s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes omix-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes omix-load-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
