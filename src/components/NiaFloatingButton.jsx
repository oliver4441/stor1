import { X } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';
import { useAuth } from '../context/AuthContext';

export default function NiaFloatingButton() {
  const { isOpen, openChat, closeChat, COLORS } = useNiaChat();

  // ── Offline check removed ──

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-28 sm:right-6 z-[55] flex flex-col items-center gap-1.5">
      {/* "Ask Nia" tag above the button */}
      {!isOpen && (
        <span
          className="text-[10px] font-black text-white px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap"
          style={{ backgroundColor: COLORS.accent }}
        >
          Chat with Nia
        </span>
      )}

      {/* Main floating action button */}
      <button
        onClick={isOpen ? closeChat : openChat}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: COLORS.accent }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <img
            src="/nia-avatar.svg"
            alt="Nia"
            className="w-9 h-9 rounded-full"
          />
        )}
      </button>
    </div>
  );
}
