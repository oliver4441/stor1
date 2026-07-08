// Omix Visitor Tracking & Analytics Utility
// Browser-side tracking: cookies, localStorage, page views, product views, cart adds, purchases

// ── Cookie helpers ──────────────────────────────────────────
function setCookie(name, value, days) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
  } catch (e) {
    // Silently fail if cookies are blocked
  }
}

function getCookie(name) {
  try {
    return document.cookie.split('; ').reduce((r, v) => {
      const [k, val] = v.split('=');
      return k === name ? decodeURIComponent(val) : r;
    }, null);
  } catch (e) {
    return null;
  }
}

// ── UUID generator ──────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Visitor ID (persistent, 365 days) ─────────────────────
export function getVisitorId() {
  let visitorId = getCookie('omix_visitor_id');
  if (!visitorId) {
    visitorId = generateUUID();
    setCookie('omix_visitor_id', visitorId, 365);
  }
  return visitorId;
}

// ── Session ID (30 min, renewed on activity) ───────────────
export function getSessionId() {
  let sessionId = getCookie('omix_session_id');
  const lastActivity = localStorage.getItem('omix_last_activity');
  const now = Date.now();
  
  // If no session or last activity was > 30 min ago, create new session
  if (!sessionId || !lastActivity || (now - parseInt(lastActivity)) > 30 * 60 * 1000) {
    sessionId = generateUUID();
    setCookie('omix_session_id', sessionId, 0.0208); // ~30 min in days
  }
  
  // Renew activity timestamp
  localStorage.setItem('omix_last_activity', now.toString());
  // Renew cookie expiry
  setCookie('omix_session_id', sessionId, 0.0208);
  
  return sessionId;
}

// ── Track Page View ────────────────────────────────────────
export function trackPageView() {
  try {
    const count = parseInt(localStorage.getItem('omix_page_views') || '0', 10);
    localStorage.setItem('omix_page_views', (count + 1).toString());
  } catch (e) {}
}

// ── Track Product View ─────────────────────────────────────
export function trackProductView(productId) {
  try {
    const viewed = JSON.parse(localStorage.getItem('omix_viewed_products') || '[]');
    if (!viewed.includes(productId)) {
      viewed.push(productId);
      // Keep last 100 viewed products
      if (viewed.length > 100) viewed.shift();
      localStorage.setItem('omix_viewed_products', JSON.stringify(viewed));
    }
  } catch (e) {}
}

// ── Get Viewed Products ────────────────────────────────────
export function getViewedProducts() {
  try {
    return JSON.parse(localStorage.getItem('omix_viewed_products') || '[]');
  } catch (e) {
    return [];
  }
}

// ── Track Cart Addition ────────────────────────────────────
export function trackCartAdd(productId) {
  try {
    const count = parseInt(localStorage.getItem('omix_cart_adds') || '0', 10);
    localStorage.setItem('omix_cart_adds', (count + 1).toString());
    
    // Also track which products were added to cart
    const cartProducts = JSON.parse(localStorage.getItem('omix_cart_products') || '[]');
    if (!cartProducts.includes(productId)) {
      cartProducts.push(productId);
      localStorage.setItem('omix_cart_products', JSON.stringify(cartProducts));
    }
  } catch (e) {}
}

// ── Track Add to Cart (GA4 compatibility) ──────────────────
export function trackAddToCart(itemId, itemName, price, quantity = 1) {
  // GA4 tracking if available
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'add_to_cart', {
        currency: 'KES',
        value: (price || 0) * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price || 0,
          quantity,
        }],
      });
    } catch (e) {}
  }
  // Also track in localStorage
  trackCartAdd(itemId);
}

// ── Generic GA4 Event Sender ──────────────────────────────
export function trackGA4Event(eventName, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, params);
    } catch (e) {}
  }
}

// ── Track Add to Wishlist (GA4) ───────────────────────────
export function trackAddToWishlistGA(itemId, itemName, price) {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'add_to_wishlist', {
        currency: 'KES',
        value: price || 0,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price || 0,
          quantity: 1,
        }],
      });
    } catch (e) {}
  }
}

// ── Track Share (GA4) ─────────────────────────────────────
export function trackShareGA(contentType, itemId) {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'share', {
        content_type: contentType || '',
        item_id: itemId || '',
      });
    } catch (e) {}
  }
}

// ── Track Purchase (GA4 enhanced) ─────────────────────────
export function trackPurchase(productIds, orderData = null) {
  // Local storage tracking (backwards compatible)
  try {
    const purchases = JSON.parse(localStorage.getItem('omix_purchases') || '[]');
    const newPurchases = Array.isArray(productIds) ? productIds : [productIds];
    purchases.push(...newPurchases);
    localStorage.setItem('omix_purchases', JSON.stringify(purchases));
  } catch (e) {}

  // GA4 purchase event if order data is provided
  if (orderData && typeof window !== 'undefined' && window.gtag) {
    try {
      const items = (orderData.items || []).map(item => ({
        item_id: item.id || item.item_id || '',
        item_name: item.name || item.item_name || '',
        item_category: item.category || item.item_category || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        item_brand: item.brand || item.item_brand || '',
      }));

      window.gtag('event', 'purchase', {
        transaction_id: orderData.transaction_id || orderData.id || '',
        value: orderData.total || orderData.value || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        currency: 'KES',
        coupon: orderData.coupon || '',
        items,
      });
    } catch (e) {}
  }
}

// ── Get all tracking data (for analytics API) ──────────────
export function getTrackingData() {
  return {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    pageViews: parseInt(localStorage.getItem('omix_page_views') || '0', 10),
    viewedProducts: getViewedProducts(),
    cartAdds: parseInt(localStorage.getItem('omix_cart_adds') || '0', 10),
    purchases: JSON.parse(localStorage.getItem('omix_purchases') || '[]'),
  };
}

// ── Initialize all tracking on app mount ───────────────────
export function initTracking() {
  getVisitorId();
  getSessionId();
  trackPageView();

  // Send GA4 page_view if gtag is available
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', 'page_view', {
        page_title: document?.title || '',
        page_location: window?.location?.href || '',
        page_path: window?.location?.pathname || '/',
      });
    } catch (e) {}
  }
}

// ── User auth tracking events ─────────────────────────────
export function trackUserLogin() {
  try { trackAddToCart('__login__', 'Login', 0); } catch (e) {}
}

export function trackUserSignup() {
  try { trackAddToCart('__signup__', 'Signup', 0); } catch (e) {}
}

export function trackError(error) {
  try {
    const errors = JSON.parse(localStorage.getItem('omix_errors') || '[]');
    errors.push({ message: String(error).slice(0, 200), time: Date.now() });
    if (errors.length > 50) errors.shift();
    localStorage.setItem('omix_errors', JSON.stringify(errors));
  } catch (e) {}
}

export function trackBeginCheckout() {
  try {
    const count = parseInt(localStorage.getItem('omix_checkouts') || '0', 10);
    localStorage.setItem('omix_checkouts', (count + 1).toString());
  } catch (e) {}
}

export default {
  getVisitorId,
  getSessionId,
  trackPageView,
  trackProductView,
  getViewedProducts,
  trackCartAdd,
  trackAddToCart,
  trackPurchase,
  getTrackingData,
  initTracking,
};
