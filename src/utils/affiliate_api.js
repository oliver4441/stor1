// Affiliate Program API layer
import { supabase } from './supabase';

/**
 * Get the affiliate profile for the current user
 */
export async function getAffiliateProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getAffiliateProfile error:', err);
    return null;
  }
}

/**
 * Get the affiliate's referral link (permanent)
 */
export function getReferralLink(referralCode) {
  return `https://market.omixsystems.store/?ref=${referralCode}`;
}

/**
 * Get referral statistics for the current yearly cycle
 * @param {string} affiliateId - UUID from affiliates table
 * @param {number} year - e.g., 2026
 */
export async function getYearlyStats(affiliateId, year = new Date().getFullYear()) {
  try {
    const yearStart = new Date(`${year}-01-01T00:00:00Z`).toISOString();
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`).toISOString();

    // Get all referred users for this affiliate
    const { data: referredUsers, error: userErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('referred_by', affiliateId);

    if (userErr) throw userErr;

    const userIds = (referredUsers || []).map(u => u.id);

    // Get qualified orders from referred users in this year
    let qualifiedOrders = [];
    let totalSales = 0;
    let qualifiedCount = 0;

    if (userIds.length > 0) {
      const { data: orders, error: orderErr } = await supabase
        .from('omix_orders')
        .select('id, total_amount, created_at, status')
        .in('user_id', userIds)
        .gte('created_at', yearStart)
        .lt('created_at', yearEnd);

      if (orderErr) throw orderErr;

      // Filter to qualified orders only (completed, paid, not cancelled/refunded)
      qualifiedOrders = (orders || []).filter(o =>
        o.status === 'paid' || o.status === 'completed' || o.status === 'delivered'
      );
      totalSales = qualifiedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      qualifiedCount = qualifiedOrders.length;
    }

    // Determine tier
    const tier = qualifiedCount >= 30 ? 'gold' : 'silver';
    const commissionRate = tier === 'gold' ? 0.10 : 0.05;

    return {
      year,
      referredUsers: referredUsers || [],
      qualifiedOrders,
      totalSales: Math.round(totalSales),
      qualifiedCount,
      tier,
      commissionRate,
    };
  } catch (err) {
    console.error('getYearlyStats error:', err);
    return {
      year, referredUsers: [], qualifiedOrders: [],
      totalSales: 0, qualifiedCount: 0, tier: 'silver', commissionRate: 0.05,
    };
  }
}

/**
 * Get lifetime stats for an affiliate
 */
export async function getLifetimeStats(affiliateId) {
  try {
    const { data: referredUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('referred_by', affiliateId);

    const userIds = (referredUsers || []).map(u => u.id);
    let totalSales = 0;
    let totalOrders = 0;

    if (userIds.length > 0) {
      const { data: orders } = await supabase
        .from('omix_orders')
        .select('total_amount, status')
        .in('user_id', userIds);

      const qualified = (orders || []).filter(o =>
        o.status === 'paid' || o.status === 'completed' || o.status === 'delivered'
      );
      totalSales = qualified.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      totalOrders = qualified.length;
    }

    return {
      totalReferred: (referredUsers || []).length,
      totalSales: Math.round(totalSales),
      totalOrders,
    };
  } catch (err) {
    console.error('getLifetimeStats error:', err);
    return { totalReferred: 0, totalSales: 0, totalOrders: 0 };
  }
}

/**
 * Get monthly earnings history for the affiliate
 * Returns an array of { year, month, totalSales, commission, tier, status }
 */
export async function getMonthlyEarnings(affiliateId, monthsBack = 12) {
  try {
    const { data: referredUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('referred_by', affiliateId);

    const userIds = (referredUsers || []).map(u => u.id);
    if (userIds.length === 0) return [];

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - monthsBack);

    const { data: orders } = await supabase
      .from('omix_orders')
      .select('total_amount, status, created_at')
      .in('user_id', userIds)
      .gte('created_at', cutoff.toISOString());

    const qualified = (orders || []).filter(o =>
      o.status === 'paid' || o.status === 'completed' || o.status === 'delivered'
    );

    // Group by year-month
    const monthly = {};
    qualified.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { sales: 0, count: 0 };
      monthly[key].sales += parseFloat(o.total_amount || 0);
      monthly[key].count += 1;
    });

    const earnings = Object.entries(monthly)
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const qualifiedCount = data.count;
        const tier = qualifiedCount >= 30 ? 'gold' : 'silver';
        const rate = tier === 'gold' ? 0.10 : 0.05;
        return {
          year: parseInt(year),
          month: parseInt(month),
          totalSales: Math.round(data.sales),
          qualifiedCount,
          tier,
          commission: Math.round(data.sales * rate),
          rate,
          status: 'pending', // Admin marks as paid
        };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);

    return earnings;
  } catch (err) {
    console.error('getMonthlyEarnings error:', err);
    return [];
  }
}

/**
 * Get recent referred users with their signup dates
 */
export async function getRecentReferrals(affiliateId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('referred_by', affiliateId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getRecentReferrals error:', err);
    return [];
  }
}

/**
 * Get recent qualified orders from referred users
 */
export async function getRecentAffiliateOrders(affiliateId, limit = 10) {
  try {
    const { data: referredUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('referred_by', affiliateId);

    const userIds = (referredUsers || []).map(u => u.id);
    if (userIds.length === 0) return [];

    const { data, error } = await supabase
      .from('omix_orders')
      .select('id, total_amount, status, created_at, customer_name, omix_order_items(product_name, quantity)')
      .in('user_id', userIds)
      .in('status', ['paid', 'completed', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getRecentAffiliateOrders error:', err);
    return [];
  }
}

/**
 * Set the referral cookie on page load when ref param is present
 * Cookie is permanent (does not expire)
 */
export function setReferralCookie(refCode) {
  // Set a cookie that never expires
  document.cookie = `omix_ref=${refCode}; path=/; max-age=${60 * 60 * 24 * 365 * 10}; SameSite=Lax`;
}

/**
 * Check for ref parameter on page load and store cookie
 * Call this early in the app lifecycle
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

/**
 * Log a referral click event
 */
export async function logReferralClick(affiliateId) {
  try {
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id')
      .eq('id', affiliateId)
      .single();

    if (affiliate) {
      await supabase.from('affiliate_logs').insert({
        affiliate_id: affiliateId,
        event_type: 'REFERRAL_CLICK',
        details: { timestamp: new Date().toISOString(), user_agent: navigator.userAgent },
      });
    }
  } catch (err) {
    console.warn('logReferralClick error:', err);
  }
}
