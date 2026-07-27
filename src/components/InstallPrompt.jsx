import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'omix_install_dismissed';
const DISMISS_DAYS = 7;

/**
 * InstallPrompt — PWA install banner
 *
 * Listens for the 'beforeinstallprompt' event and shows a glassmorphism
 * banner at the bottom of the screen when the event is available but the
 * user hasn't installed (or dismissed) yet.
 *
 * Dismissal is persisted in localStorage for 7 days.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone / display-mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // Check dismissal cooldown
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const elapsed = Date.now() - Number(dismissed);
        if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
          return; // still in cooldown
        }
        // Cooldown expired — clear the flag
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable
    }

    const handler = (e) => {
      e.preventDefault(); // Prevent Chrome's default mini-infobar
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShow(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[110] animate-slide-up">
      <div className="backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border border-white/20 dark:border-zinc-700/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--seasonal-primary,#0d9488)]/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-[var(--seasonal-primary,#0d9488)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">
                  Install Omix Store
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                  Install for the best experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          <button
            onClick={handleInstall}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-[var(--seasonal-primary,#0d9488)] hover:bg-[var(--seasonal-secondary,#14b8a6)] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-[var(--seasonal-primary,#0d9488)]/20"
          >
            <Download className="w-4 h-4" />
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
}
