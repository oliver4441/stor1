import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const NiaChatContext = createContext(null);

// ── Design Tokens (committed, not ambiguous) ──────────────────────
const COLORS = {
  accent: '#ff385c',
  accentDark: '#e03150',
  bg: '#ffffff',
  bgDark: '#18181b',
  bgGray: '#f9fafb',
  bgGrayDark: '#18181b',
  bubbleBot: '#ffffff',
  bubbleBotDark: '#27272a',
  bubbleUser: '#ff385c',
  textBot: '#27272a',
  textBotDark: '#e4e4e7',
  textUser: '#ffffff',
  border: '#e4e4e7',
  borderDark: '#3f3f46',
  chipBorder: 'rgba(255,56,92,0.3)',
  chipText: '#ff385c',
};

// ── Conversation Flows ─────────────────────────────────────────────
// Each flow has: id, message, chips (dynamic based on context), actions
const FLOWS = {
  greeting: {
    id: 'greeting',
    message: "Hi, I'm Nia 👋\nI'm your Omix Store assistant. I can help you find products, track orders, and answer questions about buying and selling.\n\nWhat would you like to do?",
    chips: ['Browse products', 'Track my order', 'How it works', 'Talk to support'],
  },
  browse: {
    id: 'browse',
    message: "You can browse all products on the home page. Filter by category or search for specific items.\n\nWant me to take you there?",
    chips: ['Go to home', 'Search products', 'Browse categories'],
  },
  track: {
    id: 'track',
    message: "I can help you track your order! 🕵️\n\nYou'll need your order ID — find it in your account dashboard or confirmation email.\n\nWant to go to the track order page?",
    chips: ['Track my order', 'Go to my account', 'I need more help'],
  },
  howItWorks: {
    id: 'howItWorks',
    message: "Here's how Omix Store works:\n\n1️⃣ Browse products\n2️⃣ Add to cart\n3️⃣ Checkout with M-Pesa\n4️⃣ Get delivered!\n\nWhat would you like to know more about?",
    chips: ['How to pay', 'Delivery info', 'Return policy'],
  },
  payment: {
    id: 'payment',
    message: "We accept M-Pesa via Paystack STK Push.\n\nAt checkout, enter your phone number. You'll receive a payment prompt on your phone within 30 seconds.\n\nIt's secure and instant! 🔒",
    chips: ['Browse products', 'Track my order', 'I need help'],
  },
  delivery: {
    id: 'delivery',
    message: "We deliver within Kericho and surrounding areas.\n\n📦 CBD: Same day\n🏙️ Kericho town: 1-2 days\n🚚 Outside Kericho: 2-3 days\n\nNeed anything else?",
    chips: ['Browse products', 'Track my order', 'Contact support'],
  },
  returnPolicy: {
    id: 'returnPolicy',
    message: "Our return policy:\n\n• Electronics: 7 days if defective\n• Clothing: 3 days with tags\n• Furniture: No returns (inspect on delivery)\n\nFor issues, contact support.",
    chips: ['Contact support', 'Browse products', 'Track my order'],
  },
  support: {
    id: 'support',
    message: "I'll connect you to our support team.\n\n📧 omixsystems@gmail.com\n📱 +254 768 213 649\n\nOr use the contact button at the bottom right of the page.\n\nIs there anything specific I can help with first?",
    chips: ['Browse products', 'Track my order', 'Close'],
  },
  listingHelp: {
    id: 'listingHelp',
    message: "Here's what I can help with on this page:\n\n🛒 How to buy this item\n📦 Delivery information\n💳 Payment options\n📞 Contact support\n\nWhat do you need?",
    chips: ['How to buy', 'Delivery info', 'Payment options', 'Contact support'],
  },
  checkoutHelp: {
    id: 'checkoutHelp',
    message: "Having trouble at checkout? Let's fix it:\n\n✅ Make sure you're logged in\n✅ Phone number is correct (for M-Pesa)\n✅ Wait 30 seconds for the STK push\n\nWhat's the issue?",
    chips: ['Payment not working', 'Edit my order', 'Contact support'],
  },
  paymentIssue: {
    id: 'paymentIssue',
    message: "Sorry about that! Let's troubleshoot:\n\n1️⃣ Check your internet connection\n2️⃣ Verify your phone number\n3️⃣ Wait 30 seconds for the STK push\n4️⃣ Check your phone for the M-Pesa prompt\n\nStill not working? I'd recommend contacting support directly.",
    chips: ['Try again', 'Contact support', 'Browse products'],
  },
  emptyCart: {
    id: 'emptyCart',
    message: "Your cart is empty! 🛒\n\nI can help you find great items. What are you looking for?",
    chips: ['Browse products', 'Search items', 'Featured items'],
  },
  honestUnknown: {
    id: 'honestUnknown',
    message: "I'm not sure I understand that completely. Here's what I can help with:",
    chips: ['Browse products', 'Track my order', 'How it works', 'Contact support'],
  },
};

