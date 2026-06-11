import { Download, Share, Plus, ArrowDown, Smartphone, Monitor, CheckCircle2, Star, Zap, Shield, Wifi, X, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const STEPS = {
  android: {
    title: 'Android (Chrome)',
    color: 'from-green-500 to-emerald-600',
    icon: '🤖',
    steps: [
      { text: 'Tap the menu button (⋮) in the top-right corner', hint: 'Three vertical dots' },
      { text: 'Tap "Install app" or "Add to Home Screen"', hint: 'Look for the download icon' },
      { text: 'Tap "Install" to confirm', hint: 'The app will be added to your home screen' },
    ],
  },
  ios: {
    title: 'iPhone / iPad (Safari)',
    color: 'from-blue-500 to-indigo-600',
    icon: '🍎',
    steps: [
      { text: 'Tap the Share button at the bottom of the screen', hint: 'Square with an arrow pointing up' },
      { text: 'Scroll down and tap "Add to Home Screen"', hint: 'Icon with a plus sign' },
      { text: 'Tap "Add" in the top-right corner', hint: 'The Omix icon will appear on your home screen' },
    ],
  },
  desktop: {
    title: 'Desktop (Chrome/Edge)',
    color: 'from-purple-500 to-violet-600',
    icon: '💻',
    steps: [
      { text: 'Look for the install icon (⊕) in the address bar', hint: 'Right side of the URL bar' },
      { text: 'Click "Install Omix"', hint: 'A prompt will appear' },
      { text: 'Click "Install" to confirm', hint: 'Omix will open in its own window' },
    ],
  },
};

const FEATURES = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Native app performance, loads instantly', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: Wifi, title: 'Works Offline', desc: 'Browse listings even without internet', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: Shield, title: 'Secure', desc: 'Your data stays safe on your device', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  { icon: Smartphone, title: 'Full Screen', desc: 'No browser bar, just pure Omix', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
];

