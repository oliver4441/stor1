import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../utils/supabase';

const SENDER_NAME_CACHE = {};

async function fetchSenderName(userId) {
  if (SENDER_NAME_CACHE[userId]) return SENDER_NAME_CACHE[userId];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();
    const name = error ? null : (data?.full_name || 'Unknown User');
    SENDER_NAME_CACHE[userId] = name;
    return name;
  } catch {
    return 'Unknown User';
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isYesterday) return `Yesterday ${time}`;

  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

function Skeleton() {
  return (
    <div className="flex-1 overflow-hidden p-4 space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => {
        const isRight = i % 2 === 0;
        return (
          <div key={i} className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-2xl h-10 ${isRight ? 'w-2/3' : 'w-1/2'}`}
              style={{ backgroundColor: isRight ? '#0d9488' : '#27272a' }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function ChatWindow({ conversationId, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [senderNames, setSenderNames] = useState({});
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const channelRef = useRef(null);
  const senderNamesRef = useRef({});
  const initialLoadDone = useRef(false);

  // --- Fetch messages ---
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      setMessages(data || []);

      // Fetch sender names for unique user IDs
      const userIds = [...new Set((data || []).map((m) => m.sender_id))];
      const nameEntries = await Promise.all(
        userIds.map(async (uid) => [uid, await fetchSenderName(uid)])
      );
      setSenderNames(Object.fromEntries(nameEntries));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [conversationId]);

  // --- Mark messages as read ---
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    try {
      // Try server API first
      const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';
      const { error: fetchErr } = await supabase.auth.getSession();
      if (fetchErr) throw fetchErr;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (token) {
        try {
          await fetch(`${API_BASE}/api/conversations/${conversationId}/read`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          return;
        } catch {
          // Fall through to direct supabase update
        }
      }

      // Direct supabase update as fallback
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [conversationId, currentUserId]);

  // Sync ref with state
  useEffect(() => {
    senderNamesRef.current = senderNames;
  }, [senderNames]);

  // --- Subscribe to new messages ---
  useEffect(() => {
    if (!conversationId) return;

    const channelName = `messages:conversation_id=eq.${conversationId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Fetch sender name if not known (use ref to avoid stale closures)
          if (!senderNamesRef.current[newMsg.sender_id]) {
            const name = await fetchSenderName(newMsg.sender_id);
            setSenderNames((prev) => ({ ...prev, [newMsg.sender_id]: name }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId]);

  // --- Initial load ---
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    initialLoadDone.current = false;
    fetchMessages();
  }, [fetchMessages]);

  // --- Mark as read on conversation load ---
  useEffect(() => {
    if (!loading && conversationId && currentUserId) {
      markAsRead();
    }
  }, [loading, conversationId, currentUserId, markAsRead]);

  // --- Auto-scroll to bottom ---
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // --- Send message ---
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !conversationId || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: text,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Empty state ---
  if (!loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shrink-0">
          <button
            onClick={onBack}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <Send className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Start a conversation
          </h3>
          <p className="text-sm text-zinc-400 max-w-xs">
            Send a message to get the conversation started.
          </p>
        </div>

        {/* Input bar */}
        <div className="shrink-0 p-3 border-t border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-zinc-500 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--seasonal-primary, #0d9488)' }}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide"
      >
        {loading && <Skeleton />}

        {!loading &&
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender name (shown for others, not for own messages) */}
                  {!isMine && senderNames[msg.sender_id] && (
                    <span className="text-[11px] text-zinc-500 font-medium mb-1 px-1">
                      {senderNames[msg.sender_id]}
                    </span>
                  )}
                  {/* Bubble */}
                  <div
                    className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
                    style={{
                      backgroundColor: isMine
                        ? 'var(--seasonal-primary, #0d9488)'
                        : '#27272a',
                      color: '#ffffff',
                      borderRadius: isMine
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                    }}
                  >
                    {msg.content}
                  </div>
                  {/* Timestamp */}
                  <span
                    className={`text-[10px] text-zinc-500 mt-1 ${isMine ? 'text-right' : 'text-left'} px-1`}
                  >
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 p-3 border-t border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:border-zinc-500 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: 'var(--seasonal-primary, #0d9488)' }}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
