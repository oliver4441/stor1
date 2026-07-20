import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, ShoppingBag, Package, ChevronLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { supabase } from '../utils/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

function CountdownTimer({ endAt, label }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft('Ended');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      else setTimeLeft(`${h}h ${m}m ${s}s`);
    }
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Clock className="w-4 h-4" />
      <span className="font-mono font-bold tabular-nums tracking-wide">{timeLeft}</span>
      {label && <span className="text-xs text-zinc-400">{label}</span>}
    </div>
  );
}

export default function FlashDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingsMap, setListingsMap] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/flash-deals/active`);
        const json = await res.json();
        if (json.success) {
          setDeals(json.data || []);

          // Fetch full listing data for all items
          const listingIds = [];
          for (const deal of json.data || []) {
            for (const item of deal.items || []) {
              if (item.listing_id) listingIds.push(item.listing_id);
            }
          }

          if (listingIds.length > 0) {
            const { data: listings } = await supabase
              .from('listings')
              .select('*')
              .in('id', listingIds);
            const map = {};
            for (const l of listings || []) map[l.id] = l;
            setListingsMap(map);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch flash deals:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1a5632', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header Banner */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--seasonal-primary, #1a5632)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)' }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
          <Link to="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm font-semibold mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10">
              <Zap className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">Flash Deals</h1>
              <p className="text-white/70 mt-1">Limited-time offers with exclusive discounts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {deals.length === 0 ? (
          <div className="text-center py-20">
            <Zap className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <h2 className="text-xl font-bold text-white mb-2">No Active Deals</h2>
            <p className="text-zinc-400 mb-6">There are no flash deals running right now. Check back later!</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#1a5632' }}
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {deals.map((deal) => (
              <div key={deal.id} className="fusion-recessed-card overflow-hidden">
                {/* Deal Header */}
                <div className="p-5 border-b border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {deal.banner_url && (
                        <img src={deal.banner_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-white">{deal.title}</h2>
                        {deal.description && (
                          <p className="text-sm text-zinc-400">{deal.description}</p>
                        )}
                      </div>
                    </div>
                    <CountdownTimer endAt={deal.end_at} label="remaining" />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                    <span>{deal.items?.length || 0} items</span>
                    <span>Started {new Date(deal.start_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Deal Items */}
                {deal.items && deal.items.length > 0 ? (
                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {deal.items.map((item) => {
                        const listing = listingsMap[item.listing_id];
                        if (!listing) return null;

                        const originalPrice = listing.price;
                        const dealPrice = item.deal_price;
                        const discountPct = item.discount_percent;

                        return (
                          <Link
                            key={item.id}
                            to={`/listing/${item.listing_id}`}
                            className="group rounded-xl bg-zinc-800/50 border border-zinc-800 overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
                          >
                            {/* Image */}
                            <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                              {listing.images?.[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-zinc-600" />
                                </div>
                              )}
                              {discountPct && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  -{discountPct}%
                                </div>
                              )}
                              {item.max_quantity > 0 && item.sold_quantity >= item.max_quantity && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">Sold Out</span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3">
                              <h3 className="text-xs font-semibold text-zinc-300 line-clamp-2 group-hover:text-primary transition-colors min-h-[2rem]">
                                {listing.title}
                              </h3>
                              <div className="mt-2 flex items-center gap-2">
                                {dealPrice ? (
                                  <>
                                    <span className="text-sm font-bold text-white">
                                      KES {Number(dealPrice).toLocaleString()}
                                    </span>
                                    {originalPrice && originalPrice > dealPrice && (
                                      <span className="text-[10px] text-zinc-500 line-through">
                                        KES {Number(originalPrice).toLocaleString()}
                                      </span>
                                    )}
                                  </>
                                ) : discountPct ? (
                                  <>
                                    <span className="text-sm font-bold text-white">
                                      KES {Number(originalPrice * (1 - discountPct / 100)).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 line-through">
                                      KES {Number(originalPrice).toLocaleString()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-bold text-white">
                                    KES {Number(originalPrice).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {item.max_quantity > 0 && (
                                <div className="mt-2">
                                  <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(100, (item.sold_quantity / item.max_quantity) * 100)}%`,
                                        backgroundColor: '#1a5632',
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">
                                    {item.max_quantity - item.sold_quantity} left
                                  </p>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-zinc-500">No items in this deal yet</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
