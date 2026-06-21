import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'omix_last_version';

/**
 * PWA Update Checker
 * 
 * Checks /version.json on mount and periodically.
 * When a new version is detected, shows a banner prompting the user to update.
 * On update: unregisters old SW, clears caches, and reloads.
 */
export default function PWAUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      // Fetch current version from server (bypass cache)
      const response = await fetch('/version.json?_t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      const serverVersion = data.version;
      
      // Compare with last known version
      const lastVersion = localStorage.getItem(STORAGE_KEY);
      
      if (lastVersion && lastVersion !== serverVersion) {
        // New version detected!
        setUpdateAvailable(true);
      }
      
      // Store current version
      localStorage.setItem(STORAGE_KEY, serverVersion);
    } catch (e) {
      // Silently fail — network issues shouldn't break the app
      console.warn('Version check failed:', e.message);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    // Small delay so it doesn't block initial render
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdate]);

  // Periodic checks
  useEffect(() => {
    const interval = setInterval(checkForUpdate, VERSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForUpdate]);

  // Also check when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
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
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage version so we don't immediately re-prompt
      localStorage.removeItem(STORAGE_KEY);
      
      // Hard reload from server (bypass cache)
      window.location.reload(true);
    } catch (e) {
      console.error('Update failed:', e);
      // Fallback: just reload
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100] animate-slide-up">
      <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl shadow-2xl border border-zinc-700 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-bold mb-1">Update Available</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                A new version of Omix Store is ready. Update now to get the latest features and improvements.
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-zinc-700 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--seasonal-primary,#ff385c)] hover:bg-[var(--seasonal-secondary,#e03150)] text-white text-xs font-bold py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Update Now'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
            >
              Later
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        {isUpdating && (
          <div className="h-1 bg-zinc-700">
            <div className="h-full bg-[var(--seasonal-primary,#ff385c)] animate-progress-bar" />
          </div>
        )}
      </div>
    </div>
  );
}
