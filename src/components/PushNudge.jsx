import { useState, useEffect, useCallback } from 'react';
import { Bell, X, BellRing } from 'lucide-react';
import { isPushSupported, subscribeToPush } from '../utils/pushNotifications';

const STORAGE_KEY = 'omix_push_nudge_dismissed';
const DISMISS_DAYS = 3;

export default function PushNudge() {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    // Don't show if push not supported
    if (!isPushSupported()) return;

    // Don't show if already granted or denied
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    // Check dismissal cooldown
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const dismissedTime = parseInt(stored, 10);
      const cooldown = DISMISS_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < cooldown) return;
      localStorage.removeItem(STORAGE_KEY);
    }

    // Show after a delay
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = useCallback(async () => {
    setSubscribing(true);
    const res = await subscribeToPush();
    setSubscribing(false);

    if (res.success) {
      setResult('success');
      setTimeout(() => setVisible(false), 2000);
    } else {
      setResult('error');
      setTimeout(() => setResult(null), 3000);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[110] animate-slide-up">
      <div className="backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <BellRing className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Stay Updated
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                  Get notified about orders, deals, and new arrivals
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {result === 'success' ? (
            <div className="mt-3 p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                Notifications enabled! You will now receive updates.
              </p>
            </div>
          ) : result === 'error' ? (
            <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                Could not enable notifications. Please check browser settings.
              </p>
            </div>
          ) : (
            <button
              onClick={handleEnable}
              disabled={subscribing}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {subscribing ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
