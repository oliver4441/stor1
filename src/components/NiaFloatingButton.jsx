import { X } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';
import { useAuth } from '../context/AuthContext';

export default function NiaFloatingButton() {
  const { isOpen, openChat, closeChat, COLORS } = useNiaChat();

  return (
    <div className="fixed bottom-28 right-4 sm:bottom-32 sm:right-6 z-[55] flex flex-col items-center gap-1.5">
      {/* "Ask Nia" tag above the button */}
      {!isOpen && (
        <span
          className="text-[10px] font-black text-white px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap"
          style={{ backgroundColor: COLORS.accent }}
        >
          Ask Nia
        </span>
      )}
      {/* Button */}
      <button
        onClick={() => isOpen ? closeChat() : openChat()}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
        style={{
          backgroundColor: isOpen ? '#3f3f46' : COLORS.accent,
          boxShadow: `0 8px 20px -4px ${COLORS.accent}40`,
        }}
        aria-label={isOpen ? 'Close chat' : 'Ask Nia'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <img
            src="/nia-avatar.jpg"
            alt="Nia"
            className="w-full h-full object-cover"
          />
        )}
      </button>
    </div>
  );
}
