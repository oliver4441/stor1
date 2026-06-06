import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, Clock, AlertTriangle, CheckCircle, MessageCircle, Plus } from 'lucide-react';
import { fetchWishes } from '../utils/api';
import { CATEGORIES, formatKES } from '../utils/constants';

function Wishes() {
  const navigate = useNavigate();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      const data = await fetchWishes(activeCategory, statusFilter);
      setWishes(data);
      setLoading(false);
    };
    load();
  }, [activeCategory, statusFilter]);

  const filteredWishes = wishes.filter(w => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return w.title?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q);
  });

  const urgencyColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    normal: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const urgencyIcons = {
    low: null,
    normal: <Clock className="w-3 h-3" />,
    high: <AlertTriangle className="w-3 h-3" />,
    urgent: <AlertTriangle className="w-3 h-3" />,
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-name="wishes-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-[#ff385c]" />
            Wishes Board
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Looking for something specific? Browse requests or post your own.</p>
        </div>
        <Link to="/wish/new" className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 flex items-center gap-2 self-start">
          <Plus className="w-5 h-5" />
          Post a Wish
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search wishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white transition-all"
          />
        </div>
        <div className="flex gap-2">
          {['open', 'found', 'All'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                statusFilter === s
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {s === 'All' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-[14px] text-sm font-medium whitespace-nowrap border transition-all ${
              activeCategory === cat
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800 hover:border-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Wishes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl h-52" />
          ))}
        </div>
      ) : filteredWishes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWishes.map(wish => (
            <div
              key={wish.id}
              onClick={() => navigate(`/wishes/${wish.id}`)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg hover:border-[#ff385c]/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{wish.category}</span>
                {wish.status === 'found' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Found
                  </span>
                ) : wish.urgency !== 'low' ? (
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${urgencyColors[wish.urgency]}`}>
                    {urgencyIcons[wish.urgency]}
                    {wish.urgency}
                  </span>
                ) : null}
              </div>

              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-[#ff385c] transition-colors line-clamp-2">{wish.title}</h3>

              {wish.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{wish.description}</p>
              )}

              {wish.budget_max > 0 && (
                <div className="mb-4">
                  <span className="text-xs text-zinc-400 font-medium">Budget: </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {wish.budget_min > 0 ? `${formatKES(wish.budget_min)} — ` : ''}{formatKES(wish.budget_max)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">{wish.requester_name || 'Anonymous'}</span>
                <span className="text-xs text-zinc-400">{timeAgo(wish.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-4">No wishes found.</p>
          <Link to="/wish/new" className="text-[#ff385c] font-bold hover:underline">
            Be the first to post a wish!
          </Link>
        </div>
      )}
    </div>
  );
}

export default Wishes;
