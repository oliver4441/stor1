import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getAffiliateProfile, getRecentReferrals } from '../utils/affiliate_api';
import { AFFILIATE_CONFIG, formatKES, getReferralLink } from '../config/affiliate';
import { Share2, Copy, Users, CheckCircle, ExternalLink, MessageCircle, Send, Globe, Download, Award, Wallet, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { GooeyLoader } from '@/components/ui/loader-10';

export default function AffiliateReferrals() {
  const [affiliate, setAffiliate] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const location = useLocation();

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setError('Not authenticated'); setLoading(false); return; }

      const profile = await getAffiliateProfile(session.user.id);
      if (!profile) { setError('Affiliate account not found'); setLoading(false); return; }
      setAffiliate(profile);

      const refData = await getRecentReferrals(profile.id, 100);
      setReferrals(Array.isArray(refData) ? refData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const referralLink = affiliate ? getReferralLink(affiliate.referral_code) : '';
  const referralCode = affiliate?.referral_code || '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareVia = (platform) => {
    const text = `Shop on Omix Store and save! Use my referral link: ${referralLink}`;
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Shop on Omix Store!')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    };
    const url = urls[platform];
    if (url) window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const downloadQR = async () => {
    // Create QR code via API and download
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omix-referral-${referralCode}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  const nativeShare = () => {
    const shareData = { title: 'Shop on Omix Store', text: `Shop on Omix Store and earn rewards! Use my referral link.`, url: referralLink };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const convertedCount = referrals.filter(r => r.status === 'converted').length;
  const pendingCount = referrals.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <GooeyLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Share2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Referral Center</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-zinc-950 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-black text-white">Referral Center</h1>
          </div>
          <p className="text-zinc-400 text-sm mt-1">Share your link and earn commissions</p>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 overflow-x-auto">
          {[
            { path: '/affiliate-dashboard', label: 'Dashboard', icon: Award },
            { path: '/affiliate-referrals', label: 'Referrals', icon: Share2 },
            { path: '/affiliate-leaderboard', label: 'Leaderboard', icon: Trophy },
            { path: '/affiliate-achievements', label: 'Achievements', icon: Award },
            { path: '/affiliate-withdrawals', label: 'Withdrawals', icon: Wallet },
          ].map(tab => (
            <Link key={tab.path} to={tab.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                location.pathname === tab.path
                  ? 'bg-primary text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 mt-6">
        {/* Referral Code Card */}
        <div className="fusion-recessed-card p-5 text-center">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Your Referral Code</p>
          <p className="text-3xl font-mono font-black text-primary tracking-widest">{referralCode}</p>
          <button onClick={copyCode}
            className="mt-2 px-4 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors inline-flex items-center gap-1.5">
            {copiedCode ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy Code</>}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="fusion-recessed-card p-4 text-center">
            <p className="text-2xl font-black text-white">{referrals.length}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="fusion-recessed-card p-4 text-center">
            <p className="text-2xl font-black text-green-400">{convertedCount}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Converted</p>
          </div>
          <div className="fusion-recessed-card p-4 text-center">
            <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pending</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Your Referral Link
          </h3>
          <div className="flex gap-2">
            <input readOnly value={referralLink}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono truncate" />
            <button onClick={copyLink}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover flex items-center gap-2 transition-colors shrink-0">
              {copied ? <><CheckCircle className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="fusion-recessed-card p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Send className="w-4 h-4" /> Share Via
          </h3>
          <button onClick={nativeShare}
            className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-left mb-3">
            <Share2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Share with anyone</p>
              <p className="text-xs text-zinc-400">One-tap share via apps</p>
            </div>
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => shareVia('whatsapp')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors text-left">
              <MessageCircle className="w-5 h-5 text-green-400 shrink-0" />
              <span className="text-sm font-bold text-white">WhatsApp</span>
            </button>
            <button onClick={() => shareVia('telegram')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-left">
              <Send className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm font-bold text-white">Telegram</span>
            </button>
            <button onClick={() => shareVia('facebook')}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors text-left">
              <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="text-sm font-bold text-white">Facebook</span>
            </button>
            <button onClick={downloadQR}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors text-left">
              <Download className="w-5 h-5 text-zinc-400 shrink-0" />
              <span className="text-sm font-bold text-white">QR Code</span>
            </button>
          </div>
        </div>

        {/* Referred Users */}
        <div className="fusion-recessed-card overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Users className="w-4 h-4" /> People You Referred
            </h3>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8 px-4">
              Share your referral link to start earning. Anyone who signs up through it appears here.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800">
              {referrals.map((r, i) => {
                const initials = (r.full_name || r.email || 'C').split(/[\s@]+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={r.id || i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{r.full_name || 'Customer'}</p>
                      <p className="text-xs text-zinc-400 truncate">{r.email}</p>
                      <p className="text-[10px] text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      r.status === 'converted' ? 'bg-green-900/30 text-green-400' : 
                      r.status === 'expired' ? 'bg-red-900/30 text-red-400' :
                      'bg-amber-900/30 text-amber-400'
                    }`}>
                      {r.status || 'pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
