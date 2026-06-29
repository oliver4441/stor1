import { useState, useRef, useEffect } from 'react';
import { X, Send, RotateCcw } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../utils/lang';

const QUICK_ACTIONS_EN = ['Browse products', 'Track my order', 'How it works', 'Contact support'];
const QUICK_ACTIONS_SW = ['Ona bidhaa', 'Fuatilia oda', 'Jinsi inavyofanya kazi', 'Wasiliana nasi'];

export default function NiaChat() {
  const {
    isOpen, closeChat, resetChat,
    messages, isTyping,
    handleUserInput, handleChipClick,
    messagesEndRef, COLORS,
  } = useNiaChat();
  const { user } = useAuth();
  const { lang } = useLang();

  if (!isOpen) return null;

  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);
  const isSwahili = lang === 'sw';
  const QUICK_ACTIONS = isSwahili ? QUICK_ACTIONS_SW : QUICK_ACTIONS_EN;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputText.trim() || isTyping) return;
    handleUserInput(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed bottom-44 right-4 sm:bottom-48 sm:right-6 z-[60] w-[400px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border transition-all duration-300 ease-out origin-bottom-right"
      style={{
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        maxHeight: isOpen ? 'min(640px, calc(100vh - 8rem))' : '0px',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <img src="/nia-avatar.jpg" alt="Nia" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <h2 className="text-white font-semibold text-sm">Nia</h2>
            <span className="text-[10px] text-emerald-400 font-medium">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetChat}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Reset chat"
            title="Reset chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={closeChat}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'nia' && (
              <img src="/nia-avatar.jpg" alt="Nia" className="w-6 h-6 rounded-full object-cover mr-2 mt-1 flex-shrink-0" />
            )}
            <div
              className="max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: msg.sender === 'user' ? COLORS.accent : '#27272a',
                color: '#ffffff',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <img src="/nia-avatar.jpg" alt="Nia" className="w-6 h-6 rounded-full object-cover mr-2 mt-1 flex-shrink-0" />
            <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-zinc-800">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full animate-bounce bg-zinc-500" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce bg-zinc-500" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce bg-zinc-500" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Pills */}
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleChipClick(action)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 pt-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSwahili ? "Andika ujumbe..." : "Type a message..."}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: COLORS.accent }}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
