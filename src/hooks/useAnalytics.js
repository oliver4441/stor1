import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ── GA4 item schema formatter ──────────────────────────────
export function formatGA4Item(product) {
  return {
    item_id: product?.id || product?.item_id || '',
    item_name: product?.name || product?.item_name || '',
    item_category: product?.category || product?.item_category || '',
    price: product?.price ?? 0,
    quantity: product?.quantity ?? 1,
    item_brand: product?.brand || product?.item_brand || '',
  };
}

// ── Safe gtag caller ───────────────────────────────────────
function gtag(...args) {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag(...args);
    } catch (e) {
      // Silently skip if gtag throws
    }
  }
}

// ── useAnalytics hook ──────────────────────────────────────
export default function useAnalytics() {
  const location = useLocation();

  // Track page view on route change
  useEffect(() => {
    gtag('event', 'page_view', {
      page_title: document?.title || '',
      page_location: window?.location?.href || '',
      page_path: location?.pathname || '/',
    });
  }, [location]);

  // ── Page View ────────────────────────────────────────────
  const trackPageView = useCallback((pageTitle, pagePath) => {
    gtag('event', 'page_view', {
      page_title: pageTitle || document?.title || '',
      page_location: window?.location?.href || '',
      page_path: pagePath || location?.pathname || '/',
    });
  }, [location]);

  // ── View Item ────────────────────────────────────────────
  const trackViewItem = useCallback((product) => {
    if (!product) return;
    const item = formatGA4Item(product);
    gtag('event', 'view_item', {
      currency: 'KES',
      value: item.price,
      items: [item],
    });
  }, []);

  // ── View Item List ───────────────────────────────────────
  const trackViewItemList = useCallback((items, listName) => {
    if (!items || !items.length) return;
    gtag('event', 'view_item_list', {
      currency: 'KES',
      item_list_name: listName || '',
      items: items.map(formatGA4Item),
    });
  }, []);

  // ── Add to Cart ──────────────────────────────────────────
  const trackAddToCart = useCallback((product, quantity = 1) => {
    if (!product) return;
    const item = formatGA4Item(product);
    item.quantity = quantity;
    gtag('event', 'add_to_cart', {
      currency: 'KES',
      value: (item.price || 0) * quantity,
      items: [item],
    });
  }, []);

  // ── Remove from Cart ─────────────────────────────────────
  const trackRemoveFromCart = useCallback((product, quantity = 1) => {
    if (!product) return;
    const item = formatGA4Item(product);
    item.quantity = quantity;
    gtag('event', 'remove_from_cart', {
      currency: 'KES',
      value: (item.price || 0) * quantity,
      items: [item],
    });
  }, []);

  // ── Begin Checkout ───────────────────────────────────────
  const trackBeginCheckout = useCallback((items, coupon) => {
    if (!items || !items.length) return;
    const formattedItems = items.map(formatGA4Item);
    const totalValue = formattedItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const params = {
      currency: 'KES',
      value: totalValue,
      coupon: coupon || '',
      items: formattedItems,
    };
    gtag('event', 'begin_checkout', params);
  }, []);

  // ── Purchase ─────────────────────────────────────────────
  const trackPurchase = useCallback((order) => {
    if (!order) return;
    const items = (order.items || []).map(formatGA4Item);
    gtag('event', 'purchase', {
      transaction_id: order.transaction_id || order.id || '',
      value: order.total || order.value || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      currency: 'KES',
      coupon: order.coupon || '',
      items,
    });
  }, []);

  // ── Search ───────────────────────────────────────────────
  const trackSearch = useCallback((searchTerm) => {
    gtag('event', 'search', {
      search_term: searchTerm || '',
    });
  }, []);

  // ── Login ────────────────────────────────────────────────
  const trackLogin = useCallback((method) => {
    gtag('event', 'login', {
      method: method || '',
    });
  }, []);

  // ── Sign Up ──────────────────────────────────────────────
  const trackSignup = useCallback((method) => {
    gtag('event', 'sign_up', {
      method: method || '',
    });
  }, []);

  // ── Share ────────────────────────────────────────────────
  const trackShare = useCallback((contentType, itemId) => {
    gtag('event', 'share', {
      content_type: contentType || '',
      item_id: itemId || '',
    });
  }, []);

  // ── Exception ────────────────────────────────────────────
  const trackException = useCallback((description, fatal = false) => {
    gtag('event', 'exception', {
      description: description || '',
      fatal: fatal ? 1 : 0,
    });
  }, []);

  // ── Add to Wishlist ──────────────────────────────────────
  const trackAddToWishlist = useCallback((product) => {
    if (!product) return;
    const item = formatGA4Item(product);
    gtag('event', 'add_to_wishlist', {
      currency: 'KES',
      value: item.price,
      items: [item],
    });
  }, []);

  return {
    trackPageView,
    trackViewItem,
    trackViewItemList,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackPurchase,
    trackSearch,
    trackLogin,
    trackSignup,
    trackShare,
    trackException,
    trackAddToWishlist,
  };
}
