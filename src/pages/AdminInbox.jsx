import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

export default function AdminInbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    document.title = 'Inbox - Omix Store';
  }, []);

  // Fetch all conversations the admin is part of
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversation_participants')
          .select('conversations(id, last_message_at, created_at)')
          .eq('user_id', user.id)
          .order('last_read_at', { ascending: false, nullsFirst: false });

        if (error) throw error;

        const convs = (data || [])
          .map((p) => p.conversations)
          .filter(Boolean);

        setConversations(convs);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id]);

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
  };

  const handleBack = () => {
    setActiveConversationId(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state
  if (!loading && conversations.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7 text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No conversations yet</h3>
          <p className="text-sm text-zinc-400">
            Customer conversations will appear here when they start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] max-w-7xl">
      {/* Mobile: show ChatList or ChatWindow */}
      <div className="lg:hidden h-full">
        {activeConversationId ? (
          <ChatWindow
            conversationId={activeConversationId}
            currentUserId={user?.id}
            onBack={handleBack}
          />
        ) : (
          <ChatList
            activeConversationId={null}
            onSelect={handleSelectConversation}
          />
        )}
      </div>

      {/* Desktop: split view */}
      <div className="hidden lg:flex h-full gap-0 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        {/* Left panel — ChatList */}
        <div className="w-80 xl:w-96 shrink-0 border-r border-zinc-800 overflow-hidden">
          <ChatList
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
          />
        </div>

        {/* Right panel — ChatWindow */}
        <div className="flex-1 overflow-hidden">
          {activeConversationId ? (
            <ChatWindow
              conversationId={activeConversationId}
              currentUserId={user?.id}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Choose a conversation from the left to view and reply to messages.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
