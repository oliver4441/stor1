import { useState } from 'react';
import { X, RotateCcw, MoreHorizontal, Sparkles } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';

export default function NiaChat() {
  const {
    isOpen, closeChat, resetChat,
    messages, isTyping, currentChips,
    handleChipClick,
    messagesEndRef, COLORS,
  } = useNiaChat();

  const [showMenu, setShowMenu] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-20 right-4 z-[60] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border animate-in slide-in-from-bottom-4 fade-in duration-200"
      style={{
        backgroundColor: COLORS.bg,
        borderColor: COLORS.border,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})` }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/nia-avatar.jpg"
            alt="Nia"
            className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
          />
          <div>
            <div className="font-bold text-sm flex items-center gap-1.5">
              Nia
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            </div>
            <div className="text-[11px] text-white/70">Omix Store Assistant</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button onClick={closeChat} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {showMenu && (
          <div
            className="absolute top-12 right-4 rounded-xl shadow-xl border py-1 z-10 min-w-[160px]"
            style={{ backgroundColor: COLORS.bg, borderColor: COLORS.border }}
          >
            <button
              onClick={() => { resetChat(); setShowMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:opacity-80"
              style={{ color: COLORS.textBot }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> New conversation
            </button>
            <a
              href="mailto:omixsystems@gmail.com"
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:opacity-80"
              style={{ color: COLORS.textBot }}
              onClick={() => setShowMenu(false)}
            >
              Email support
            </a>
          </div>
        )}
      </div>

      {/* Chat with AI coming soon banner */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0 border-b"
        style={{ backgroundColor: `${COLORS.accent}10`, borderColor: COLORS.border }}
      >
        <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.accent }} />
        <p className="text-xs font-medium" style={{ color: COLORS.textBot }}>
          Chat with AI coming soon. For now, use the quick options below to navigate the store.
        </p>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ backgroundColor: COLORS.bgGray }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'nia' && (
              <img
                src="/nia-avatar.jpg"
                alt="Nia"
                className="w-7 h-7 rounded-full object-cover mr-2 mt-1 flex-shrink-0"
              />
            )}
            <div
              className="max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: msg.sender === 'user' ? COLORS.bubbleUser : COLORS.bubbleBot,
                color: msg.sender === 'user' ? COLORS.textUser : COLORS.textBot,
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: msg.sender === 'nia' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                border: msg.sender === 'nia' ? `1px solid ${COLORS.border}` : 'none',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <img
              src="/nia-avatar.jpg"
              alt="Nia"
              className="w-7 h-7 rounded-full object-cover mr-2 mt-1 flex-shrink-0"
            />
            <div
              className="rounded-2xl rounded-bl-md px-4 py-3"
              style={{ backgroundColor: COLORS.bubbleBot, border: `1px solid ${COLORS.border}` }}
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#a1a1aa', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#a1a1aa', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#a1a1aa', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {currentChips.length > 0 && !isTyping && (
          <div className="flex flex-wrap gap-2 pt-1">
            {currentChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-3.5 py-2 text-xs font-semibold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  border: `1.5px solid ${COLORS.chipBorder}`,
                  color: COLORS.chipText,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.accent;
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = COLORS.chipText;
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
