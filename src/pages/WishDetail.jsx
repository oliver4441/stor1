import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, Send, MessageCircle, Package } from 'lucide-react';
import { fetchWish, fetchMessages, sendMessage, updateWishStatus } from '../utils/api';
import { formatKES } from '../utils/constants';
import { supabase } from '../utils/supabase';

function WishDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [wish, setWish] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      const w = await fetchWish(id);
      setWish(w);
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    if (showChat) {
      const loadMessages = async () => {
        const msgs = await fetchMessages(id);
        setMessages(msgs);
      };
      loadMessages();

      // Subscribe to new messages
      const channel = supabase
        .channel(`wish-${id}-messages`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `wish_id=eq.${id}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [showChat, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMsgLoading(true);
    const result = await sendMessage({
      wishId: id,
      receiverId: wish?.user_id,
      content: newMessage.trim(),
    });

    if (result.success) {
      setNewMessage('');
    }
    setMsgLoading(false);
  };

  const handleMarkFound = async () => {
    await updateWishStatus(id, 'found');
    setWish(prev => ({ ...prev, status: 'found' }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-6" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  if (!wish) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-500 text-lg">Wish not found.</p>
        <Link to="/wishes" className="text-[#ff385c] font-bold hover:underline mt-4 inline-block">Back to Wishes</Link>
      </div>
    );
  }

  const urgencyColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    normal: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const isOwner = currentUser?.id === wish.user_id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" data-name="wish-detail-page">
      <button onClick={() => navigate('/wishes')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Wishes
      </button>

      {/* Wish Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{wish.category}</span>
            {wish.urgency !== 'low' && (
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${urgencyColors[wish.urgency]}`}>
                <AlertTriangle className="w-3 h-3" /> {wish.urgency}
              </span>
            )}
          </div>
          {wish.status === 'found' ? (
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Found
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-[#ff385c] bg-[#ff385c]/10 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" /> Open
            </span>
          )}
        </div>

        <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">{wish.title}</h1>

        {wish.description && (
          <p className="text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">{wish.description}</p>
        )}

        {wish.budget_max > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-5">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Budget Range</span>
            <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">
              {wish.budget_min > 0 ? `${formatKES(wish.budget_min)} — ` : ''}{formatKES(wish.budget_max)}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <span>Posted by <strong className="text-zinc-700 dark:text-zinc-300">{wish.requester_name || 'Anonymous'}</strong></span>
          <span>{new Date(wish.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {wish.status === 'open' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {!isOwner && (
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex-1 bg-[#ff385c] text-white font-bold py-3.5 rounded-xl hover:bg-[#e03150] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff385c]/20"
            >
              <Package className="w-5 h-5" />
              I Have This — Chat
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleMarkFound}
              className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Mark as Found
            </button>
          )}
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#ff385c]" />
            <h3 className="font-bold text-zinc-900 dark:text-white">Chat with {wish.requester_name || 'Requester'}</h3>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-950/50">
            {messages.length === 0 && (
              <div className="text-center py-10 text-zinc-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map(msg => {
              const isMine = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                    isMine
                      ? 'bg-[#ff385c] text-white rounded-br-md'
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-bl-md'
                  }`}>
                    {!isMine && (
                      <p className="text-xs font-bold text-[#ff385c] mb-1">{msg.sender_name || 'Seller'}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-zinc-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm transition-all"
            />
            <button
              type="submit"
              disabled={msgLoading || !newMessage.trim()}
              className="bg-[#ff385c] text-white px-4 py-2.5 rounded-xl hover:bg-[#e03150] transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default WishDetail;
