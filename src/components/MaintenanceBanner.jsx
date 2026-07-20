import { Settings } from 'lucide-react';

/**
 * ponytail: Maintenance banner — scrolling ticker at top of every page.
 * Scrolls right-to-left like news headlines.
 * Controlled by MAINTENANCE_MODE env var (VITE_MAINTENANCE_MODE).
 * Pass maintenanceMsg for custom text.
 */
export default function MaintenanceBanner({ message }) {
  const msg = message || 'We are currently performing scheduled maintenance. Some features may be temporarily unavailable. We apologize for the inconvenience.';

  // Duplicate text for seamless loop
  const ticker = `${msg}  ///  ${msg}  ///  ${msg}  ///  ${msg}  ///  `;

  return (
    <div className="relative w-full overflow-hidden bg-amber-900/30 border-b border-amber-700/40 py-1.5 z-50">
      <div className="flex items-center">
        {/* Static icon */}
        <div className="shrink-0 flex items-center gap-1.5 pl-3 pr-2 text-amber-400 z-10 bg-amber-900/30">
          <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Maint</span>
        </div>
        {/* Scrolling text */}
        <div className="overflow-hidden flex-1">
          <div
            className="whitespace-nowrap text-xs font-medium text-amber-200/90"
            style={{
              animation: 'ticker-scroll 40s linear infinite',
              width: 'max-content',
            }}
          >
            {ticker}
          </div>
        </div>
      </div>
    </div>
  );
}
