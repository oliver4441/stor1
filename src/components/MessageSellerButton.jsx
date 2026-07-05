import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

function MessageSellerButton({ listingId, listingTitle, sellerId, className = '' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Get current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        navigate(`/login?redirect=/listing/${listingId}`);
        return;
      }

      const userId = session.user.id;

      // 2. Check if a conversation already exists for this buyer + listing
      const { data: existingConv, error: lookupError } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', userId)
        .eq('listing_id', listingId)
        .maybeSingle();

      if (lookupError) throw lookupError;

      if (existingConv) {
        navigate(`/admin/inbox?conversation=${existingConv.id}`);
        return;
      }

      // 3. Create a new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listingId,
          buyer_id: userId,
          subject: listingTitle || 'New Inquiry',
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        throw convError || new Error('Failed to create conversation');
      }

      // 4. Add participants (buyer + seller)
      const participants = [
        { conversation_id: newConv.id, user_id: userId },
        { conversation_id: newConv.id, user_id: sellerId },
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) {
        console.error('Failed to add participants:', partError);
      }

      // 5. Send initial message
      const initialMessage = listingTitle
        ? `Hi, I'm interested in ${listingTitle}`
        : "Hi, I'm interested in this listing";

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: newConv.id,
        sender_id: userId,
        content: initialMessage,
      });

      if (msgError) {
        console.error('Failed to send initial message:', msgError);
      }

      // 6. Update conversation preview
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: initialMessage,
        })
        .eq('id', newConv.id);

      // 7. Navigate to inbox with the new conversation
      navigate(`/admin/inbox?conversation=${newConv.id}`);
    } catch (err) {
      console.error('MessageSellerButton error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 border-2 border-zinc-700 text-zinc-300 font-bold py-3 rounded-xl hover:border-[var(--seasonal-primary,#1a5632)] hover:text-[var(--seasonal-primary,#1a5632)] hover:bg-[var(--seasonal-primary,#1a5632)]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={loading ? 'Starting conversation...' : 'Message seller'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageSquare className="w-4 h-4" />
      )}
      {loading ? 'Starting...' : 'Message Seller'}
    </button>
  );
}

export default MessageSellerButton;
