import { useState, useEffect } from 'react';
import { Package, Percent, ShoppingCart, Loader2 } from 'lucide-react';
import { getActiveBundles } from '../utils/api';
import { formatKES } from '../utils/constants';
import { useCart } from '../context/CartContext';

export default function BundleDisplay({ listingId }) {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [added, setAdded] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    let mounted = true;

    const fetchBundles = async () => {
      try {
        const data = await getActiveBundles();
        if (!mounted) return;

        if (data?.success && Array.isArray(data.bundles)) {
          // Filter bundles that include this listingId
          const relevant = data.bundles.filter(
            (b) => b.items && b.items.some((item) => item.id === listingId)
          );
          setBundles(relevant);
        } else if (Array.isArray(data)) {
          // Some endpoints return array directly
          const relevant = data.filter(
            (b) => b.items && b.items.some((item) => item.id === listingId)
          );
          setBundles(relevant);
        }
      } catch (err) {
        console.error('Failed to load bundles:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBundles();
    return () => { mounted = false; };
  }, [listingId]);

  const handleBuyBundle = async (bundle) => {
    if (adding) return;
    setAdding(bundle.id);

    // Add all items in the bundle to cart
    try {
      for (const item of bundle.items) {
        addItem({
          id: item.id,
          name: item.title || item.name,
          price: item.price,
          image_url: item.image || item.images?.[0] || null,
          quantity: 1,
        });
        // Small delay between adds for visual effect
        await new Promise((r) => setTimeout(r, 100));
      }
      setAdded(bundle.id);
      setTimeout(() => setAdded(null), 2000);
    } catch (err) {
      console.error('Failed to add bundle items:', err);
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1E2A3D] border border-[#353F54] rounded-2xl p-5 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#8E9BB5]" />
        <span className="text-sm text-[#8E9BB5]">Loading bundles…</span>
      </div>
    );
  }

  if (bundles.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Package className="w-4 h-4 text-[#8E9BB5]" />
        Available Bundles
      </h3>

      {bundles.map((bundle) => (
        <div
          key={bundle.id}
          className="bg-[#1E2A3D] border border-[#353F54] rounded-2xl p-4 hover:border-[#4A5678] transition-colors"
        >
          {/* Bundle header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-white truncate">
                {bundle.name}
              </h4>
              {bundle.description && (
                <p className="text-xs text-[#8E9BB5] mt-0.5 line-clamp-2">
                  {bundle.description}
                </p>
              )}
            </div>

            {/* Discount badge */}
            {bundle.discount_percent > 0 && (
              <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold ml-3">
                <Percent className="w-3 h-3" />
                {bundle.discount_percent}% OFF
              </span>
            )}
          </div>

          {/* Bundle items list */}
          <div className="space-y-1.5 mb-4">
            <p className="text-xs font-medium text-[#8E9BB5] uppercase tracking-wider">
              Includes:
            </p>
            <ul className="space-y-1">
              {bundle.items.map((item, idx) => (
                <li
                  key={item.id || idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white truncate mr-2">
                    {item.title || item.name}
                  </span>
                  <span className="text-[#8E9BB5] shrink-0 text-xs">
                    {formatKES(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bundle total + buy button */}
          <div className="flex items-center justify-between pt-3 border-t border-[#353F54]">
            <div>
              <span className="text-xs text-[#8E9BB5]">Bundle price</span>
              <p className="text-lg font-black text-white">
                {bundle.total_price != null
                  ? formatKES(bundle.total_price)
                  : '—'}
              </p>
            </div>

            <button
              onClick={() => handleBuyBundle(bundle)}
              disabled={adding === bundle.id}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                added === bundle.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#353F54] text-white hover:bg-[#4A5678]'
              } disabled:opacity-60`}
            >
              {adding === bundle.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {added === bundle.id ? 'Added!' : 'Buy Bundle'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
