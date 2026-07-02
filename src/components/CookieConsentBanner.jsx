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

  useEffect(() => {
    // Show only if no decision has been made yet
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const deny = () => {
    localStorage.setItem(CONSENT_KEY, 'denied');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-primary" />
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
            <div className="flex gap-2 mt-4">
              <button onClick={accept}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover flex items-center gap-1.5 transition-colors">
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button onClick={deny}
                className="px-5 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-700 transition-colors">
                Deny
              </button>
            </div>
          </div>
          <button onClick={deny} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
