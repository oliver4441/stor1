import { X } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';

export default function NiaOnboarding() {
  const { showOnboarding, dismissOnboarding, openChat, COLORS } = useNiaChat();

  if (!showOnboarding) return null;

  const handleStart = () => {
    dismissOnboarding();
    openChat();
  };

  return (
    <div className="fixed bottom-56 right-4 z-[58] w-[320px] max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
        }}
      >
        <button
          onClick={dismissOnboarding}
          className="absolute top-3 right-3 p-1 rounded-full hover:opacity-70 transition-colors z-10"
          style={{ color: '#a1a1aa' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="px-5 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <img
              src="/nia-avatar.jpg"
              alt="Nia"
              className="w-7 h-7 rounded-full object-cover"
            />
            <span className="font-bold text-sm">Meet Nia</span>
          </div>
          <p className="text-white/80 text-xs">Your Omix Store assistant</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm mb-4 leading-relaxed" style={{ color: COLORS.textBot }}>
            Hi! I'm <strong>Nia</strong> 🤖 — your AI-powered assistant. I can help you find products, track orders, and answer any question about Omix Store.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.accent }}
            >
              Ask a question
            </button>
            <button
              onClick={dismissOnboarding}
              className="px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#a1a1aa' }}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
