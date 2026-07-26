import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAchievements, getAffiliateProfile } from '../utils/affiliate_api';
import { supabase } from '../utils/supabase';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'sales', label: 'Sales' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'tier', label: 'Tier' },
];

const TIER_COLORS = {
  bronze: { bg: 'bg-amber-700/20', border: 'border-amber-700/30', text: 'text-amber-600', glow: 'shadow-amber-700/20' },
  silver: { bg: 'bg-zinc-400/20', border: 'border-zinc-400/30', text: 'text-[#8E9BB5]', glow: 'shadow-zinc-400/20' },
  gold: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-yellow-500/20' },
  platinum: { bg: 'bg-blue-400/20', border: 'border-blue-400/30', text: 'text-zinc-400', glow: 'shadow-blue-400/20' },
};

function AchievementCard({ ach }) {
  const colors = TIER_COLORS[ach.tier] || TIER_COLORS.bronze;

  if (ach.earned) {
    return (
      <div className={`rounded-xl p-4 border ${colors.border} ${colors.bg} transition-all hover:shadow-lg ${colors.glow}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colors.bg} ${colors.text}`}>
            <AchievementIcon icon={ach.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#FAFAFA]">{ach.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${colors.border} ${colors.text}`}>
                {ach.tier.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#4A5771] mt-0.5">{ach.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <svg className="w-3.5 h-3.5 text-[#38B8EA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-[11px] text-[#38B8EA] font-medium">Earned</span>
              {ach.earned_at && (
                <span className="text-[10px] text-[#4A5771]">
                  {new Date(ach.earned_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 border border-[#353F54]/40 bg-[#28303F]/30 opacity-60 hover:opacity-80 transition-opacity">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#28303F]/50 flex items-center justify-center text-lg text-[#4A5771]">
          <AchievementIcon icon={ach.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#4A5771]">{ach.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-[#28303F]/60 text-[#4A5771] border border-[#353F54]/30">
              {ach.tier.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-[#4A5771] mt-0.5">{ach.description}</p>
          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-[#4A5771] mb-1">
              <span>Progress</span>
              <span>{ach.current_value} / {ach.criteria_value}</span>
            </div>
            <div className="h-1.5 bg-[#28303F]/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors.bg.replace('/20', '/60')}`}
                style={{ width: `${Math.min(ach.progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementIcon({ icon }) {
  switch (icon) {
    case 'zap': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'coin': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'award': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>;
    case 'target': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'users': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'wallet': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case 'trophy': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 8 2 12 2c3 0 4 1 4 1s1 0 3 2a2.5 2.5 0 0 1 0 5H18"/><path d="M18 9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M10 14h4"/><path d="M10 10h4"/></svg>;
    default: return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  }
}

export default function AffiliateAchievements() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const profile = await getAffiliateProfile(session.user.id);
      if (!profile?.id) return;

      const data = await getAchievements(profile.id);
      setAchievements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalCount = achievements.length;

  const filtered = filter === 'all'
    ? achievements
    : achievements.filter(a => a.category === filter);

  const sorted = [
    ...filtered.filter(a => a.earned),
    ...filtered.filter(a => !a.earned),
  ];

  return (
    <div className="min-h-screen bg-[#08080a] text-[#FAFAFA]">
      {/* Header */}
      <div className="bg-[#28303F]/50 border-b border-[#353F54]/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/affiliate-dashboard')} className="text-[#4A5771] hover:text-[#8E9BB5] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#FAFAFA]">Achievements</h1>
              <p className="text-sm text-[#4A5771] mt-0.5">Earn badges and rewards as you grow</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#28303F]/70 rounded-xl p-3 text-center border border-[#353F54]/30">
              <div className="text-2xl font-bold text-[#FAFAFA]">{totalCount}</div>
              <div className="text-[11px] text-[#4A5771] uppercase tracking-wider mt-0.5">Total</div>
            </div>
            <div className="bg-[#28303F]/70 rounded-xl p-3 text-center border border-[#353F54]/30">
              <div className="text-2xl font-bold text-[#38B8EA]">{earnedCount}</div>
              <div className="text-[11px] text-[#4A5771] uppercase tracking-wider mt-0.5">Earned</div>
            </div>
            <div className="bg-[#28303F]/70 rounded-xl p-3 text-center border border-[#353F54]/30">
              <div className="text-2xl font-bold text-[#4A5771]">{totalCount - earnedCount}</div>
              <div className="text-[11px] text-[#4A5771] uppercase tracking-wider mt-0.5">Locked</div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 bg-[#28303F] rounded-xl p-1 overflow-x-auto">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? 'bg-[#ff385c] text-white shadow-sm'
                    : 'text-[#4A5771] hover:text-[#8E9BB5]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievement list */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="animate-pulse bg-[#28303F]/50 rounded-xl h-20" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-[#353F54] mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <p className="text-[#4A5771]">No achievements found in this category</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((ach) => (
              <AchievementCard key={ach.id} ach={ach} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}