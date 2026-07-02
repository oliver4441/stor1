// Affiliate Business Logic
// All data operations delegated to affiliate_api.js (backend proxy)
import { AFFILIATE_CONFIG, computeTier } from '../config/affiliate';
import { lookupAffiliateByCode, linkUserToAffiliate, getReferralCookie, setReferralCookie } from './affiliate_api';

/**
 * Generates a unique, human-readable affiliate code.
 * Delegates to backend API which handles uniqueness check.
 */
export async function generateAffiliateCode() {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AFF-${randomPart}`;
}

/**
 * Process referral attribution at signup.
 * Last-touch model: the most recent referral cookie wins.
 * Delegates to backend for the actual DB operations.
 */
export async function processSignupReferral(userId) {
  const refCode = getReferralCookie();
  if (!refCode) return { success: true, message: 'No referral code found' };

  try {
    // Lookup the affiliate by their referral code
    const affiliate = await lookupAffiliateByCode(refCode);
    if (!affiliate) {
      return { success: false, message: 'Invalid referral code' };
    }

    // Link user to affiliate (backend handles last-touch logic & duplicate prevention)
    const result = await linkUserToAffiliate(userId, refCode);

    // Clear the referral cookie after processing
    document.cookie = `${AFFILIATE_CONFIG.REF_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

    return {
      success: true,
      message: result.message || 'Referral attributed',
      affiliateId: affiliate.id,
    };
  } catch (err) {
    console.error('processSignupReferral error:', err);
    // Don't block signup if referral attribution fails
    return { success: false, message: 'Referral attribution skipped' };
  }
}

/**
 * Process a pending referral for an existing user (e.g., when creating a listing).
 * Last-touch attribution.
 */
export async function processReferralPending(userId, referralCode) {
  if (!referralCode) return;
  try {
    await linkUserToAffiliate(userId, referralCode);
  } catch (err) {
    console.warn('processReferralPending error:', err);
  }
}

export { computeTier, getReferralCookie, setReferralCookie, lookupAffiliateByCode, linkUserToAffiliate };
