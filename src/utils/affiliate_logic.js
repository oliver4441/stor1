import { supabase } from './supabase';

/**
 * Generates a unique, human-readable affiliate code.
 * Format: AFF-XXXX (e.g., AFF-7G2H)
 */
export async function generateAffiliateCode() {
  let code;
  let exists = true;
  
  while (exists) {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `AFF-${randomPart}`;
    
    const { data } = await supabase
      .from('affiliates')
      .select('id')
      .eq('referral_code', code)
      .single();
      
    if (!data) exists = false;
  }
  return code;
}

/**
 * Permanent Attribution: Links a user to an affiliate.
 * Follows "First Attribution Wins" rule.
 */
export async function linkUserToAffiliate(userId, affiliateId) {
  // 1. Check if user already has an affiliate
  const { data: profile } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', userId)
    .single();

  if (profile?.referred_by) {
    return { success: false, message: 'User already attributed to an affiliate.' };
  }

  // 2. Perform permanent link
  const { error } = await supabase
    .from('profiles')
    .update({ referred_by: affiliateId })
    .eq('id', userId);

  if (error) return { success: false, error };

  // 3. Log the attribution event
  await supabase.from('affiliate_logs').insert({
    affiliate_id: affiliateId,
    event_type: 'USER_LINKED',
    details: { user_id: userId }
  });

  return { success: true };
}
