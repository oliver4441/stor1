import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  SearchX,
  MapPin,
  DollarSign,
  Package,
  Tag,
  Layers,
  Star,
  Smartphone,
  Monitor,
  Sofa,
  Shirt,
  Wrench,
  Car,
  Home,
  BookOpen,
  Dumbbell,
  Heart,
  Coffee,
  Cookie,
  UtensilsCrossed,
  MoreHorizontal,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { advancedSearch } from '../utils/api';
import { CATEGORY_INFO, getPresetSizes } from '../utils/constants';

const CONDITIONS = ['New', 'Used', 'Refurbished'];
const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];
const ITEMS_PER_PAGE = 20;

// Icon mapping for visual category grid
const CATEGORY_ICONS = {
  'Electronics': Smartphone,
  'Furniture': Sofa,
  'Clothing': Shirt,
  'Services': Wrench,
  'Vehicles': Car,
  'Home & Garden': Home,
  'Books': BookOpen,
  'Sports': Dumbbell,
  'Health & Beauty': Heart,
  'Food': UtensilsCrossed,
  'Drinks': Coffee,
  'Snacks': Cookie,
  'Bakery': MoreHorizontal,
  'Others': Monitor,
};

// Sort options for the dropdown
const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Best Rated' },
];

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive initial filters from URL params
  const getFiltersFromParams = useCallback(() => ({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    condition: searchParams.get('condition') || '',
    location: searchParams.get('location') || '',
    brand: searchParams.get('brand') || '',
    availability: searchParams.get('availability') || '',
    min_rating: searchParams.get('min_rating') || '',
    has_discount: searchParams.get('has_discount') || '',
    size: searchParams.get('size') || '',
    sort: searchParams.get('sort') || '',
    page: parseInt(searchParams.get('page')) || 1,
  }), [searchParams]);

  const [filters, setFilters] = useState(getFiltersFromParams);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localQ, setLocalQ] = useState(filters.q);

  // Sync localQ when URL q changes
  useEffect(() => {
    setLocalQ(searchParams.get('q') || '');
  }, [searchParams]);

  // Fetch results whenever filters change
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const result = await advancedSearch({
        ...filters,
        limit: ITEMS_PER_PAGE,
      });
      setListings(result.listings || []);
      setTotal(result.total || 0);
      setTotalPages(result.total_pages || 0);
      setLoading(false);
    };
    fetchResults();
  }, [filters]);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.set(key, value);
      }
    });
    // Always reset to page 1 when filters change (unless page is explicitly being set)
    if (!('page' in newFilters)) {
      params.set('page', '1');
    }
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ ...filters, q: localQ, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    updateFilters(newFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    const cleared = {
      q: '',
      category: '',
      min_price: '',
      max_price: '',
      condition: '',
      location: '',
      brand: '',
      availability: '',
      min_rating: '',
      has_discount: '',
      size: '',
      sort: '',
      page: 1,
    };
    setFilters(cleared);
    setLocalQ('');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    filters.q ||
    filters.category ||
    filters.min_price ||
    filters.max_price ||
    filters.condition ||
    filters.location ||
    filters.brand ||
    filters.availability ||
    filters.min_rating ||
    filters.has_discount ||
    filters.size;

  const selectedCondition = filters.condition
    ? filters.condition.split(',')
    : [];

  const toggleCondition = (cond) => {
    let current = selectedCondition;
    if (current.includes(cond)) {
      current = current.filter((c) => c !== cond);
    } else {
      current = [...current, cond];
    }
    handleFilterChange('condition', current.join(','));
  };

  // ── Filter Panel ──
  const filterPanel = (
    <div className="space-y-6">
      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="text-xs text-zinc-400 hover:text-red-400 font-semibold transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear all filters
        </button>
      )}

      {/* Category */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
          <Layers className="w-3.5 h-3.5" />
          Category
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(CATEGORY_INFO).map(([cat, info]) => {
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                onClick={() => handleFilterChange('category', isSelected ? '' : cat)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[var(--seasonal-primary,#1a5632)] text-white shadow-md'
                    : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <DollarSign className="w-3.5 h-3.5" />
          Price Range
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => handleFilterChange('min_price', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
          />
          <span className="text-zinc-500 text-xs">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => handleFilterChange('max_price', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <Tag className="w-3.5 h-3.5" />
          Condition
        </label>
        <div className="space-y-1.5">
          {CONDITIONS.map((cond) => (
            <label
              key={cond}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedCondition.includes(cond)}
                onChange={() => toggleCondition(cond)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[var(--seasonal-primary,#1a5632)] focus:ring-[var(--seasonal-primary,#1a5632)] focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors capitalize">
                {cond === 'Refurbished' ? 'Refurbished' : cond}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <MapPin className="w-3.5 h-3.5" />
          Location
        </label>
        <input
          type="text"
          placeholder="City or area..."
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
        />
      </div>

      {/* Brand */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <Package className="w-3.5 h-3.5" />
          Brand
        </label>
        <input
          type="text"
          placeholder="Brand name..."
          value={filters.brand}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
        />
      </div>

      {/* Availability */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <Package className="w-3.5 h-3.5" />
          Availability
        </label>
        <select
          value={filters.availability}
          onChange={(e) => handleFilterChange('availability', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
        >
          {AVAILABILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <Star className="w-3.5 h-3.5" />
          Minimum Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleFilterChange('min_rating', filters.min_rating === String(star) ? '' : String(star))}
              className="p-0.5 transition-colors hover:scale-110"
              aria-label={`${star} star${star > 1 ? 's' : ''} and up`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={parseInt(filters.min_rating) >= star ? '#facc15' : 'none'}
                stroke={parseInt(filters.min_rating) >= star ? '#facc15' : '#52525b'}
                strokeWidth="1.5"
                className="transition-colors"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          ))}
          {filters.min_rating && (
            <button
              onClick={() => handleFilterChange('min_rating', '')}
              className="text-xs text-zinc-500 hover:text-white ml-1 p-1"
              aria-label="Clear rating filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Discount */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <Tag className="w-3.5 h-3.5" />
          Discount
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.has_discount === 'true'}
            onChange={(e) => handleFilterChange('has_discount', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[var(--seasonal-primary,#1a5632)] focus:ring-[var(--seasonal-primary,#1a5632)] focus:ring-offset-0"
          />
          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
            Discounted items only
          </span>
        </label>
      </div>

      {/* Size */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" />
          Size
        </label>
        {(() => {
          const presets = getPresetSizes(filters.category);
          if (presets.length > 0) {
            return (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {presets.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleFilterChange('size', filters.size === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filters.size === s
                        ? 'bg-[var(--seasonal-primary,#1a5632)] text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            );
          }
          return null;
        })()}
        <input
          type="text"
          placeholder="Size (e.g. M, 42, Large)..."
          value={filters.size}
          onChange={(e) => handleFilterChange('size', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
        />
      </div>
    </div>
  );

  // ── Pagination ──
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const currentPage = filters.page || 1;
    const pages = [];

    // Always show first, last, and neighbors around current
    const range = 2;
    const start = Math.max(1, currentPage - range);
    const end = Math.min(totalPages, currentPage + range);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-zinc-500 text-sm">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`min-w-[36px] h-9 rounded-xl text-sm font-bold transition-colors ${
                p === currentPage
                  ? 'bg-[var(--seasonal-primary,#1a5632)] text-white shadow-lg'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // ── Results Grid ──
  const renderResults = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (listings.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 mb-4">
            <SearchX className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-zinc-400 mb-2">
            No results found
          </h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
            {hasActiveFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Try searching for something different.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
        {renderPagination()}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── Search Header ── */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-32 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none text-white text-sm shadow-sm"
            />
            {localQ && (
              <button
                type="button"
                onClick={() => {
                  setLocalQ('');
                  updateFilters({ ...filters, q: '', page: 1 });
                }}
                className="absolute right-28 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-800 text-zinc-400"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--seasonal-primary,#1a5632)] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[var(--seasonal-secondary,#14472a)] transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* ── Mobile Filter Toggle ── */}
        <div className="flex items-center justify-between mb-2 lg:hidden">
          <p className="text-sm text-zinc-400">
            {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-800 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--seasonal-primary,#1a5632)]" />
            )}
          </button>
        </div>
        {/* Mobile sort */}
        <div className="lg:hidden mb-4">
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Desktop results count ── */}
        <div className="hidden lg:flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-400">
              {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''}`}
            </p>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-[var(--seasonal-primary,#1a5632)] focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-zinc-400 hover:text-red-400 font-semibold transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* ── Main Layout ── */}
        <div className="flex gap-6 relative">
          {/* ── Sidebar (Desktop) ── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4 bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-800 p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
              {filterPanel}
            </div>
          </aside>

          {/* ── Mobile Sidebar Overlay ── */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setSidebarOpen(false)}
              />
              {/* Panel */}
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-900 border-l border-zinc-800 shadow-2xl overflow-y-auto">
                <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex items-center justify-between z-10">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">{filterPanel}</div>
              </div>
            </div>
          )}

          {/* ── Results Area ── */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.q && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    "{filters.q}"
                    <button
                      onClick={() => {
                        setLocalQ('');
                        handleFilterChange('q', '');
                      }}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    {filters.category}
                    <button
                      onClick={() => handleFilterChange('category', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(filters.min_price || filters.max_price) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    {filters.min_price ? `KES ${Number(filters.min_price).toLocaleString()}` : 'KES 0'}
                    {' - '}
                    {filters.max_price ? `KES ${Number(filters.max_price).toLocaleString()}` : 'Any'}
                    <button
                      onClick={() => {
                        handleFilterChange('min_price', '');
                        handleFilterChange('max_price', '');
                      }}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.condition && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 capitalize">
                    {filters.condition.replace(/,/g, ', ')}
                    <button
                      onClick={() => handleFilterChange('condition', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    <MapPin className="w-3 h-3" />
                    {filters.location}
                    <button
                      onClick={() => handleFilterChange('location', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.brand && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    <Package className="w-3 h-3" />
                    {filters.brand}
                    <button
                      onClick={() => handleFilterChange('brand', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.availability && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    {AVAILABILITY_OPTIONS.find((o) => o.value === filters.availability)?.label}
                    <button
                      onClick={() => handleFilterChange('availability', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.min_rating && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    <Star className="w-3 h-3" fill="#facc15" stroke="#facc15" />
                    {filters.min_rating} stars & up
                    <button
                      onClick={() => handleFilterChange('min_rating', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.has_discount && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    Discounted
                    <button
                      onClick={() => handleFilterChange('has_discount', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.size && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                    Size: {filters.size}
                    <button
                      onClick={() => handleFilterChange('size', '')}
                      className="text-zinc-500 hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {renderResults()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
