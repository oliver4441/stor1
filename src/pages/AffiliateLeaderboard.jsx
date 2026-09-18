import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../utils/lang';
import { getAffiliateProfile, getLeaderboard } from '../utils/affiliate_api';
import { Trophy, Medal, Award, Users, Crown, UserCheck } from 'lucide-react';

export default function AffiliateLeaderboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isSwahili = lang === 'sw';

  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [period, setPeriod] = useState('all'); // all, month, week
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(period);
      setLeaderboard(data || []);

      if (user) {
        const prof = await getAffiliateProfile(user.id);
        setUserProfile(prof);
        const rank = data.findIndex(item => item.user_id === user.id);
        if (rank !== -1) {
          setUserRank(rank + 1);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400 fill-slate-400/20" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600 fill-amber-600/20" />;
      default:
        return <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span>{isSwahili ? 'Bodi ya Viongozi' : 'Affiliate Champions'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isSwahili ? 'Viongozi wa Mipango ya Washirika' : 'Top Performing Affiliates'}
            </h1>
            <p className="text-emerald-100 text-sm max-w-xl">
              {isSwahili
                ? 'Angalia washirika wanaoongoza kwa mauzo na kamisheni. Pambana uingie kwenye orodha!'
                : 'See who is leading the pack in referrals and earnings. Climb the ranks today!'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-sm font-semibold text-gray-700">
            {isSwahili ? 'Kipindi:' : 'Timeframe:'}
          </span>
          <div className="flex gap-2">
            {[
              { id: 'all', label: isSwahili ? 'Muda Wote' : 'All Time' },
              { id: 'month', label: isSwahili ? 'Mwezi Huu' : 'This Month' },
              { id: 'week', label: isSwahili ? 'Wiki Hii' : 'This Week' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === p.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Rank Card */}
        {user && userProfile && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-800 font-medium">
                  {isSwahili ? 'Nafasi Yako' : 'Your Rank'}
                </div>
                <div className="text-lg font-bold text-emerald-950">
                  {userRank ? `#${userRank}` : (isSwahili ? 'Bado Hujaorodheshwa' : 'Unranked')}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-800 font-medium">
                {isSwahili ? 'Jumla ya Kamisheni' : 'Total Earned'}
              </div>
              <div className="text-sm font-extrabold text-emerald-900">
                KES {(userProfile.total_earned || 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {isSwahili ? 'Inapakia bodi ya viongozi...' : 'Loading leaderboard...'}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {isSwahili ? 'Hakuna data kwa sasa.' : 'No performance data for this period.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaderboard.map((item, index) => {
                const rank = index + 1;
                const isCurrentUser = user && item.user_id === user.id;

                return (
                  <div
                    key={item.user_id || index}
                    className={`flex items-center justify-between p-4 transition-colors ${
                      isCurrentUser ? 'bg-emerald-50/60' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center">{getRankBadge(rank)}</div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          {item.full_name || (isSwahili ? 'Mshirika' : 'Affiliate Member')}
                          {isCurrentUser && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                              {isSwahili ? 'WEWE' : 'YOU'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            {item.total_referrals || 0} {isSwahili ? 'rufaa' : 'referrals'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-600">
                        KES {(item.total_earned || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {isSwahili ? 'kamisheni' : 'commission'}
                      </div>
                    </div>
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
