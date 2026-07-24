import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, getAffiliateProfile } from '../utils/affiliate_api';
import { supabase } from '../utils/supabase';

const PERIODS = [
  { key: 'all-time', label: 'All Time' },
  { key: 'monthly',  label: 'This Month' },
  { key: 'weekly',   label: 'This Week' },
  { key: 'daily',    label: 'Today' },
];

const TIER_BADGE = {
  gold:   'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  silver: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
};

const RANK_BADGE = {
  1: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  2: 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30',
  3: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
};

function RankBadge({ rank }) {
  if (rank <= 3) {
    const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
    return (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${RANK_BADGE[rank] || ''}`}>
        {medals[rank - 1]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 text-sm font-mono">
      {rank}
    </span>
  );
}

export default function AffiliateLeaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('all-time');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [myEntry, setMyEntry] = useState(null);

  const fetchLeaderboard = useCallback(async (p) => {
    setLoading(true);
    try {
      const data = await getLeaderboard(p, 50);
      setLeaderboard(data);

      // Find current user's entry
      if (userId && data.length > 0) {
        const mine = data.find(e => e.user_id === userId);
        if (mine) {
          setMyEntry(mine);
        } else {
          setMyEntry(null);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  const handlePeriodChange = (key) => {
    setPeriod(key);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/affiliate-dashboard')} className="text-zinc-400 hover:text-zinc-200 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Affiliate Leaderboard</h1>
              <p className="text-sm text-zinc-400 mt-0.5">Top performers ranked by sales</p>
            </div>
          </div>

          {/* Period Tabs */}
          <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 overflow-x-auto">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePeriodChange(key)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === key
                    ? 'bg-[#1a3a5c] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse bg-zinc-900/50 rounded-xl h-16" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 8 2 12 2c3 0 4 1 4 1s1 0 3 2a2.5 2.5 0 0 1 0 5H18"/>
              <path d="M18 9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/>
              <path d="M10 14h4"/>
              <path d="M10 10h4"/>
            </svg>
            <p className="text-zinc-500">No affiliates have sales in this period yet</p>
            <p className="text-zinc-600 text-sm mt-1">Be the first to make a sale and claim the top spot</p>
          </div>
        ) : (
          <>
            {/* My Rank (if not in top list) */}
            {myEntry && !leaderboard.slice(0, 3).find(e => e.user_id === userId) && (
              <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-4 mb-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">My Position</div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-mono text-sm w-8 text-center">#{myEntry.rank}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-200 truncate">{myEntry.full_name || 'Anonymous'}</div>
                    <div className="text-xs text-zinc-500">
                      {myEntry.converted_referrals} converted · KSh {myEntry.total_sales.toLocaleString('en-KE')} in sales
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_BADGE[myEntry.tier] || TIER_BADGE.silver}`}>
                    {myEntry.tier?.charAt(0).toUpperCase() + myEntry.tier?.slice(1) || 'Silver'}
                  </span>
                </div>
              </div>
            )}

            {/* Leaderboard List */}
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isMe = entry.user_id === userId;
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl p-4 transition-colors ${
                      isMe
                        ? 'bg-[#1a3a5c]/5 border border-[#1a3a5c]/20'
                        : 'bg-zinc-900/50 border border-zinc-800/30 hover:border-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RankBadge rank={entry.rank} />

                      {/* Avatar placeholder */}
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-500 flex-shrink-0">
                        {(entry.full_name || 'A').charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200 truncate">
                            {entry.full_name || 'Anonymous Affiliate'}
                          </span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a3a5c]/10 text-[#1a3a5c] font-medium">You</span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TIER_BADGE[entry.tier] || TIER_BADGE.silver}`}>
                            {entry.tier?.charAt(0).toUpperCase() + entry.tier?.slice(1) || 'Silver'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                          <span>{entry.converted_referrals} converted</span>
                          <span>{entry.total_referrals} total</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-zinc-200">
                          KSh {entry.total_sales.toLocaleString('en-KE')}
                        </div>
                        <div className="text-[11px] text-zinc-500">in sales</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
