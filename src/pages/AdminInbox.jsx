import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

export default function AdminInbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConversationId, setActiveConversationId] = useState(null);

  useEffect(() => {
    document.title = 'Inbox - Omix Store';
  }, []);

  // Auto-select conversation from URL ?conversation=xxx param
  useEffect(() => {
    const urlConv = searchParams.get('conversation');
    if (urlConv) {
      setActiveConversationId(urlConv);
      // Clean the param from the URL after reading it
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
  };

  const handleBack = () => {
    setActiveConversationId(null);
  };

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
