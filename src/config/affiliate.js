// Affiliate Program Configuration
// Matches the new 4-tier schema and backend settings

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

export const AFFILIATE_CONFIG = {
  API_BASE,
  
  // Tiers definition (mirrors affiliate_tiers table)
  TIERS: [
    { id: 'bronze',   label: 'Bronze',   min_sales: 0,  rate: 0.03, color: 'text-amber-700', badge: 'bg-amber-700/20 text-amber-600' },
    { id: 'silver',   label: 'Silver',   min_sales: 10, rate: 0.05, color: 'text-zinc-300',  badge: 'bg-zinc-600/20 text-zinc-300' },
    { id: 'gold',     label: 'Gold',     min_sales: 30, rate: 0.08, color: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-400' },
    { id: 'platinum', label: 'Platinum', min_sales: 60, rate: 0.12, color: 'text-blue-300',   badge: 'bg-blue-500/20 text-blue-300' },
  ],

  // Default referral reward points
  DEFAULT_REWARD_POINTS: 1,

  // Min payout for M-Pesa B2C
  MIN_PAYOUT: 2000,

  // Attribution
  ATTRIBUTION_MODEL: 'last_touch',
  COOKIE_CONSENT_REQUIRED: true,

  // Cookie name for referral tracking
  REF_COOKIE: 'omix_ref',
  REF_COOKIE_MAX_AGE: 60 * 60 * 24 * 365 * 10, // 10 years

  // API endpoints
  ENDPOINTS: {
    PROFILE: `${API_BASE}/api/affiliate/profile`,
    DASHBOARD: `${API_BASE}/api/affiliate/dashboard`,
    REFERRALS: `${API_BASE}/api/affiliate/referrals`,
    COMMISSIONS: `${API_BASE}/api/affiliate/commissions`,
    ORDERS: `${API_BASE}/api/affiliate/orders`,
    PAYOUT_REQUEST: `${API_BASE}/api/affiliate/payout-request`,
    PAYOUT_HISTORY: `${API_BASE}/api/affiliate/payouts`,
    LINK_AFFILIATE: `${API_BASE}/api/affiliate/link`,
    LOG_CLICK: `${API_BASE}/api/affiliate/log-click`,
    TIERS: `${API_BASE}/api/affiliate/tiers`,
  },
};

// Helper to compute tier from qualified order count
export function computeTier(qualifiedCount) {
  const tiers = [...AFFILIATE_CONFIG.TIERS].sort((a, b) => b.min_sales - a.min_sales);
  for (const t of tiers) {
    if (qualifiedCount >= t.min_sales) return t;
  }
  return AFFILIATE_CONFIG.TIERS[0];
}

export function formatKES(amount) {
  return `KSh ${Number(amount || 0).toLocaleString('en-KE')}`;
}

export function getReferralLink(referralCode) {
  return `https://market.omixsystems.store/?ref=${referralCode}`;
}
