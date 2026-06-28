import { Download, Share, Plus, ArrowDown, Smartphone, Monitor, CheckCircle2, Star, Zap, Shield, Wifi, X, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../utils/lang';

const STEPS = {
  android: {
    title: 'Android (Chrome)',
    color: 'from-green-500 to-emerald-600',
    iconLabel: 'Android',
    accent: 'text-green-500',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/20',
    steps: [
      { text: 'Tap the menu button (...) in the top-right corner', hint: 'Three vertical dots' },
      { text: 'Tap "Install app" or "Add to Home Screen"', hint: 'Look for the download icon' },
      { text: 'Tap "Install" to confirm', hint: 'The app will be added to your home screen' },
    ],
  },
  ios: {
    title: 'iPhone / iPad (Safari)',
    color: 'from-blue-500 to-indigo-600',
    iconLabel: 'iOS',
    accent: 'text-blue-500',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/20',
    steps: [
      { text: 'Tap the Share button at the bottom of the screen', hint: 'Square with an arrow pointing up' },
      { text: 'Scroll down and tap "Add to Home Screen"', hint: 'Icon with a plus sign' },
      { text: 'Tap "Add" in the top-right corner', hint: 'The Omix icon will appear on your home screen' },
    ],
  },
  desktop: {
    title: 'Desktop (Chrome/Edge)',
    color: 'from-purple-500 to-violet-600',
    iconLabel: 'Desktop',
    accent: 'text-purple-500',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/20',
    steps: [
      { text: 'Look for the install icon in the address bar', hint: 'Right side of the URL bar' },
      { text: 'Click "Install Omix"', hint: 'A prompt will appear' },
      { text: 'Click "Install" to confirm', hint: 'Omix will open in its own window' },
    ],
  },
};

const FEATURES = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Native app performance, loads instantly', color: 'text-amber-500', bg: 'from-amber-500/10 to-amber-600/5', gradient: 'from-amber-500 to-orange-600' },
  { icon: Wifi, title: 'Works Offline', desc: 'Browse listings even without internet', color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-600/5', gradient: 'from-blue-500 to-indigo-600' },
  { icon: Shield, title: 'Secure', desc: 'Your data stays safe on your device', color: 'text-green-500', bg: 'from-green-500/10 to-green-600/5', gradient: 'from-green-500 to-emerald-600' },
  { icon: Smartphone, title: 'Full Screen', desc: 'No browser bar, just pure Omix', color: 'text-purple-500', bg: 'from-purple-500/10 to-purple-600/5', gradient: 'from-purple-500 to-violet-600' },
];

// iOS Install Guide Modal
function IOSInstallModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl max-w-sm w-full shadow-2xl shadow-zinc-900/20 border border-white/50 dark:border-zinc-700/50 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="text-3xl mb-2 font-black text-white/90 relative z-0">iOS</div>
          <h3 className="text-lg font-black relative z-0">Install on iPhone / iPad</h3>
          <p className="text-white/80 text-sm relative z-0">Follow these 3 steps</p>
        </div>

        <div className="p-5 space-y-4">
          {[
            { num: 1, icon: Share, text: 'Tap the Share button', sub: 'At the bottom of the Safari screen', hint: 'Square with arrow up' },
            { num: 2, icon: Plus, text: 'Scroll & tap "Add to Home Screen"', sub: 'Scroll down in the share menu to find it', hint: 'Icon with a plus sign' },
            { num: 3, icon: CheckCircle2, text: 'Tap "Add" to confirm', sub: 'The Omix icon will appear on your home screen!', hint: 'Done!' },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 animate-slide-in" style={{ animationDelay: `${step.num * 100}ms` }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-black flex-shrink-0 shadow-lg shadow-blue-500/20">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{step.text}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{step.sub}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-200/80 dark:bg-zinc-700/80 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${step.num === 3 ? 'text-green-500' : step.num === 2 ? 'text-green-500' : 'text-blue-500'}`} />
                    </div>
                    <span className="text-xs text-zinc-400">{step.hint}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Install() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('android');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installState, setInstallState] = useState('idle');
  const [scrollY, setScrollY] = useState(0);

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

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstallState('installed');
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handler = () => { setInstallState('installed'); setDeferredPrompt(null); };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) { setShowIOSModal(true); return; }
    if (deferredPrompt) {
      setInstallState('installing');
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setInstallState(outcome === 'accepted' ? 'installed' : 'idle');
      } catch { setInstallState('idle'); }
      setDeferredPrompt(null);
      return;
    }
    if (isAndroid) setActiveTab('android');
    else setActiveTab('desktop');
  }, [deferredPrompt, isIOS, isAndroid]);

  const tabData = STEPS[activeTab];

  const renderInstallButton = () => {
    if (installState === 'installed') return (
      <div className="flex items-center gap-3 backdrop-blur-xl bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 px-8 py-4 rounded-2xl shadow-lg shadow-green-500/10 animate-scale-in">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        <div className="text-left">
          <span className="font-bold text-green-700 dark:text-green-400 text-sm block">App Installed!</span>
          <span className="text-green-600 dark:text-green-500 text-xs">Open Omix from your home screen</span>
        </div>
      </div>
    );
    if (installState === 'installing') return (
      <div className="flex items-center gap-3 backdrop-blur-xl bg-[var(--seasonal-primary,#1a5632)]/10 border border-[var(--seasonal-primary,#1a5632)]/20 px-8 py-4 rounded-2xl">
        <div className="w-6 h-6 border-2 border-[var(--seasonal-primary,#1a5632)] border-t-transparent rounded-full animate-spin" />
        <span className="font-bold text-[var(--seasonal-primary,#1a5632)] text-sm">Installing...</span>
      </div>
    );
    return (
      <button onClick={handleInstall} className="group relative flex items-center gap-3 bg-gradient-to-r from-[var(--seasonal-primary,#1a5632)] to-[var(--seasonal-secondary,#14472a)] text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-[var(--seasonal-primary,#1a5632)]/30 hover:shadow-[var(--seasonal-primary,#1a5632)]/50 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Download className="w-6 h-6 relative z-10 group-hover:animate-bounce" />
        <span className="text-left relative z-10">
          <span className="block">Install App</span>
          <span className="text-white/70 text-xs font-medium block">
            {isIOS ? 'See how on iPhone' : isAndroid ? 'Tap to install on Android' : 'Add to your device'}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--seasonal-primary,#1a5632)]/20 via-zinc-50 dark:via-zinc-950 to-transparent dark:from-[var(--seasonal-primary,#1a5632)]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        
        {/* Animated floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--seasonal-primary,#1a5632)]/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl animate-float" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
          {/* Logo with glass container */}
          <div className="relative inline-block mb-8 group">
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--seasonal-primary,#1a5632)]/30 via-purple-500/30 to-blue-500/30 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 animate-pulse-slow" />
            <div className="relative w-24 h-24 rounded-full backdrop-blur-xl bg-white/60 dark:bg-zinc-800/60 border border-white/50 dark:border-zinc-700/50 shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
              <img src="/logo.jpg" alt="Omix Store" className="w-full h-full object-cover" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-[var(--seasonal-primary,#1a5632)] via-purple-500 to-blue-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
              {t('install.title')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
            {t('install.omixIconAppears')}
          </p>

          {/* Glass install panel */}
          <div className="max-w-lg mx-auto">
            <div className="backdrop-blur-xl bg-white/50 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-700/50 rounded-3xl p-8 shadow-2xl shadow-zinc-900/5 space-y-4">
              <div className="flex flex-col items-center gap-4">
                {renderInstallButton()}
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {isIOS ? "You're on iPhone — tap above for easy install steps" : isAndroid ? "You're on Android — tap above to install" : "You're on desktop — tap above to install"}
                </p>
              </div>

              {/* Glass divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200/50 dark:border-zinc-700/50" /></div>
                <div className="relative flex justify-center"><span className="px-3 text-xs text-zinc-400 dark:text-zinc-500 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">or visit on</span></div>
              </div>

              {/* App Store badges */}
              <div className="flex items-center justify-center gap-3">
                <div className="backdrop-blur-sm bg-zinc-900/5 dark:bg-white/5 border border-zinc-200/50 dark:border-zinc-700/50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-900/10 dark:hover:bg-white/10 transition-all cursor-default">
                  <Smartphone className="w-4 h-4" />
                  App Store
                </div>
                <div className="backdrop-blur-sm bg-zinc-900/5 dark:bg-white/5 border border-zinc-200/50 dark:border-zinc-700/50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-900/10 dark:hover:bg-white/10 transition-all cursor-default">
                  <Smartphone className="w-4 h-4" />
                  Google Play
                </div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider bg-zinc-100/50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg backdrop-blur-sm">Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-zinc-300 dark:border-zinc-700 flex justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--seasonal-primary,#1a5632)]/5 to-transparent dark:via-[var(--seasonal-primary,#1a5632)]/[0.02]" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[var(--seasonal-primary,#1a5632)] uppercase tracking-[0.2em] bg-[var(--seasonal-primary,#1a5632)]/10 dark:bg-[var(--seasonal-primary,#1a5632)]/20 px-4 py-1.5 rounded-full">Why Install</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mt-3">Install the App</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">Everything you need, right on your home screen</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group relative animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  {/* Glass card */}
                  <div className="relative h-full backdrop-blur-xl bg-white/50 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-700/50 rounded-2xl p-6 text-center shadow-xl shadow-zinc-900/5 hover:shadow-2xl hover:shadow-zinc-900/10 transition-all duration-500 hover:-translate-y-2 hover:border-[var(--seasonal-primary,#1a5632)]/20">
                    {/* Icon gradient glow */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.bg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                      <Icon className={`w-7 h-7 ${f.color}`} />
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-1.5">{f.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                  </div>
                  {/* Glow on hover */}
                  <div className={`absolute -inset-2 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-3xl -z-10`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-purple-500 uppercase tracking-[0.2em] bg-purple-500/10 dark:bg-purple-500/20 px-4 py-1.5 rounded-full">Steps</span>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mt-3">How to Install</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Select your device and follow the steps</p>
          </div>

          {/* Platform Tabs */}
          <div className="flex justify-center gap-3 mb-10">
            {Object.entries(STEPS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  activeTab === key
                    ? `bg-gradient-to-r ${val.color} text-white shadow-xl ${val.glow} scale-105`
                    : 'backdrop-blur-xl bg-white/50 dark:bg-zinc-900/50 border border-white/50 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-lg'
                }`}
              >
                {activeTab === key && <div className="absolute -inset-1 bg-gradient-to-r ${val.color} opacity-20 blur-lg rounded-2xl" />}
                <span className="text-lg font-bold relative">{val.iconLabel}</span>
                <span className="hidden sm:inline relative">{val.title}</span>
              </button>
            ))}
          </div>

          {/* Steps Card — Glassmorphism */}
          <div className="relative group">
            {/* Background glow */}
            <div className={`absolute -inset-4 bg-gradient-to-r ${STEPS[activeTab].color} opacity-5 group-hover:opacity-10 blur-3xl rounded-3xl transition-opacity duration-700`} />

            <div className="relative backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60 border border-white/60 dark:border-zinc-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-zinc-900/5">
              {/* Header gradient */}
              <div className={`bg-gradient-to-r ${STEPS[activeTab].color} p-8 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
                <div className="flex items-center gap-4 relative z-0">
                  <div className="text-4xl font-black text-white/90">{STEPS[activeTab].iconLabel}</div>
                  <div>
                    <h3 className="text-2xl font-black">{STEPS[activeTab].title}</h3>
                    <p className="text-white/80 text-sm mt-0.5">3 easy steps</p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="p-6 md:p-8 space-y-4">
                {STEPS[activeTab].steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/30 hover:bg-white/80 dark:hover:bg-zinc-800/60 transition-all duration-300 group/step hover:shadow-md animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${STEPS[activeTab].color} text-white flex items-center justify-center text-lg font-black flex-shrink-0 shadow-lg group-hover/step:scale-110 transition-transform duration-300`}>
                      {i + 1}
                    </div>
                    <div className="pt-0.5 flex-1">
                      <p className="font-bold text-zinc-900 dark:text-white">{step.text}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{step.hint}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover/step:translate-x-1 transition-transform flex-shrink-0 mt-1 ${STEPS[activeTab].accent}`} />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="backdrop-blur-xl bg-green-500/5 border border-green-500/20 rounded-2xl p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-700 dark:text-green-400 text-sm">You're all set!</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Once installed, Omix works like any other app — tap the icon on your home screen to open it instantly!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--seasonal-primary,#1a5632)]/10 via-transparent to-transparent dark:from-[var(--seasonal-primary,#1a5632)]/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--seasonal-primary,#1a5632)]/10 via-transparent to-transparent dark:from-[var(--seasonal-primary,#1a5632)]/5" />

        {/* Floating orbs */}
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-[var(--seasonal-primary,#1a5632)]/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl animate-float-slow" />

        <div className="max-w-2xl mx-auto px-4 text-center relative">
          <div className="backdrop-blur-2xl bg-white/50 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-700/50 rounded-3xl p-10 md:p-12 shadow-2xl shadow-zinc-900/5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--seasonal-primary,#1a5632)] to-[var(--seasonal-secondary,#14472a)] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[var(--seasonal-primary,#1a5632)]/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-3">Ready to get started?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
              Join thousands of buyers on Kericho's cleanest online store.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {installState !== 'installed' && (
                <button onClick={handleInstall} className="group relative flex items-center gap-2 bg-gradient-to-r from-[var(--seasonal-primary,#1a5632)] to-[var(--seasonal-secondary,#14472a)] text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-[var(--seasonal-primary,#1a5632)]/25 hover:shadow-[var(--seasonal-primary,#1a5632)]/40 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Download className="w-5 h-5 relative z-10 group-hover:animate-bounce" />
                  <span className="relative z-10">Install App — It's Free</span>
                </button>
              )}
              <a href="/" className="group flex items-center gap-2 px-6 py-4 rounded-2xl font-bold backdrop-blur-xl bg-white/50 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:shadow-lg transition-all">
                Browse Listings Instead
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
