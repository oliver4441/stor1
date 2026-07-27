import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Plus } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { getWallet, topUpWallet } from '../utils/api';
import { formatKES } from '../utils/constants';
import { GooeyLoader } from '@/components/ui/loader-10';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

export default function WalletPage() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadWallet(u.id);
      else setLoading(false);
    });
  }, []);

  const loadWallet = async (userId) => {
    setLoading(true);
    setError('');
    try {
      const result = await getWallet(userId);
      if (result.success) {
        setWallet(result.wallet);
        setTransactions(result.transactions || []);
      } else {
        setError(result.error || 'Failed to load wallet');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = () => {
    if (!PAYSTACK_PUBLIC_KEY) {
      setError('Payment is not configured. Please try again later.');
      return;
    }

    const amountInput = prompt('Enter amount to top up (KES):', '100');
    if (!amountInput) return;

    const amount = parseInt(amountInput.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount < 10) {
      setError('Please enter a valid amount (minimum KES 10).');
      return;
    }

    setTopUpLoading(true);
    setError('');

    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = () => openPaystack(amount);
      script.onerror = () => {
        setTopUpLoading(false);
        setError('Failed to load payment gateway. Please try again.');
      };
      document.body.appendChild(script);
    } else {
      openPaystack(amount);
    }
  };

  const openPaystack = (amount) => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user?.email || 'customer@omixsystems.com',
      amount: amount * 100,
      currency: 'KES',
      callback: async (response) => {
        if (response.reference) {
          try {
            const result = await topUpWallet(response.reference, amount);
            if (result.success) {
              loadWallet(user.id);
            } else {
              setError(result.error || 'Top-up failed. Please contact support.');
            }
          } catch (err) {
            setError(err.message || 'Top-up failed');
          }
        }
        setTopUpLoading(false);
      },
      onClose: () => {
        setTopUpLoading(false);
      },
    });
    handler.openIframe();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'credit':
      case 'top_up':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'debit':
      case 'payment':
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-[#4A5771]" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'credit': return 'Credit';
      case 'top_up': return 'Top Up';
      case 'debit': return 'Debit';
      case 'payment': return 'Payment';
      case 'withdrawal': return 'Withdrawal';
      default: return type || 'Transaction';
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <GooeyLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Wallet className="w-16 h-16 text-[#4A5771] mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2 text-white">Wallet</h1>
        <p className="text-[#4A5771] mb-8">Sign in to access your wallet and manage your store credit.</p>
        <a href="/login" className="bg-[#71717a] text-white font-bold px-8 py-3 rounded-xl inline-block">Sign In</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-[#28303F]">
          <Wallet className="w-7 h-7 text-[#71717a]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Wallet</h1>
          <p className="text-sm text-[#4A5771]">Manage your store credit and transactions</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Balance Card */}
      <div className="wallet-balance-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[#4A5771] font-medium mb-1">Available Balance</p>
            <p className="text-3xl md:text-4xl font-black text-white">
              {formatKES(wallet?.balance ?? 0)}
            </p>
            {wallet?.total_topped_up > 0 && (
              <p className="text-xs text-[#4A5771] mt-1">
                Total topped up: {formatKES(wallet.total_topped_up)}
              </p>
            )}
          </div>
          <button
            onClick={handleTopUp}
            disabled={topUpLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#71717a] text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {topUpLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Top Up
          </button>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <Clock className="w-5 h-5 text-[#4A5771]" />
          Recent Transactions
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12 wallet-transaction-card">
            <Clock className="w-12 h-12 text-[#4A5771] mx-auto mb-3" />
            <p className="text-[#4A5771]">No transactions yet</p>
            <p className="text-xs text-[#4A5771] mt-1">Top up your wallet to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="wallet-transaction-card p-4 flex items-center gap-4 transition-colors"
              >
                <div className="p-2 rounded-xl bg-[#28303F] flex-shrink-0">
                  {getTypeIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {tx.description || getTypeLabel(tx.type)}
                  </p>
                  <p className="text-xs text-[#4A5771]">
                    {new Date(tx.created_at || tx.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${
                    tx.type === 'credit' || tx.type === 'top_up'
                      ? 'text-emerald-400'
                      : tx.type === 'debit' || tx.type === 'payment' || tx.type === 'withdrawal'
                      ? 'text-red-400'
                      : 'text-white'
                  }`}>
                    {tx.type === 'credit' || tx.type === 'top_up' ? '+' : '-'}
                    {formatKES(Math.abs(tx.amount))}
                  </p>
                  <p className="text-[10px] text-[#4A5771] uppercase tracking-wide">
                    {getTypeLabel(tx.type)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