// ── Chip-to-Flow Mapping ──────────────────────────────────────────
const chipToFlow = {
  'Browse products': FLOWS.browse,
  'Track my order': FLOWS.track,
  'How it works': FLOWS.howItWorks,
  'Talk to support': FLOWS.support,
  'Go to home': null, // action: navigate
  'Search products': null, // action: navigate
  'Browse categories': null, // action: navigate
  'Go to my account': null, // action: navigate
  'I need more help': FLOWS.support,
  'How to pay': FLOWS.payment,
  'Delivery info': FLOWS.delivery,
  'Return policy': FLOWS.returnPolicy,
  'Contact support': FLOWS.support,
  'How to buy': FLOWS.checkoutHelp,
  'Payment options': FLOWS.payment,
  'Payment not working': FLOWS.paymentIssue,
  'Edit my order': FLOWS.checkoutHelp,
  'Try again': FLOWS.checkoutHelp,
  'Search items': null, // action: navigate
  'Featured items': null, // action: navigate
  'Close': null, // action: close chat
};

// ── Keyword Matching (fuzzy, not exact) ───────────────────────────
const matchFlow = (text) => {
  const lower = text.toLowerCase();
  if (lower.match(/sell|list|post|upload/)) return null; // no sell flow for customers
  if (lower.match(/track|order|where|status/)) return FLOWS.track;
  if (lower.match(/how|work|use|app/)) return FLOWS.howItWorks;
  if (lower.match(/pay|mpesa|pesa|payment|money/)) return FLOWS.payment;
  if (lower.match(/deliver|ship|arrive|when/)) return FLOWS.delivery;
  if (lower.match(/return|refund|exchange/)) return FLOWS.returnPolicy;
  if (lower.match(/support|help|contact|human|agent/)) return FLOWS.support;
  if (lower.match(/browse|shop|buy|find|search|look/)) return FLOWS.browse;
  if (lower.match(/checkout|cart|bag/)) return FLOWS.checkoutHelp;
  return null; // triggers honestUnknown
};

// ── Context-Aware Chip Generator ──────────────────────────────────
const getContextualChips = (baseChips, pageContext, conversationHistory) => {
  // Dynamic chips based on where user is and what they've been doing
  const chips = [...baseChips];
  
  // If on listing page, add listing-specific chips
  if (pageContext === 'listing') {
    if (!chips.includes('How to buy')) chips.push('How to buy');
  }
  
  // If on checkout page, add checkout-specific chips
  if (pageContext === 'checkout') {
    if (!chips.includes('Payment not working')) chips.push('Payment not working');
  }
  
  // If user has been asking about orders repeatedly, prioritize support
  const recentOrderQueries = conversationHistory.filter(
    m => m.sender === 'user' && m.text.match(/track|order|where/i)
  ).length;
  if (recentOrderQueries >= 2 && !chips.includes('Contact support')) {
    chips.unshift('Contact support');
  }
  
  return chips.slice(0, 5); // max 5 chips
};

// ── Nia AI Chat (via API server) ────────────────────────────────────
const NIA_PROXY_URL = 'https://stor1-api.onrender.com/api/nia/chat';

const callNiaAI = async (messages) => {
  try {
    const response = await fetch(NIA_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(m => ({
          role: m.sender === 'nia' ? 'assistant' : 'user',
          content: m.text,
        })),
      }),
    });

    if (!response.ok) {
      console.log('[Nia] Proxy error:', response.status);
      return null;
    }

    const data = await response.json();
    return data?.content?.trim() || null;
  } catch (err) {
    console.log('[Nia] Proxy call failed:', err.message);
    return null;
  }
};

