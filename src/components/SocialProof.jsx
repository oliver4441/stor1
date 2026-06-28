import { TrendingUp, Eye, Zap } from 'lucide-react';

/**
 * Social proof indicators for product listings.
 * Shows randomized but consistent "viewing" activity signals.
 * Uses product ID as seed so the same product always shows the same numbers.
 */

// Simple hash from product ID to get consistent "random" numbers
function seededRandom(seed) {
  let h = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function ProductSocialBadge({ listing }) {
  const seed = seededRandom(listing.id);

  // Only show on ~40% of products (deterministic)
  const showType = seed % 5;
  if (showType === 0) return null;

  const viewingCount = 5 + (seed % 25); // 5-29 viewing
  const soldCount = 1 + (seed % 15); // 1-15 sold
  const isHot = showType === 1;

  if (isHot) {
    return (
      <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
        <Zap className="w-2.5 h-2.5" /> Hot
      </span>
    );
  }

  if (showType === 2) {
    return (
      <span className="flex items-center gap-1 bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
        <Eye className="w-2.5 h-2.5" /> {viewingCount} viewing
      </span>
    );
  }

  if (showType === 3) {
    return (
      <span className="flex items-center gap-1 bg-green-900/20 text-green-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
        <TrendingUp className="w-2.5 h-2.5" /> {soldCount} sold
      </span>
    );
  }

  return null;
}

export function ListingSocialProof({ listing }) {
  const seed = seededRandom(listing.id);
  const viewingCount = 5 + (seed % 25);
  const soldCount = 1 + (seed % 15);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="flex items-center gap-1 text-xs text-zinc-400">
        <Eye className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-bold text-zinc-300">{viewingCount}</span> people viewing this
      </span>
      <span className="flex items-center gap-1 text-xs text-zinc-400">
        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
        <span className="font-bold text-zinc-300">{soldCount}</span> sold recently
      </span>
    </div>
  );
}
