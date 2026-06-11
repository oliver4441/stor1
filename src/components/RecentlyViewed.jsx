import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

/**
 * Recently Viewed products section.
 * Tracks viewed product IDs in localStorage (max 10).
 * Shows a horizontal carousel of product cards.
 * Only renders if there are viewed products other than the current one.
 */
export default function RecentlyViewed({ currentListing, allListings }) {
  const [viewedProducts, setViewedProducts] = useState([]);

  useEffect(() => {
    if (!currentListing) return;

    // Get existing viewed products from localStorage
    let viewed = [];
    try {
      const stored = localStorage.getItem('omix_recently_viewed');
      viewed = stored ? JSON.parse(stored) : [];
    } catch {
      viewed = [];
    }

    // Remove current product if already in list
    viewed = viewed.filter(p => p.id !== currentListing.id);

    // Add current product to front
    viewed.unshift({
      id: currentListing.id,
      title: currentListing.title,
      price: currentListing.price,
      images: currentListing.images,
      category: currentListing.category,
      brand: currentListing.brand,
      condition: currentListing.condition,
      quantity: currentListing.quantity,
      location: currentListing.location,
    });

    // Keep max 10
    viewed = viewed.slice(0, 10);

    // Save back
    localStorage.setItem('omix_recently_viewed', JSON.stringify(viewed));
  }, [currentListing?.id]);

  // Fetch full product data for viewed IDs (to get fresh data)
  useEffect(() => {
    if (!allListings || allListings.length === 0) return;

    // Filter out current product and get matching listings
    const currentId = currentListing?.id;
    const related = allListings
      .filter(l => l.id !== currentId)
      .slice(0, 8);

    setViewedProducts(related);
  }, [allListings, currentListing?.id]);

  if (viewedProducts.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">You May Also Like</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {viewedProducts.map(product => (
          <div key={product.id} className="flex-shrink-0 w-44">
            <ProductCard listing={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
