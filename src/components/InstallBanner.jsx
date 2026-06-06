import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed the banner
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Re-show after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOSDevice) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Listen for beforeinstallprompt (Android/Desktop Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showBanner || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 animate-slide-up">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff385c] to-[#ff6b8a] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#ff385c]/20">
          <span className="text-white font-black text-lg">O</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white">Install Omix</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {isIOS
              ? 'Tap Share → Add to Home Screen'
              : 'Get the full app experience'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isIOS ? (
            <div className="flex items-center gap-1.5 text-[#ff385c] text-xs font-bold">
              <Share className="w-4 h-4" />
              Share → Add
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="bg-[#ff385c] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#e03150] transition-colors flex items-center gap-1.5 shadow-md shadow-[#ff385c]/20"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallBanner;
