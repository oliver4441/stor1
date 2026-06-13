import { MessageCircle, X } from 'lucide-react';
import { useNiaChat } from '../context/NiaChatContext';
import { useState } from 'react';

export default function NiaContextualTrigger({ page, className = '' }) {
  const { openChat, FLOWS, COLORS } = useNiaChat();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = {
    listing: {
      message: "Need help with this listing? Ask Nia",
      flow: FLOWS.listingHelp,
    },
    checkout: {
      message: "Stuck at checkout? Ask Nia",
      flow: FLOWS.checkoutHelp,
    },
    emptyCart: {
      message: "Nia can help you find items nearby",
      flow: FLOWS.emptyCart,
    },
  }[page];

  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${COLORS.accent}08, ${COLORS.accent}15)`,
        border: `1px solid ${COLORS.accent}30`,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${COLORS.accent}15` }}
      >
        <MessageCircle className="w-4 h-4" style={{ color: COLORS.accent }} />
      </div>
      <p className="text-sm flex-1" style={{ color: COLORS.textBot }}>{config.message}</p>
      <button
        onClick={() => openChat(config.flow)}
        className="px-3 py-1.5 text-white text-xs font-bold rounded-full transition-opacity hover:opacity-90 flex-shrink-0"
        style={{ backgroundColor: COLORS.accent }}
      >
        Ask Nia
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 flex-shrink-0 hover:opacity-70"
        style={{ color: '#a1a1aa' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