// ── Provider ──────────────────────────────────────────────────────
export function NiaChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChips, setCurrentChips] = useState([]);
  const [hasOpened, setHasOpened] = useState(() => {
    try { return localStorage.getItem('nia-has-opened') === 'true'; } catch { return false; }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return localStorage.getItem('nia-onboarding-shown') !== 'true'; } catch { return true; }
  });
  const [pageContext, setPageContext] = useState('home');
  const [useAI, setUseAI] = useState(() => {
    try { return localStorage.getItem('nia-use-ai') === 'true'; } catch { return false; }
  });
  const messagesEndRef = useRef(null);
  const conversationHistoryRef = useRef([]);

  // Load cross-session memory
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nia-conversation');
      if (saved) {
        const parsed = JSON.parse(saved);
        conversationHistoryRef.current = parsed.history || [];
      }
    } catch {}
  }, []);

  // Save conversation for cross-session memory
  const saveConversation = useCallback(() => {
    try {
      localStorage.setItem('nia-conversation', JSON.stringify({
        history: conversationHistoryRef.current.slice(-20), // last 20 messages
        lastVisit: Date.now(),
      }));
    } catch {}
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const addBotMessage = useCallback((text, chips = [], delay = 0) => {
    if (delay > 0) setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'nia', text, timestamp: new Date() }]);
      setCurrentChips(chips);
      setIsTyping(false);
      scrollToBottom();
    }, delay);
  }, [scrollToBottom]);

  const openChat = useCallback((initialFlow = null) => {
    setIsOpen(true);
    setHasOpened(true);
    try { localStorage.setItem('nia-has-opened', 'true'); } catch {}
    
    if (messages.length === 0 || initialFlow) {
      const flow = initialFlow || FLOWS.greeting;
      const contextualChips = getContextualChips(flow.chips, pageContext, conversationHistoryRef.current);
      addBotMessage(flow.message, contextualChips, 0); // no delay for rule-based
    }
  }, [messages.length, addBotMessage, pageContext]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    saveConversation();
  }, [saveConversation]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentChips([]);
    conversationHistoryRef.current = [];
    try { localStorage.removeItem('nia-conversation'); } catch {}
    addBotMessage(FLOWS.greeting.message, FLOWS.greeting.chips, 0);
  }, [addBotMessage]);

  const handleChipClick = useCallback((chip) => {
    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text: chip, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    conversationHistoryRef.current.push(userMsg);
    setCurrentChips([]);

    // Handle special actions
    if (chip === 'Close') { closeChat(); return; }
    if (chip === 'Go to home' || chip === 'Browse products' || chip === 'Search products' || chip === 'Browse categories' || chip === 'Featured items' || chip === 'Search items') {
      window.location.href = '/'; return;
    }
    if (chip === 'Track my order') { window.location.href = '/track-order'; return; }
    if (chip === 'Go to my account') { window.location.href = '/account'; return; }
    if (chip === 'How it works') { window.location.href = '/how-it-works'; return; }

    const flow = chipToFlow[chip];
    if (flow) {
      const contextualChips = getContextualChips(flow.chips, pageContext, conversationHistoryRef.current);
      addBotMessage(flow.message, contextualChips, 0);
    } else {
      addBotMessage(FLOWS.honestUnknown.message, FLOWS.honestUnknown.chips, 0);
    }
  }, [addBotMessage, closeChat, pageContext]);

  const handleUserMessage = useCallback(async (text) => {
    const userMsg = { id: Date.now(), sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    conversationHistoryRef.current.push(userMsg);
    setCurrentChips([]);

    // Try rule-based matching first (instant)
    const flow = matchFlow(text);
    if (flow) {
      const contextualChips = getContextualChips(flow.chips, pageContext, conversationHistoryRef.current);
      addBotMessage(flow.message, contextualChips, 0);
      return;
    }

    // Try AI for unmatched queries (via server proxy)
    setIsTyping(true);
    console.log('[Nia] Calling Nia AI proxy...');
    const aiResponse = await callNiaAI(conversationHistoryRef.current.slice(-10));
    setIsTyping(false);
    console.log('[Nia] AI response:', aiResponse ? 'received' : 'null');
    if (aiResponse) {
      const botMsg = { id: Date.now(), sender: 'nia', text: aiResponse, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
      conversationHistoryRef.current.push(botMsg);
      setCurrentChips(FLOWS.honestUnknown.chips);
      scrollToBottom();
      return;
    }

    // Fallback: honest uncertainty
    addBotMessage(FLOWS.honestUnknown.message, FLOWS.honestUnknown.chips, 0);
  }, [addBotMessage, pageContext, scrollToBottom]);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try { localStorage.setItem('nia-onboarding-shown', 'true'); } catch {}
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const value = {
    isOpen, openChat, closeChat, resetChat,
    messages, isTyping, currentChips,
    handleChipClick, handleUserMessage,
    hasOpened, showOnboarding, dismissOnboarding,
    pageContext, setPageContext,
    useAI, setUseAI,
    messagesEndRef,
    FLOWS, COLORS,
  };

  return (
    <NiaChatContext.Provider value={value}>
      {children}
    </NiaChatContext.Provider>
  );
}

export function useNiaChat() {
  const ctx = useContext(NiaChatContext);
  if (!ctx) throw new Error('useNiaChat must be used within NiaChatProvider');
  return ctx;
}
