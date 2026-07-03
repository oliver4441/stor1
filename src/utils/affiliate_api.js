// Affiliate API Layer
// All data goes through backend API — no direct Supabase queries from frontend
import { supabase } from './supabase';
import { AFFILIATE_CONFIG, getReferralLink } from '../config/affiliate';

// ─── Auth Helper ───────────────────────────────────────────────
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      token = stored?.currentSession?.access_token || stored?.access_token;
    } catch {}
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiGet(url) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers, credentials: 'include' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

async function apiPost(url, body = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

// ─── Affiliate Profile ─────────────────────────────────────────
export async function getAffiliateProfile(userId) {
  try {
    return await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.PROFILE}/${userId}`);
  } catch (err) {
    console.error('getAffiliateProfile error:', err);
    return null;
  }
}

// ─── Dashboard (aggregated stats) ──────────────────────────────
export async function getDashboardStats(affiliateId) {
  try {
    const result = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.DASHBOARD}/${affiliateId}`);
    // Map backend response to frontend's expected structure
    return {
      lifetime: {
        totalReferred: result.stats?.totalReferrals || 0,
        totalSales: result.stats?.monthlySales || 0,
        totalOrders: result.stats?.monthlyOrders || 0,
        totalCommission: result.latestCommission?.commission_amount || 0,
      },
      yearly: {
        totalSales: result.stats?.monthlySales || 0,
        qualifiedCount: result.stats?.convertedReferrals || 0,
        tier: result.currentTier?.name?.toLowerCase() || 'bronze',
        commissionRate: result.currentTier?.commission_rate || 0.03,
      },
      progress: result.progress || null,
      pendingCommission: result.totalPendingCommission || 0,
      paidCommission: result.totalPaidCommission || 0,
    };
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return {
      lifetime: { totalReferred: 0, totalSales: 0, totalOrders: 0, totalCommission: 0 },
      yearly: { totalSales: 0, qualifiedCount: 0, tier: 'bronze', commissionRate: 0.03 },
      progress: null,
      pendingCommission: 0,
      paidCommission: 0,
    };
  }
}

// ─── Referral Link ─────────────────────────────────────────────
export { getReferralLink };

// ─── Monthly Earnings ──────────────────────────────────────────
export async function getMonthlyEarnings(affiliateId) {
  try {
    const data = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.COMMISSIONS}/${affiliateId}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('getMonthlyEarnings error:', err);
    return [];
  }
}

// ─── Recent Referrals ──────────────────────────────────────────
export async function getRecentReferrals(affiliateId, limit = 10) {
  try {
    const data = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.REFERRALS}/${affiliateId}?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('getRecentReferrals error:', err);
    return [];
  }
}

// ─── Recent Qualifying Orders ──────────────────────────────────
export async function getRecentAffiliateOrders(affiliateId, limit = 10) {
  try {
    const data = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.ORDERS}/${affiliateId}?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('getRecentAffiliateOrders error:', err);
    return [];
  }
}

// ─── Payout Request ────────────────────────────────────────────
export async function requestPayout(affiliateId, amount, mpesaNumber) {
  return apiPost(AFFILIATE_CONFIG.ENDPOINTS.PAYOUT_REQUEST, {
    affiliate_id: affiliateId,
    amount,
    mpesa_number: mpesaNumber,
  });
}

// ─── Payout History ────────────────────────────────────────────
export async function getPayoutHistory(affiliateId) {
  try {
    const data = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.PAYOUT_HISTORY}/${affiliateId}`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('getPayoutHistory error:', err);
    return [];
  }
}

// ─── Tier Info ─────────────────────────────────────────────────
export async function getTierInfo() {
  try {
    const data = await apiGet(AFFILIATE_CONFIG.ENDPOINTS.TIERS);
    return Array.isArray(data) ? data : AFFILIATE_CONFIG.TIERS;
  } catch (err) {
    console.error('getTierInfo error:', err);
    return AFFILIATE_CONFIG.TIERS;
  }
}

// ─── Referral Tracking (Cookie + Logging) ──────────────────────
/**
 * Set the referral cookie on page load when ref param is present.
 * Cookie is permanent (10 year expiry).
 */
export function setReferralCookie(refCode) {
  const maxAge = AFFILIATE_CONFIG.REF_COOKIE_MAX_AGE;
  document.cookie = `${AFFILIATE_CONFIG.REF_COOKIE}=${refCode}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Check for ref parameter on page load and store cookie.
 * Call this early in the app lifecycle.
 */
export function initReferralTracking() {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  if (refCode && refCode.startsWith('AFF-')) {
    setReferralCookie(refCode);
    // Clean URL params without reload
    const url = new URL(window.location);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url);
  }
}

// Read referral cookie
export function getReferralCookie() {
  const match = document.cookie.match(new RegExp('(^| )' + AFFILIATE_CONFIG.REF_COOKIE + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Log a referral click event — proxy through backend API
 */
export async function logReferralClick(affiliateReferralCode) {
  try {
    await apiPost(AFFILIATE_CONFIG.ENDPOINTS.LOG_CLICK, {
      referral_code: affiliateReferralCode,
      user_agent: navigator.userAgent,
      page_url: window.location.href,
    });
  } catch (err) {
    console.warn('logReferralClick error:', err);
  }
}

/**
 * Link current signed-up user to affiliate (called on signup)
 */
export async function linkUserToAffiliate(userId, referralCode) {
  return apiPost(AFFILIATE_CONFIG.ENDPOINTS.LINK_AFFILIATE, {
    user_id: userId,
    referral_code: referralCode,
  });
}

/**
 * Look up affiliate by referral code (used during signup)
 */
export async function lookupAffiliateByCode(referralCode) {
  try {
    const data = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.PROFILE}/by-code/${referralCode}`);
    return data || null;
  } catch {
    return null;
  }
}

// ─── Affiliate Application (Self-Signup) ────────────────────────

/**
 * Submit a "Become an Affiliate" self-signup application
 */
export async function submitAffiliateApplication({ full_name, phone, mpesa_number }) {
  return apiPost(AFFILIATE_CONFIG.ENDPOINTS.APPLICATION, { full_name, phone, mpesa_number });
}

/**
 * Check affiliate application status for a user
 */
export async function getApplicationStatus(userId) {
  try {
    const data = await apiGet(`${AFFILIATE_CONFIG.ENDPOINTS.APPLICATION_STATUS}/${userId}`);
    return data || null;
  } catch {
    return null;
  }
}
