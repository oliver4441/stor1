import { Download, Share, Plus, ArrowDown, Smartphone, Monitor, ChevronDown, CheckCircle2, Star, Zap, Shield, Wifi } from 'lucide-react';
import { useState } from 'react';

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

export default function Install() {
  const [activeTab, setActiveTab] = useState('android');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Detect platform for default tab
  useState(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isIOS) setActiveTab('ios');
    else if (isAndroid) setActiveTab('android');
    else setActiveTab('desktop');
  });

  // Listen for install prompt
  useState(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
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

          {/* Install / Download Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="group flex items-center gap-3 bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#ff385c]/30 hover:shadow-[#ff385c]/50 transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-6 h-6 animate-bounce" />
                Download Now
                <span className="text-white/70 text-sm font-medium">Free • No account needed</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-8 py-4 rounded-2xl text-zinc-500 dark:text-zinc-400">
                <Download className="w-6 h-6" />
                <span className="font-bold text-sm">Follow the steps below to install</span>
              </div>
            )}
          </div>

          {/* App Store Badges (placeholder) */}
          <div className="flex items-center justify-center gap-3 mt-6 opacity-40">
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
          Join thousands of buyers and sellers on Kericho's cleanest marketplace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="group flex items-center gap-2 bg-gradient-to-r from-[#ff385c] to-[#e03150] text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-[#ff385c]/25 hover:shadow-[#ff385c]/40 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Download Now — It's Free
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
