import { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';

const CONSENT_KEY = 'omix_cookie_consent';

export function getCookieConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

export function hasCookieConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
      setTimeout(() => setEntering(true), 50);
    }
  }, []);

  const accept = () => {
    setEntering(false);
    setTimeout(() => {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      setVisible(false);
    }, 200);
  };

  const deny = () => {
    setEntering(false);
    setTimeout(() => {
      localStorage.setItem(CONSENT_KEY, 'denied');
      setVisible(false);
    }, 200);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4 safe-area-bottom">
      <div
        className={`max-w-xl mx-auto transition-all duration-300 ${
          entering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-black/30">
          {/* Gradient accent bar at top */}
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-emerald-400" />

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-teal-500/20">
                <Cookie className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-1">Cookie Consent</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We use a referral tracking cookie to reward affiliates when you make a purchase.
                  This cookie is set when you arrive via an affiliate referral link and is used solely
                  to attribute your purchases to the correct affiliate. No personal data is collected.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  You may accept or deny. If you deny, referral tracking will not function.
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={accept}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-teal-600/20">
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button onClick={deny}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-all active:scale-95">
                    Deny
                  </button>
                </div>
              </div>
              <button onClick={deny} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 flex-shrink-0 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
