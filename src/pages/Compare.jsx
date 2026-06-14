import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Scale, X, Package, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      setError('No listings selected for comparison. Please select at least 2 items.');
      return;
    }

    const ids = idsParam.split(',').map(Number).filter(id => !isNaN(id));
    if (ids.length < 1) {
      setLoading(false);
      setError('No valid listing IDs provided.');
      return;
    }

    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .in('id', ids);
        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        console.error('Compare fetch error:', err);
        setError('Failed to load listings for comparison.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [idsParam]);

  const removeFromCompare = (id) => {
    const currentIds = idsParam.split(',').map(Number).filter(i => !isNaN(i));
    const newIds = currentIds.filter(i => i !== id);
    if (newIds.length === 0) {
      // Navigate away if nothing left
      window.history.pushState({}, '', '/');
      window.location.href = '/';
      return;
    }
    const params = new URLSearchParams();
    params.set('ids', newIds.join(','));
    window.history.pushState({}, '', `/compare?${params.toString()}`);
    // Re-fetch by removing from local state
    setListings(prev => prev.filter(l => l.id !== id));
  };

  // Collect all unique spec keys across listings
  const allSpecKeys = ['brand', 'model', 'color', 'weight', 'sku', 'quantity'];
  const specLabels = {
    brand: 'Brand',
    model: 'Model',
    color: 'Color',
    weight: 'Weight',
    quantity: 'Quantity',
    sku: 'SKU',
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500">Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Scale className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Compare Products</h1>
        <p className="text-zinc-500 mb-8">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-[#ff385c] text-white font-bold px-6 py-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Scale className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">No Results</h1>
        <p className="text-zinc-500 mb-8">Could not find the selected listings.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-[#ff385c] text-white font-bold px-6 py-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="compare-page">
      <Breadcrumb />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#ff385c]" /> Compare Products
          </h1>
          <p className="text-zinc-500 text-sm">Comparing {listings.length} product{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white dark:bg-zinc-950 z-10 p-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider min-w-[120px] border-b border-zinc-200 dark:border-zinc-800">
                Feature
              </th>
              {listings.map(listing => (
                <th key={listing.id} className="p-3 text-center border-b border-zinc-200 dark:border-zinc-800 min-w-[200px]">
                  <div className="relative">
                    <button
                      onClick={() => removeFromCompare(listing.id)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                      aria-label="Remove from comparison"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <Link to={`/listing/${listing.id}`}>
                      {/* Image */}
                      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden mb-3 max-w-[180px] mx-auto">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate hover:text-[#ff385c] transition-colors">
                        {listing.title}
                      </h3>
                    </Link>
                    <p className="text-[#ff385c] font-bold text-sm mt-1">
                      {listing.flash_sale_price ? formatKES(listing.flash_sale_price) : formatKES(listing.price)}
                    </p>
                    {listing.compare_at_price && listing.compare_at_price > listing.price && (
                      <p className="text-xs text-zinc-400 line-through">{formatKES(listing.compare_at_price)}</p>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Condition */}
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="sticky left-0 bg-white dark:bg-zinc-950 z-10 p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Condition
              </td>
              {listings.map(listing => (
                <td key={listing.id} className="p-3 text-center text-sm text-zinc-600 dark:text-zinc-400 capitalize">
                  {listing.condition?.replace(/_/g, ' ') || '—'}
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="sticky left-0 bg-white dark:bg-zinc-950 z-10 p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Category
              </td>
              {listings.map(listing => (
                <td key={listing.id} className="p-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  {listing.category || '—'}
                </td>
              ))}
            </tr>

            {/* Description */}
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="sticky left-0 bg-white dark:bg-zinc-950 z-10 p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Description
              </td>
              {listings.map(listing => (
                <td key={listing.id} className="p-3 text-center text-sm text-zinc-600 dark:text-zinc-400 max-w-[250px]">
                  <p className="line-clamp-4">{listing.description || '—'}</p>
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="sticky left-0 bg-white dark:bg-zinc-950 z-10 p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Location
              </td>
              {listings.map(listing => (
                <td key={listing.id} className="p-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  {listing.location || listing.location_city || '—'}
                </td>
              ))}
            </tr>

            {/* Specs */}
            {allSpecKeys.map(key => (
              <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="sticky left-0 bg-white dark:bg-zinc-950 z-10 p-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {specLabels[key]}
                </td>
                {listings.map(listing => (
                  <td key={listing.id} className="p-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    {listing[key] ? String(listing[key]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#ff385c] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Browsing
        </Link>
      </div>
    </div>
  );
}
