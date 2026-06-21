import { Download, X, Smartphone } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

/**
 * Smart install banner that:
 * - Detects if app is already installed (standalone mode) → hides
 * - Detects platform (iOS / Android / Desktop) → shows relevant instructions
 * - On Android/Desktop with beforeinstallprompt → shows native install button
 * - On iOS → shows "How to install on iPhone" button with modal
 * - Remembers dismissal in localStorage (re-shows after 7 days)
 * - Only shows on mobile-sized screens (not desktop)
 */
export default function InstallBanner({ onOpenFullGuide }) {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Check if dismissed recently (within 7 days)
    const stored = localStorage.getItem('omix_install_banner_dismissed');
    if (stored) {
      const dismissedTime = parseInt(stored, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) return;
    }

    // Detect platform
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // Only show on mobile devices
    if (!ios && !android) return;

    setVisible(true);

    // Listen for install prompt (Android)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem('omix_install_banner_dismissed', Date.now().toString());
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    // For iOS or no deferred prompt, open the full install guide
    if (onOpenFullGuide) {
      onOpenFullGuide();
    } else {
      window.location.href = '/install';
    }
  }, [deferredPrompt, onOpenFullGuide]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 safe-area-bottom">
      <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/20 border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3 animate-slide-up">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--seasonal-primary,#ff385c)] to-[var(--seasonal-primary,#ff385c)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--seasonal-primary,#ff385c)]/20">
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
            className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--seasonal-primary,#ff385c)] to-[var(--seasonal-secondary,#e03150)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[var(--seasonal-primary,#ff385c)]/20 hover:shadow-[var(--seasonal-primary,#ff385c)]/40 transition-all active:scale-95"
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
