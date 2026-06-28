import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X, Sparkles, ArrowUpCircle } from 'lucide-react';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000;
const STORAGE_KEY = 'omix_last_version';

export default function PWAUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [show, setShow] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const response = await fetch('/version.json?_t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return;
      
      const data = await response.json();
      const serverVersion = data.version;
      setNewVersion(serverVersion);
      
      const lastVersion = localStorage.getItem(STORAGE_KEY);
      
      if (lastVersion && lastVersion !== serverVersion) {
        setUpdateAvailable(true);
        // Delay show for a smooth entrance after page load
        setTimeout(() => setShow(true), 500);
      }
      
      localStorage.setItem(STORAGE_KEY, serverVersion);
    } catch (e) {
      console.warn('Version check failed:', e.message);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Periodic checks
  useEffect(() => {
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForUpdate]);

  // Check on tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [checkForUpdate]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
      }
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.removeItem(STORAGE_KEY);
      // Force reload from server
      window.location.reload(true);
    } catch (e) {
      console.error('Update failed:', e);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  if (!updateAvailable || dismissed) return null;

  // Generate nice version label
  const versionLabel = newVersion 
    ? newVersion.replace('build-', '').slice(0, 8)
    : '';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm transition-all duration-500 ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <div
          className="relative w-full max-w-sm overflow-hidden rounded-3xl border backdrop-blur-xl shadow-2xl transition-all"
          style={{
            backgroundColor: 'var(--seasonal-surface, #ffffff)',
            borderColor: 'var(--seasonal-border, #e4e4e7)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Top gradient accent bar */}
          <div
            className="h-1.5 w-full rounded-t-3xl"
            style={{
              background: `linear-gradient(90deg, var(--seasonal-primary, #1a5632), var(--seasonal-secondary, #14472a))`,
            }}
          />

          <div className="p-6">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-5 right-5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all"
              style={{ color: 'var(--seasonal-muted, #71717a)' }}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="relative shrink-0">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, var(--seasonal-primary, #1a5632), var(--seasonal-secondary, #14472a))`,
                  }}
                >
                  <ArrowUpCircle className="w-7 h-7 text-white" />
                </div>
                {/* Sparkle badge */}
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center animate-bounce-subtle ring-2 ring-white dark:ring-zinc-900"
                  style={{ backgroundColor: 'var(--seasonal-primary, #1a5632)' }}
                >
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base font-black mb-0.5"
                  style={{ color: 'var(--seasonal-text-primary, #18181b)' }}
                >
                  Update Available
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--seasonal-text-secondary, #52525b)' }}
                >
                  A new version of Omix Store is ready. Get the latest features, improvements, and fixes.
                </p>

                {/* Version badge */}
                {versionLabel && (
                  <div
                    className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold"
                    style={{
                      backgroundColor: 'var(--seasonal-surface-alt, #f5f5f5)',
                      color: 'var(--seasonal-primary, #1a5632)',
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>v{versionLabel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-bold py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, var(--seasonal-primary, #1a5632), var(--seasonal-secondary, #14472a))`,
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Updating...' : 'Update Now'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--seasonal-surface-alt, #f5f5f5)',
                  color: 'var(--seasonal-text-secondary, #52525b)',
                }}
              >
                Later
              </button>
            </div>

            {/* Progress bar during update */}
            {isUpdating && (
              <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--seasonal-border, #e4e4e7)' }}>
                <div
                  className="h-full rounded-full animate-progress-bar"
                  style={{
                    background: `linear-gradient(90deg, var(--seasonal-primary, #1a5632), var(--seasonal-secondary, #14472a))`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
