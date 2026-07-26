import { useState, useEffect } from 'react';
import { Gift, Send, Ticket, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { purchaseGiftCard, lookupGiftCard } from '../utils/api';
import { formatKES } from '../utils/constants';
import { GooeyLoader } from '@/components/ui/loader-10';

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function GiftCards() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Buy form state
  const [buyForm, setBuyForm] = useState({
    amount: 500,
    recipient_name: '',
    recipient_email: '',
    sender_name: '',
    message: '',
  });
  const [buying, setBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState(null);
  const [buyError, setBuyError] = useState('');

  // Redeem state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [giftCard, setGiftCard] = useState(null);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setBuyForm(f => ({ ...f, sender_name: session.user.user_metadata?.full_name || '' }));
      }
      setLoading(false);
    });
  }, []);

  const handleBuy = async (e) => {
    e.preventDefault();
    setBuyError('');
    setBuySuccess(null);

    if (!buyForm.recipient_name.trim()) {
      setBuyError('Please enter the recipient\'s name.');
      return;
    }
    if (!buyForm.recipient_email.trim()) {
      setBuyError('Please enter the recipient\'s email.');
      return;
    }
    if (!buyForm.sender_name.trim()) {
      setBuyError('Please enter your name.');
      return;
    }

    setBuying(true);
    try {
      const result = await purchaseGiftCard({
        amount: buyForm.amount,
        recipient_name: buyForm.recipient_name.trim(),
        recipient_email: buyForm.recipient_email.trim(),
        sender_name: buyForm.sender_name.trim(),
        message: buyForm.message.trim() || undefined,
      });

      if (result.success) {
        setBuySuccess(result.gift_card || result.data || result);
        setBuyForm(f => ({ ...f, recipient_name: '', recipient_email: '', message: '' }));
      } else {
        setBuyError(result.error || 'Purchase failed. Please try again.');
      }
    } catch (err) {
      setBuyError(err.message || 'Something went wrong');
    } finally {
      setBuying(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setRedeemError('');
    setGiftCard(null);
    setRedeemSuccess('');

    if (!redeemCode.trim()) {
      setRedeemError('Please enter a gift card code.');
      return;
    }

    setRedeeming(true);
    try {
      const result = await lookupGiftCard(redeemCode.trim().toUpperCase());
      if (result.success) {
        setGiftCard(result.gift_card || result.data || result);
      } else {
        setRedeemError(result.error || 'Gift card not found or invalid.');
      }
    } catch (err) {
      setRedeemError(err.message || 'Something went wrong');
    } finally {
      setRedeeming(false);
    }
  };

  const handleUseAtCheckout = () => {
    // Store gift card code in sessionStorage for checkout to pick up
    if (giftCard?.code) {
      sessionStorage.setItem('omix_gift_card', JSON.stringify({
        code: giftCard.code,
        balance: giftCard.balance || giftCard.remaining_balance,
      }));
      setRedeemSuccess('Gift card applied! Proceed to checkout to use it.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <GooeyLoader />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-[#28303F]">
          <Gift className="w-7 h-7 text-[#71717a]" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Gift Cards</h1>
          <p className="text-sm text-[#4A5771]">Send a gift card or redeem one you received</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Buy a Gift Card ── */}
        <div className="fusion-recessed-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Send className="w-5 h-5 text-[#71717a]" />
            <h2 className="text-lg font-bold">Buy a Gift Card</h2>
          </div>

          {buySuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Gift Card Purchased!</h3>
              <p className="text-sm text-[#8E9BB5] mb-2">
                {formatKES(buySuccess.amount || buySuccess.initial_balance)} gift card for {buySuccess.recipient_name}
              </p>
              {buySuccess.code && (
                <p className="text-xs text-[#4A5771]">
                  Code: <span className="font-mono text-[#8E9BB5]">{buySuccess.code}</span>
                </p>
              )}
              <p className="text-xs text-[#4A5771] mt-3">
                An email has been sent to {buySuccess.recipient_email || buyForm.recipient_email} with the gift card details.
              </p>
              <button
                onClick={() => setBuySuccess(null)}
                className="mt-6 text-sm text-[#71717a] hover:text-white transition-colors font-medium"
              >
                Buy Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleBuy} className="space-y-4">
              {/* Amount presets */}
              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-2">Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBuyForm(f => ({ ...f, amount: amt }))}
                      className={`py-2.5 rounded-lg text-sm font-bold transition-all border ${
                        buyForm.amount === amt
                          ? 'bg-[#71717a] text-white border-[#71717a]'
                          : 'bg-[#28303F] text-[#8E9BB5] border-[#353F54] hover:border-[#71717a]'
                      }`}
                    >
                      {formatKES(amt)}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    min="10"
                    placeholder="Custom amount"
                    value={buyForm.amount}
                    onChange={(e) => setBuyForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    value={buyForm.recipient_name}
                    onChange={(e) => setBuyForm(f => ({ ...f, recipient_name: e.target.value }))}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Recipient Email *</label>
                  <input
                    type="email"
                    value={buyForm.recipient_email}
                    onChange={(e) => setBuyForm(f => ({ ...f, recipient_email: e.target.value }))}
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Your Name *</label>
                <input
                  type="text"
                  value={buyForm.sender_name}
                  onChange={(e) => setBuyForm(f => ({ ...f, sender_name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Message (optional)</label>
                <textarea
                  value={buyForm.message}
                  onChange={(e) => setBuyForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Write a short message for the recipient..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771] resize-none"
                />
              </div>

              {buyError && (
                <p className="text-sm text-red-400 font-medium">{buyError}</p>
              )}

              <button
                type="submit"
                disabled={buying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#71717a] text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                Purchase Gift Card — {formatKES(buyForm.amount)}
              </button>
            </form>
          )}
        </div>

        {/* ── Redeem a Gift Card ── */}
        <div className="fusion-recessed-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Ticket className="w-5 h-5 text-[#71717a]" />
            <h2 className="text-lg font-bold">Redeem a Gift Card</h2>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8E9BB5] mb-1">Gift Card Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="e.g. OMIX-XXXX-XXXX"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-sm focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771] uppercase tracking-wider font-mono"
                />
                <button
                  type="submit"
                  disabled={redeeming || !redeemCode.trim()}
                  className="px-4 py-2.5 rounded-lg bg-[#71717a] text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {redeeming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Check'
                  )}
                </button>
              </div>
            </div>

            {redeemError && (
              <p className="text-sm text-red-400 font-medium">{redeemError}</p>
            )}

            {redeemSuccess && (
              <p className="text-sm text-emerald-400 font-medium">{redeemSuccess}</p>
            )}
          </form>

          {/* Gift Card Details */}
          {giftCard && (
            <div className="mt-6 p-5 rounded-xl bg-[#28303F] border border-[#353F54]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-emerald-900/30">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Valid Gift Card</p>
                  <p className="text-xs text-[#4A5771] font-mono">{giftCard.code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[#1E2A3D]">
                  <p className="text-xs text-[#4A5771] mb-0.5">Initial Balance</p>
                  <p className="text-lg font-black text-white">
                    {formatKES(giftCard.initial_balance || giftCard.amount || 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#1E2A3D]">
                  <p className="text-xs text-[#4A5771] mb-0.5">Remaining</p>
                  <p className="text-lg font-black text-emerald-400">
                    {formatKES(giftCard.balance || giftCard.remaining_balance || 0)}
                  </p>
                </div>
              </div>

              {giftCard.recipient_name && (
                <p className="text-xs text-[#4A5771] mb-2">
                  For: <span className="text-white">{giftCard.recipient_name}</span>
                </p>
              )}
              {giftCard.sender_name && (
                <p className="text-xs text-[#4A5771] mb-4">
                  From: <span className="text-white">{giftCard.sender_name}</span>
                </p>
              )}

              {(giftCard.balance || giftCard.remaining_balance) > 0 ? (
                <button
                  onClick={handleUseAtCheckout}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
                >
                  Use at Checkout
                </button>
              ) : (
                <p className="text-sm text-red-400 font-medium text-center">This gift card has been fully redeemed.</p>
              )}
            </div>
          )}

          {/* How it works */}
          <div className="mt-6 pt-5 border-t border-[#353F54]">
            <h3 className="text-sm font-semibold text-[#8E9BB5] mb-3">How Gift Cards Work</h3>
            <ul className="space-y-2 text-xs text-[#4A5771]">
              <li className="flex items-start gap-2">
                <span className="text-[#71717a] mt-0.5">1.</span>
                Choose an amount and recipient details to purchase a digital gift card.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#71717a] mt-0.5">2.</span>
                The recipient receives the gift card code via email.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#71717a] mt-0.5">3.</span>
                Enter the code above to check the balance and use it at checkout.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
