// ── ChatList ──────────────────────────────────────────────
// Displays a list of conversations for the current user.
// Fetches from supabase, shows subject, last message preview,
// relative date, unread indicator, and other participant avatar.

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

// ── Helpers ──────────────────────────────────────────────

function getOtherParticipant(participants, currentUserId) {
  if (!participants || participants.length < 2) return null;
  return participants.find((p) => p.user_id !== currentUserId) || participants[0];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays = Math.round((startOfToday - startOfDate) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen).trimEnd() + '...' : str;
}

// ── Skeleton ─────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-zinc-700 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3.5 w-2/5 rounded bg-zinc-700" />
        <div className="h-3 w-3/4 rounded bg-zinc-700/60" />
      </div>
      <div className="h-3 w-12 rounded bg-zinc-700/40 shrink-0" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="divide-y divide-zinc-800/50">
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  );
}

// ── Component ────────────────────────────────────────────

export default function ChatList({ activeConversationId, onSelect }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch conversations ────────────────────────────────

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const currentUserId = session.user.id;

      // Fetch conversation_participants for current user, joined with conversations
      const { data: myParticipations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select(
          `
          conversation_id,
          last_read_at,
          conversations (
            id,
            subject,
            last_message_at,
            last_message_preview,
            created_at
          )
        `
        )
        .eq('user_id', currentUserId)
        .order('last_read_at', { ascending: false });

      if (participationsError) throw participationsError;

      // Extract conversation IDs
      const convIds = (myParticipations || [])
        .map((p) => p.conversation_id)
        .filter(Boolean);

      if (convIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get the other participant for each conversation
      const { data: allParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(
          `
          conversation_id,
          user_id,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `
        )
        .in('conversation_id', convIds);

      if (participantsError) throw participantsError;

      // Build lookup: conversation_id -> list of participants
      const participantsByConv = {};
      for (const p of allParticipants || []) {
        if (!participantsByConv[p.conversation_id]) {
          participantsByConv[p.conversation_id] = [];
        }
        participantsByConv[p.conversation_id].push({
          user_id: p.user_id,
          full_name: p.profiles?.full_name || null,
          avatar_url: p.profiles?.avatar_url || null,
        });
      }

      // Merge into conversation objects
      const enriched = (myParticipations || [])
        .map((p) => {
          const conv = p.conversations;
          if (!conv) return null;

          const other = getOtherParticipant(
            participantsByConv[p.conversation_id] || [],
            currentUserId
          );

          // Unread check: if last_read_at is before last_message_at, there are unread messages
          const hasUnread =
            p.last_read_at && conv.last_message_at
              ? new Date(conv.last_message_at) > new Date(p.last_read_at)
              : !!conv.last_message_at;

          return {
            id: conv.id,
            subject: conv.subject || 'No subject',
            otherParticipantName: other?.full_name || 'Unknown User',
            otherAvatarUrl: other?.avatar_url || null,
            lastMessagePreview: conv.last_message_preview || '',
            lastMessageAt: conv.last_message_at || conv.created_at,
            hasUnread,
          };
        })
        .filter(Boolean);

      // Sort by last_message_at DESC
      enriched.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      setConversations(enriched);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="shrink-0 px-4 py-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-white">Messages</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {conversations.length > 0
            ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`
            : ''}
        </p>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-900/20 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300 mb-1">
              Something went wrong
            </p>
            <p className="text-xs text-zinc-500 mb-4">{error}</p>
            <button
              onClick={fetchConversations}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-zinc-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-300 mb-1">
              No messages yet
            </p>
            <p className="text-xs text-zinc-500 max-w-[220px]">
              When you start a conversation with a seller or buyer, it will appear here.
            </p>
          </div>
        ) : (
          /* Conversation list */
          <div className="divide-y divide-zinc-800/40">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect?.(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/50 ${
                    isActive
                      ? 'bg-zinc-800/80 hover:bg-zinc-800'
                      : 'hover:bg-zinc-800/40'
                  }`}
                >
                  {/* Avatar / Initial */}
                  <div className="relative shrink-0">
                    {conv.otherAvatarUrl ? (
                      <img
                        src={conv.otherAvatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-zinc-300">
                          {getInitials(conv.otherParticipantName)}
                        </span>
                      </div>
                    )}
                    {/* Unread dot on avatar */}
                    {conv.hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 border-2 border-zinc-950 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          conv.hasUnread
                            ? 'font-bold text-white'
                            : 'font-medium text-zinc-200'
                        }`}
                      >
                        {conv.otherParticipantName}
                      </span>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">
                        {formatRelativeDate(conv.lastMessageAt)}
                      </span>
                    </div>

                    {conv.subject && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {conv.subject}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-0.5">
                      {conv.lastMessagePreview ? (
                        <p
                          className={`text-xs truncate ${
                            conv.hasUnread
                              ? 'font-medium text-zinc-300'
                              : 'text-zinc-400'
                          }`}
                        >
                          {truncate(conv.lastMessagePreview, 60)}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 italic truncate">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-zinc-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
