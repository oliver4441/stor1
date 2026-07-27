import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

function CountdownTimer({ endAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft('Ended');
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  return (
    <span className="font-mono text-sm font-bold tabular-nums tracking-wide">
      {timeLeft}
    </span>
  );
}

export default function FlashDealsBar() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/flash-deals/active`);
        const json = await res.json();
        if (json.success) {
          setDeals(json.data || []);
        }
      } catch (err) {
        console.warn('Failed to fetch flash deals:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (deals.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [deals.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % deals.length);
  }, [deals.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + deals.length) % deals.length);
  }, [deals.length]);

  if (loading) return null;
  if (deals.length === 0) return null;

  const currentDeal = deals[currentIndex];

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--seasonal-primary, #0d9488)' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-3">
        {/* Navigation arrows */}
        {deals.length > 1 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
            <button
              onClick={goPrev}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              aria-label="Previous deal"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
        {deals.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
            <button
              onClick={goNext}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              aria-label="Next deal"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <Link
          to="/flash-deals"
          className="flex items-center justify-center gap-4 sm:gap-6 md:gap-10 group"
        >
          {/* Label */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-5 h-5 text-yellow-300" />
            <span className="text-xs font-black uppercase tracking-widest text-yellow-300">
              Flash Deal
            </span>
          </div>

          {/* Deal Title / Banner */}
          <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
            {currentDeal.banner_url && (
              <img
                src={currentDeal.banner_url}
                alt=""
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            )}
            <span className="text-sm font-bold text-white truncate group-hover:underline underline-offset-2">
              {currentDeal.title}
            </span>
            {currentDeal.description && (
              <span className="text-xs text-white/70 hidden sm:block truncate max-w-[200px]">
                {currentDeal.description}
              </span>
            )}
          </div>

          {/* Items count */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Tag className="w-3.5 h-3.5 text-white/80" />
            <span className="text-xs font-semibold text-white/80">
              {currentDeal.items?.length || 0} item{(currentDeal.items?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-full bg-black/20">
            <Clock className="w-3.5 h-3.5 text-white/80" />
            <CountdownTimer endAt={currentDeal.end_at} />
          </div>
        </Link>
      </div>

      {/* Dots indicator */}
      {deals.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          {deals.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-white w-3' : 'bg-white/40'
              }`}
              aria-label={`Go to deal ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
