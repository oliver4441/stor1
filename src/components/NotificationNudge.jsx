// ── Omix Notification Nudge Banner ───────────────────────────
// Persistent-yet-dismissible banner for signed-in users who haven't
// enabled web push notifications. Shown on 'default' permission state
// (never asked). Hidden permanently once dismissed or granted.

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, BellRing, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isPushSupported, subscribeToPush } from '../utils/pushNotifications';

const NUDGE_DISMISSED_KEY = 'omix_notif_nudge_dismissed';

export default function NotificationNudge() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (localStorage.getItem(NUDGE_DISMISSED_KEY)) return;
    if (!user) return;  // logged-out visitors don't need a nudge
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return; // respect their "no"
    if (!isPushSupported()) return;

    // Only shown when permission state is 'default' (never asked)
    if (Notification.permission === 'default') {
      setVisible(true);
    }
  }, [user]);

  const enable = useCallback(async () => {
    setBusy(true);
    const result = await subscribeToPush();
    setBusy(false);

    if (result.success) {
      setSuccess(true);
      localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
      setTimeout(() => setVisible(false), 1800);
    } else {
      // User denied or it failed — dismiss so we don't pester
      localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
      setVisible(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
    setVisible(false);
  }, []);

  if (!visible) return null;

  if (success) {
    return (
      <div className="relative w-full bg-emerald-900/30 border-b border-emerald-700/40 py-3 z-50 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-200">
            Notifications enabled! You will now receive order updates and exclusive deals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-to-r from-[#0a0e1a] via-[#111827] to-[#0a0e1a] border-b border-[#1e2a4a]/60 py-3 z-50 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-zinc-600/20 flex items-center justify-center shrink-0 ring-1 ring-zinc-500/30">
            <Bell className="w-4.5 h-4.5 text-zinc-500" style={{ width: '18px', height: '18px' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">
              Stay in the loop
            </p>
            <p className="text-xs text-[#8899b4] leading-tight mt-0.5">
              Get real-time order updates, flash deals, and exclusive offers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={enable}
            disabled={busy}
            className="px-4 py-1.5 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            {busy ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <BellRing className="w-3.5 h-3.5" />
            )}
            {busy ? 'Enabling…' : 'Enable'}
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-[#4A5771] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
