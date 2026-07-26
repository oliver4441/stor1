import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Scale, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatKES } from '../utils/constants';
import Breadcrumb from '../components/Breadcrumb';
import { GooeyLoader } from '@/components/ui/loader-10';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diffMode, setDiffMode] = useState(false);
  const [shared, setShared] = useState(false);

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
      window.history.pushState({}, '', '/');
      window.location.href = '/';
      return;
    }
    const params = new URLSearchParams();
    params.set('ids', newIds.join(','));
    window.history.pushState({}, '', `/compare?${params.toString()}`);
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

  // Define all comparison rows
  const rows = useMemo(() => {
    const base = [
      { label: 'Condition', getValue: (l) => l.condition?.replace(/_/g, ' ') || '-' },
      { label: 'Category', getValue: (l) => l.category || '-' },
      { label: 'Description', getValue: (l) => l.description || '-' },
      { label: 'Location', getValue: (l) => l.location || l.location_city || '-' },
    ];
    const specRows = allSpecKeys.map(key => ({
      label: specLabels[key],
      getValue: (l) => (l[key] !== null && l[key] !== undefined) ? String(l[key]) : '-',
    }));
    return [...base, ...specRows];
  }, []);

  // Determine which rows have differences (for diff highlight mode)
  const diffRows = useMemo(() => {
    if (listings.length < 2) return new Set();
    const differing = new Set();
    for (const row of rows) {
      const values = listings.map(l => row.getValue(l));
      const unique = new Set(values);
      if (unique.size > 1) {
        differing.add(row.label);
      }
    }
    return differing;
  }, [listings, rows]);

  const handleShareWhatsApp = () => {
    if (listings.length === 0) return;
    let message = 'Product Comparison on Omix:\n\n';
    listings.forEach((l, i) => {
      const price = l.flash_sale_price ? formatKES(l.flash_sale_price) : formatKES(l.price);
      message += `${i + 1}. ${l.title}\n`;
      message += `   Price: ${price}\n`;
      message += `   Link: ${window.location.origin}/listing/${l.id}\n\n`;
    });
    message += 'Compare more at Omix Store.';
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <GooeyLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Scale className="w-16 h-16 text-[#8E9BB5] mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Compare Products</h1>
        <p className="text-[#4A5771] mb-8">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-[var(--seasonal-primary,#71717a)] text-white font-bold px-6 py-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Scale className="w-16 h-16 text-[#8E9BB5] mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">No Results</h1>
        <p className="text-[#4A5771] mb-8">Could not find the selected listings.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-[var(--seasonal-primary,#71717a)] text-white font-bold px-6 py-3 rounded-xl">
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
            <Scale className="w-6 h-6 text-[var(--seasonal-primary,#71717a)]" /> Compare Products
          </h1>
          <p className="text-[#4A5771] text-sm">Comparing {listings.length} product{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Difference highlight toggle */}
          {listings.length >= 2 && (
            <button
              onClick={() => setDiffMode(!diffMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                diffMode
                  ? 'bg-[var(--seasonal-primary,#71717a)] text-white'
                  : 'bg-[#28303F] text-[#8E9BB5] hover:bg-zinc-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Highlight Differences
            </button>
          )}
          {/* Share on WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-[#20BD5A] transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#28303F] text-[#8E9BB5] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#28303F] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      {shared && (
        <div className="mb-4 text-center text-sm font-medium text-[#38B8EA] bg-[#71717a]/20 px-4 py-2 rounded-xl animate-fade-in">
          Comparison shared to WhatsApp!
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-[#242C3B] z-10 p-3 text-left text-xs font-bold text-[#4A5771] uppercase tracking-wider min-w-[120px] border-b border-[#353F54]">
                Feature
              </th>
              {listings.map(listing => (
                <th key={listing.id} className="p-3 text-center border-b border-[#353F54] min-w-[200px]">
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
                      <div className="aspect-square bg-[#28303F] rounded-xl overflow-hidden mb-3 max-w-[180px] mx-auto">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#4A5771]">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white truncate hover:text-[var(--seasonal-primary,#71717a)] transition-colors">
                        {listing.title}
                      </h3>
                    </Link>
                    <p className="text-[var(--seasonal-primary,#71717a)] font-bold text-sm mt-1">
                      {listing.flash_sale_price ? formatKES(listing.flash_sale_price) : formatKES(listing.price)}
                    </p>
                    {listing.compare_at_price && listing.compare_at_price > listing.price && (
                      <p className="text-xs text-[#4A5771] line-through">{formatKES(listing.compare_at_price)}</p>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const hasDiff = diffRows.has(row.label);
              const isHighlighted = diffMode && hasDiff;
              const isDimmed = diffMode && !hasDiff;
              return (
                <tr key={row.label} className={`border-b border-zinc-100 dark:border-[#353F54] ${
                  isHighlighted ? 'bg-yellow-900/10' : ''
                }`}>
                  <td className={`sticky left-0 bg-[#242C3B] z-10 p-3 text-sm font-bold ${
                    isHighlighted ? 'text-yellow-400' : 'text-[#8E9BB5]'
                  }`}>
                    {row.label}
                    {isHighlighted && (
                      <svg className="w-3 h-3 inline-block ml-1 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </td>
                  {listings.map(listing => {
                    const value = row.getValue(listing);
                    const values = listings.map(l => row.getValue(l));
                    const isDifferent = hasDiff && values.filter(v => v !== value).length > 0;
                    return (
                      <td key={listing.id} className={`p-3 text-center text-sm ${
                        isDimmed ? 'text-zinc-600' :
                        isDifferent ? 'text-yellow-400 font-bold bg-yellow-900/20' :
                        'text-[#4A5771]'
                      }`}>
                        {row.label === 'Description' ? (
                          <p className="line-clamp-4">{value}</p>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[var(--seasonal-primary,#71717a)] text-white font-bold px-8 py-3 rounded-xl hover:bg-[var(--seasonal-secondary,#71717a)] transition-all shadow-lg shadow-[var(--seasonal-primary,#71717a)]/20"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Browsing
        </Link>
        <button
          onClick={handleShareWhatsApp}
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#20BD5A] transition-all shadow-lg"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}
