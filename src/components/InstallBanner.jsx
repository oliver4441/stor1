import { Download, X, Smartphone } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'omix_install_banner_dismissed';
const DISMISS_DAYS = 2; // Re-show after 2 days instead of 7
const VISIT_THRESHOLD = 3; // Show after 3 visits if not installed

export default function InstallBanner({ onOpenFullGuide }) {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detect platform
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // Only show on mobile devices
    if (!ios && !android) return;

    // Track visit count
    const visitKey = 'omix_install_visits';
    let visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    visits += 1;
    localStorage.setItem(visitKey, String(visits));

    // Check dismissal cooldown
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const dismissedTime = parseInt(stored, 10);
      const cooldown = DISMISS_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < cooldown && visits < VISIT_THRESHOLD * 2) {
        return; // Still in cooldown and not enough visits
      }
      // Cooldown expired — clear for fresh start
      if (Date.now() - dismissedTime >= cooldown) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(visitKey);
        visits = 1;
        localStorage.setItem(visitKey, '1');
      }
    }

    // Show after visit threshold
    if (visits >= VISIT_THRESHOLD) {
      // Small delay so it doesn't pop up immediately on page load
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for install prompt (Android)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If we get the native prompt event, show immediately regardless of visit count
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setDismissCount(prev => prev + 1);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (onOpenFullGuide) {
      onOpenFullGuide();
    } else {
      window.location.href = '/install';
    }
  }, [deferredPrompt, onOpenFullGuide]);

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 p-3 safe-area-top">
      <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3 animate-slide-down">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff385c] to-[#ff6b8a] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#ff385c]/20">
          <span className="text-white font-black text-xl">O</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-900 dark:text-white text-sm leading-tight">
            Install Omix App
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isIOS ? 'Add to your home screen for the best experience' : 'Get faster access, works offline'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[#ff385c]/20 hover:shadow-[#ff385c]/40 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            {isIOS ? 'How' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
