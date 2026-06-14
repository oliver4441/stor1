import { AlertTriangle, Wrench } from 'lucide-react';

/**
 * Full-width maintenance warning banner.
 * Shows at the top of the page when maintenance mode is active.
 * Non-intrusive but clearly visible.
 */
export default function MaintenanceBanner() {
  return (
    <div
      className="w-full text-center py-2.5 px-4 font-semibold text-sm flex items-center justify-center gap-2"
      style={{
        background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)',
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
      role="alert"
    >
      <Wrench className="w-4 h-4 flex-shrink-0 animate-pulse" />
      <span>
        ⚠️ We're currently under maintenance. You can browse but purchasing is temporarily disabled. We'll be back shortly!
      </span>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    </div>
  );
}