// iOS Install Guide Modal
function IOSInstallModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white relative">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="text-3xl mb-2">🍎</div>
          <h3 className="text-lg font-black">Install on iPhone / iPad</h3>
          <p className="text-white/80 text-sm">Follow these 3 steps</p>
        </div>

        {/* Steps */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">1</div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">Tap the Share button</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">At the bottom of the Safari screen — the square with an arrow pointing up</p>
              <div className="mt-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <Share className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-xs text-zinc-500">← Look for this icon at the bottom</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">2</div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">Scroll & tap "Add to Home Screen"</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Scroll down in the share menu to find it</p>
              <div className="mt-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-xs text-zinc-500">← Tap this option</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0">3</div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">Tap "Add" to confirm</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">The Omix icon will appear on your home screen!</p>
              <div className="mt-2 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">Done! Find the Omix icon on your home screen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Install() {
  const [activeTab, setActiveTab] = useState('android');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installState, setInstallState] = useState('idle'); // idle | installing | installed

  // Detect platform
  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);
    if (ios) setActiveTab('ios');
    else if (android) setActiveTab('android');
    else setActiveTab('desktop');
  }, []);

  // Listen for install prompt (Android/Desktop Chrome)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallState('installed');
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for successful install
  useEffect(() => {
    const handler = () => {
      setInstallState('installed');
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    // iOS — show the modal guide
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Android/Desktop with deferred prompt
    if (deferredPrompt) {
      setInstallState('installing');
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstallState('installed');
        } else {
          setInstallState('idle');
        }
      } catch (err) {
        console.error('Install failed:', err);
        setInstallState('idle');
      }
      setDeferredPrompt(null);
      return;
    }

    // Fallback: Android without deferred prompt — try to trigger it
    if (isAndroid) {
      // Show instructions modal for Android
      setActiveTab('android');
      return;
    }

    // Desktop fallback
    setActiveTab('desktop');
  }, [deferredPrompt, isIOS, isAndroid]);

  const renderInstallButton = () => {
    // Already installed
    if (installState === 'installed') {
      return (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-8 py-4 rounded-2xl">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <div className="text-left">
            <span className="font-bold text-green-700 dark:text-green-400 text-sm block">App Installed!</span>
            <span className="text-green-600 dark:text-green-500 text-xs">Open Omix from your home screen</span>
          </div>
        </div>
      );
    }

    // Installing
    if (installState === 'installing') {
      return (
        <div className="flex items-center gap-3 bg-[#ff385c]/10 border border-[#ff385c]/20 px-8 py-4 rounded-2xl">
          <div className="w-6 h-6 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
          <span className="font-bold text-[#ff385c] text-sm">Installing...</span>
        </div>
      );
    }

    // Main install button — always visible
    return (
      <button
        onClick={handleInstall}
        className="group flex items-center gap-3 bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#ff385c]/30 hover:shadow-[#ff385c]/50 transition-all hover:scale-105 active:scale-95"
      >
        <Download className="w-6 h-6 animate-bounce" />
        <span className="text-left">
          <span className="block">Install App</span>
          <span className="text-white/70 text-xs font-medium block">
            {isIOS ? 'See how on iPhone' : isAndroid ? 'Tap to install on Android' : 'Add to your device'}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* iOS Modal */}
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff385c]/5 via-transparent to-purple-500/5 dark:from-[#ff385c]/10 dark:to-purple-500/10" />
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#ff385c] to-[#ff6b8a] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#ff385c]/30 animate-bounce-subtle">
            <span className="text-white font-black text-3xl">O</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
            Install Omix
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8 max-w-xl mx-auto">
            Get the full app experience — faster, smoother, and right on your home screen.
          </p>

          {/* Install Button — ALWAYS VISIBLE */}
          <div className="flex flex-col items-center gap-4">
            {renderInstallButton()}

            {/* Platform hint */}
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {isIOS
                ? '🍎 You\'re on iPhone — tap above for easy install steps'
                : isAndroid
                ? '🤖 You\'re on Android — tap above to install'
                : '💻 You\'re on desktop — tap above to install'}
            </p>
          </div>

          {/* App Store Badges (placeholder) */}
          <div className="flex items-center justify-center gap-3 mt-8 opacity-40">
            <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              App Store
            </div>
            <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Google Play
            </div>
            <div className="text-xs text-zinc-400">Coming Soon</div>
          </div>

          <div className="mt-8 animate-bounce">
            <ArrowDown className="w-5 h-5 text-zinc-300 mx-auto" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-8">Why Install the App?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`${f.bg} rounded-2xl p-5 text-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all hover:shadow-lg group`}>
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Installation Steps */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white text-center mb-2">How to Install</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8 text-sm">Select your device and follow the steps</p>

        {/* Platform Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {Object.entries(STEPS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === key
                  ? `bg-gradient-to-r ${val.color} text-white shadow-lg scale-105`
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <span className="text-lg">{val.icon}</span>
              <span className="hidden sm:inline">{val.title}</span>
              <span className="sm:hidden">{val.icon}</span>
            </button>
          ))}
        </div>

        {/* Steps Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <div className={`bg-gradient-to-r ${STEPS[activeTab].color} p-6 text-white`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{STEPS[activeTab].icon}</span>
              <div>
                <h3 className="text-xl font-black">{STEPS[activeTab].title}</h3>
                <p className="text-white/80 text-sm">3 easy steps</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {STEPS[activeTab].steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${STEPS[activeTab].color} text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  {i + 1}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{step.text}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{step.hint}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Once installed, Omix works like any other app — tap the icon on your home screen to open it instantly!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">Ready to get started?</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">
          Join thousands of buyers on Kericho's cleanest online store.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {installState !== 'installed' && (
            <button
              onClick={handleInstall}
              className="group flex items-center gap-2 bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-[#ff385c]/25 hover:shadow-[#ff385c]/40 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Install App — It's Free
            </button>
          )}
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            Browse Listings Instead
          </a>
        </div>
      </div>
    </div>
  );
}
