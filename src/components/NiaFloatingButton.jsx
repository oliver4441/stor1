import { X } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';

export default function NiaFloatingButton() {
  const { isOpen, openChat, closeChat, hasOpened, COLORS } = useNiaChat();

  return (
    <button
      onClick={() => isOpen ? closeChat() : openChat()}
      className={`fixed bottom-20 right-4 z-[55] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden ${
        isOpen ? 'hover:opacity-90' : 'hover:shadow-xl'
      }`}
      style={{
        backgroundColor: isOpen ? '#52525b' : 'transparent',
        boxShadow: isOpen ? 'none' : `0 10px 25px -5px ${COLORS.accent}40`,
      }}
      aria-label={isOpen ? 'Close chat' : 'Ask Nia'}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <>
          <img
            src="/nia-avatar.jpg"
            alt="Nia"
            className="w-full h-full object-cover"
          />
          {/* Pulse ring for first-time attention */}
          {!hasOpened && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: COLORS.accent }}
            />
          )}
        </>
      )}
    </button>
  );
}
