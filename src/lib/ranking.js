/**
 * Deterministic, explainable product ranking.
 * Replace rankProducts() later with personalized/ML ranking without changing listing UI.
 */

const RECENTLY_VIEWED_KEY = 'omix_recently_viewed';

export function getRecentlyViewed() {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function daysSince(iso) {
  if (!iso) return 365;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 365;
  return Math.max(0, (Date.now() - t) / 86400000);
}

function queryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function scoreListing(listing, context = {}) {
  const query = queryTokens(context.query);
  const title = String(listing.title || '').toLowerCase();
  const description = String(listing.description || '').toLowerCase();
  const brand = String(listing.brand || '').toLowerCase();
  const category = String(listing.category || '').toLowerCase();
  const viewed = context.recentlyViewed || [];
  const viewedIds = new Set(viewed.map((item) => item.id));
  const viewedCategories = new Set(viewed.map((item) => item.category).filter(Boolean));

  let relevance = 0;
  if (query.length) {
    query.forEach((token) => {
      if (title.includes(token)) relevance += 28;
      else if (brand.includes(token)) relevance += 18;
      else if (category.includes(token)) relevance += 12;
      else if (description.includes(token)) relevance += 6;
    });
  }

  const rating = num(listing.avg_rating);
  const reviews = num(listing.review_count);
  const sales = num(listing.purchase_count);
  const qty = listing.quantity == null ? 1 : num(listing.quantity);
  const available = listing.status !== 'sold' && qty > 0;
  const compare = num(listing.compare_at_price);
  const price = num(listing.flash_sale_price || listing.price);
  const discount = compare > price && price > 0 ? (1 - price / compare) * 100 : 0;
  const freshness = Math.max(0, 30 - daysSince(listing.created_at));
  const viewedBoost = viewedIds.has(listing.id) ? 8 : viewedCategories.has(listing.category) ? 10 : 0;

  const score =
    relevance +
    rating * 6 +
    Math.min(reviews, 40) * 0.4 +
    Math.min(sales, 80) * 0.35 +
    (available ? 12 : -20) +
    Math.min(discount, 50) * 0.25 +
    freshness * 0.4 +
    viewedBoost;

  const reasons = [];
  if (relevance >= 28) reasons.push({ code: 'relevance', label: 'Matches your search' });
  if (rating >= 4 && reviews > 0) reasons.push({ code: 'rating', label: 'Best rated' });
  if (sales >= 5) reasons.push({ code: 'popular', label: 'Popular' });
  if (discount >= 10) reasons.push({ code: 'value', label: 'Best value' });
  if (viewedCategories.has(listing.category) && !viewedIds.has(listing.id) && listing.category) {
    reasons.push({ code: 'because_viewed', label: `Because you viewed ${listing.category.toLowerCase()}` });
  }
  if (freshness >= 20) reasons.push({ code: 'fresh', label: 'Just listed' });
  if (listing.flash_sale_price && listing.flash_sale_ends_at) reasons.push({ code: 'deal', label: 'On promotion' });

  return { score, reasons };
}

export function rankProducts(listings, context = {}) {
  if (!Array.isArray(listings) || listings.length === 0) return [];
  const recentlyViewed = context.recentlyViewed || (typeof window !== 'undefined' ? getRecentlyViewed() : []);
  return listings
    .map((listing) => {
      const { score, reasons } = scoreListing(listing, { ...context, recentlyViewed });
      return { ...listing, _rankScore: score, _rankReasons: reasons };
    })
    .sort((a, b) => b._rankScore - a._rankScore);
}

export function applyListingSort(listings, sort, context = {}) {
  const items = Array.isArray(listings) ? [...listings] : [];
  if (sort === 'price_asc') return items.sort((a, b) => num(a.price) - num(b.price));
  if (sort === 'price_desc') return items.sort((a, b) => num(b.price) - num(a.price));
  if (sort === 'rating_desc') return items.sort((a, b) => num(b.avg_rating) - num(a.avg_rating));
  if (sort === 'newest' || sort === 'new') {
    return items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
  return rankProducts(items, context);
}
