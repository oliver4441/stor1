import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { niaChat, getGreeting, getSwahiliGreeting } from '../utils/nia-ai';
import { useLang } from '../utils/lang';

const NiaChatContext = createContext(null);

// ── Design Tokens ────────────────────────────────────────────────
const COLORS = {
  accent: '#1a5632',
  accentDark: '#14472a',
  bubbleUser: '#1a5632',
  bgGray: '#f9fafb',
  bgGrayDark: '#18181b',
  bubbleBot: '#ffffff',
  bubbleBotDark: '#27272a',
  chipText: '#1a5632',
  textBot: '#27272a',
  textBotDark: '#e4e4e7',
  textUser: '#ffffff',
  border: '#e4e4e7',
  borderDark: '#3f3f46',
  chipBorder: 'rgba(26,86,50,0.3)',
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
  const [userName, setUserName] = useState('');
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
    // Try to get user name from auth
    import('../utils/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '');
        }
      });
    }).catch(() => {});
  }, []);

  const saveConversation = useCallback(() => {
    try {
      localStorage.setItem('nia-conversation', JSON.stringify({
        history: conversationHistoryRef.current.slice(-20),
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
      conversationHistoryRef.current.push({ sender: 'nia', text, isChipResponse: false, timestamp: new Date() });
      setCurrentChips(chips);
      setIsTyping(false);
      scrollToBottom();
      
      // Show push notification if chat is closed and Nia sends a message
      if (!isOpen && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('Nia says', {
            body: text.length > 120 ? text.substring(0, 120) + '...' : text,
            icon: '/nia-avatar.jpg',
            badge: '/logo.jpg',
            tag: 'nia-nudge',
            requireInteraction: false,
          });
          notification.onclick = () => {
            window.focus();
            // Open Nia chat
            setIsOpen(true);
          };
        } catch {}
      }
    }, delay);
  }, [scrollToBottom, isOpen, setIsOpen]);

  const { lang } = useLang();

  const openChat = useCallback(() => {
    setIsOpen(true);
    setHasOpened(true);
    try { localStorage.setItem('nia-has-opened', 'true'); } catch {}

    if (messages.length === 0) {
      const greeting = lang === 'sw' ? getSwahiliGreeting(userName) : getGreeting(userName);
      conversationHistoryRef.current.push({ sender: 'nia', text: greeting.text, isChipResponse: false, timestamp: new Date() });
      addBotMessage(greeting.text, greeting.chips, 0);
    }
  }, [messages.length, addBotMessage, userName, lang]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    saveConversation();
  }, [saveConversation]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentChips([]);
    conversationHistoryRef.current = [];
    try { localStorage.removeItem('nia-conversation'); } catch {}
    const greeting = getGreeting(userName);
    addBotMessage(greeting.text, greeting.chips, 0);
  }, [addBotMessage, userName]);

  const handleUserInput = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    conversationHistoryRef.current.push(userMsg);
    setCurrentChips([]);
    setIsTyping(true);

    // Get user ID from auth for personalized responses
    let userId = '';
    try {
      const { supabase } = await import('../utils/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || '';
    } catch {}

    // Get page context for better responses
    const pageContext = document.title || window.location.pathname;

    // Get cart items from localStorage for cart-aware responses
    let cartItems = [];
    try {
      const cartData = localStorage.getItem('omix_cart') || localStorage.getItem('cart');
      if (cartData) cartItems = JSON.parse(cartData);
    } catch {}

    const response = await niaChat(conversationHistoryRef.current, text.trim(), userId, pageContext, cartItems);
    addBotMessage(response.text, response.chips, 300);
  }, [addBotMessage]);

  const handleChipClick = useCallback((chip) => {
    const userMsg = { id: Date.now(), sender: 'user', text: chip, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    conversationHistoryRef.current.push(userMsg);
    setCurrentChips([]);

    if (chip === 'Close') { closeChat(); return; }
    if (chip === 'Go to home' || chip === 'Browse products' || chip === 'Search products' || chip === 'Browse categories' || chip === 'Featured items' || chip === 'Search items') { window.location.href = '/'; return; }
    if (chip === 'Track my order') { window.location.href = '/track-order'; return; }
    if (chip === 'Go to my account') { window.location.href = '/account'; return; }
    if (chip === 'Go to wishlist') { window.location.href = '/wishlist'; return; }
    if (chip === 'How it works') { window.location.href = '/how-it-works'; return; }
    if (chip === 'Contact support') {
      addBotMessage("Here's how to reach us:\n\n📧 omixsystems@gmail.com\n📞 +254 768 213 649\n\nOr use the contact button at the bottom right. Is there anything specific I can help with first?", ['Browse products', 'Track my order', 'Close'], 0);
      return;
    }
    handleUserInput(chip);
  }, [addBotMessage, closeChat, handleUserInput]);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try { localStorage.setItem('nia-onboarding-shown', 'true'); } catch {}
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  const value = {
    isOpen, openChat, closeChat, resetChat,
    messages, isTyping, currentChips,
    handleChipClick, handleUserInput,
    hasOpened, showOnboarding, dismissOnboarding,
    messagesEndRef,
    COLORS,
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
