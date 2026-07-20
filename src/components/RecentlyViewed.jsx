import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import AutoScrollCarousel from './AutoScrollCarousel';

const RECENTLY_VIEWED_KEY = 'omix_recently_viewed';
const MAX_RECENT = 10;

export function trackViewedProduct(listing) {
  if (!listing) return;
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    let viewed = stored ? JSON.parse(stored) : [];
    viewed = viewed.filter(p => p.id !== listing.id);
    viewed.unshift({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      images: listing.images,
      category: listing.category,
      brand: listing.brand,
      condition: listing.condition,
      quantity: listing.quantity,
      location: listing.location,
    });
    viewed = viewed.slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(viewed));
  } catch {}
}

export default function RecentlyViewed({ currentListing, allListings }) {
  const [viewedProducts, setViewedProducts] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const viewed = stored ? JSON.parse(stored) : [];
      const filtered = currentListing
        ? viewed.filter(p => p.id !== currentListing.id)
        : viewed;
      setViewedProducts(filtered.slice(0, 8));
    } catch {
      setViewedProducts([]);
    }
  }, [currentListing?.id]);

  if (viewedProducts.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-zinc-800">
      <h2 className="text-xl font-bold mb-6 text-white">Recently Viewed</h2>
      <AutoScrollCarousel itemMinWidth={180} gap={16} speed={25}>
        {viewedProducts.map(product => (
          <div key={product.id} className="flex-shrink-0 w-[180px]">
            <ProductCard listing={product} />
          </div>
        ))}
      </AutoScrollCarousel>
    </div>
  );
}
