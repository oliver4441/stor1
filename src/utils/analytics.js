// Google Analytics 4 utility for Omix Store
// Usage: import { trackEvent, trackPageView } from './utils/analytics'

let gaInitialized = false;
let measurementId = null;

/**
 * Initialize Google Analytics
 * Call this once at app startup
 */
export function initGA() {
  if (typeof window === 'undefined') return;
  
  measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    console.warn('GA4: Measurement ID not configured. Skipping initialization.');
    return;
  }

  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_location: window.location.href,
    page_title: document.title,
    send_page_view: true,
    // Enhanced measurement
    allow_google_signals: true,
    allow_ad_personalization_signals: false,
  });

  gaInitialized = true;
  console.log('GA4: Initialized with measurement ID:', measurementId);
}

/**
 * Track a custom event
 * @param {string} eventName - Event name (e.g., 'user_login', 'add_to_cart')
 * @param {Object} params - Event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (!gaInitialized || !window.gtag) {
    console.debug('GA4: Not initialized, queuing event:', eventName);
    return;
  }

  window.gtag('event', eventName, {
    ...params,
    timestamp: new Date().toISOString(),
    // Omix-specific context
    app_name: 'Omix Store',
    app_version: '1.0.0',
  });
}

/**
 * Track page view (for SPA navigation)
 * @param {string} pagePath - Page path (e.g., '/listing/123')
 * @param {string} pageTitle - Page title
 */
export function trackPageView(pagePath, pageTitle = document.title) {
  if (!gaInitialized || !window.gtag) return;

  window.gtag('config', measurementId, {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
}

/**
 * Track user login
 * @param {string} method - 'google' | 'email' | 'oauth'
 * @param {string} userId - User ID
 */
export function trackUserLogin(method, userId) {
  trackEvent('user_login', {
    login_method: method,
    user_id: userId,
  });
}

/**
 * Track user signup
 * @param {string} method - 'google' | 'email' | 'oauth'
 * @param {string} userId - User ID
 */
export function trackUserSignup(method, userId) {
  trackEvent('user_signup', {
    signup_method: method,
    user_id: userId,
  });
}

/**
 * Track product view
 * @param {Object} product - Product object
 */
export function trackProductView(product) {
  trackEvent('view_item', {
    currency: 'KES',
    value: product.price || 0,
    items: [{
      item_id: product.id,
      item_name: product.title,
      item_category: product.category,
      price: product.price || 0,
      quantity: 1,
    }],
  });
}

/**
 * Track add to cart
 * @param {string} itemId - Product ID
 * @param {string} itemName - Product name
 * @param {number} price - Product price
 * @param {number} quantity - Quantity added
 */
export function trackAddToCart(itemId, itemName, price, quantity = 1) {
  trackEvent('add_to_cart', {
    currency: 'KES',
    value: (price || 0) * quantity,
    items: [{
      item_id: itemId,
      item_name: itemName,
      price: price || 0,
      quantity,
    }],
  });
}

/**
 * Track begin checkout
 * @param {Array} items - Cart items
 * @param {number} total - Total amount
 */
export function trackBeginCheckout(items, total) {
  trackEvent('begin_checkout', {
    currency: 'KES',
    value: total,
    items: items.map(item => ({
      item_id: item.product_id || item.id,
      item_name: item.product_name || item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

/**
 * Track purchase
 * @param {string} orderId - Order ID
 * @param {number} total - Total amount
 * @param {Array} items - Order items
 */
export function trackPurchase(orderId, total, items) {
  trackEvent('purchase', {
    transaction_id: orderId,
    currency: 'KES',
    value: total,
    items: items.map(item => ({
      item_id: item.product_id || item.id,
      item_name: item.product_name || item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

/**
 * Track search
 * @param {string} searchTerm - Search query
 * @param {number} resultsCount - Number of results
 */
export function trackSearch(searchTerm, resultsCount) {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

/**
 * Track email campaign interaction
 * @param {string} campaignType - Campaign type
 * @param {string} action - 'sent' | 'open' | 'click'
 * @param {string} linkUrl - URL clicked (for click action)
 */
export function trackEmailCampaign(campaignType, action, linkUrl = null) {
  trackEvent('email_campaign', {
    campaign_type: campaignType,
    campaign_action: action,
    link_url: linkUrl,
  });
}

/**
 * Track error
 * @param {string} errorMessage - Error message
 * @param {string} errorLocation - Where error occurred
 */
export function trackError(errorMessage, errorLocation) {
  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    error_location: errorLocation,
  });
}

/**
 * Set user properties for segmentation
 * @param {Object} properties - User properties
 */
export function setUserProperties(properties) {
  if (!gaInitialized || !window.gtag) return;

  window.gtag('set', 'user_properties', {
    ...properties,
    app_name: 'Omix Store',
  });
}

/**
 * Set user ID for cross-device tracking
 * @param {string} userId - User ID
 */
export function setUserId(userId) {
  if (!gaInitialized || !window.gtag) return;

  window.gtag('config', measurementId, {
    user_id: userId,
  });
}

export default {
  initGA,
  trackEvent,
  trackPageView,
  trackUserLogin,
  trackUserSignup,
  trackProductView,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackEmailCampaign,
  trackError,
  setUserProperties,
  setUserId,
};