// API layer — back to Supabase
import { supabase } from './supabase'
import { CATEGORY_TO_ID } from './constants'

// Auth
export async function signUp({ email, password, fullName, phone, refCode }) {
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } }
  });
  if (authError) return { success: false, error: authError.message };
  if (data.user) {
    // Look up referrer if referral code provided
    let referredBy = null;
    if (refCode) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', refCode.toUpperCase())
        .maybeSingle();
      if (referrer) referredBy = referrer.id;
    }

    // Generate a referral code for this new user
    const genRefCode = (data.user.id || '').replace(/-/g, '').slice(0, 8).toUpperCase();

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      role: 'customer',
      referred_by: referredBy,
      loyalty_points: 0,
      referral_code: genRefCode,
    });
    if (profileError) {
      console.error('Profile insert failed:', profileError.message);
      // Clean up the auth user since profile couldn't be created
      await supabase.auth.admin.deleteUser(data.user.id).catch(() => {});
      return { success: false, error: 'Account creation failed. Please try again.' };
    }
  }
  // Return session if auto-signed in (email confirmation disabled), null if verification needed
  return { success: true, user: data.user, session: data.session };
}

export async function signIn({ email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user, session: data.session }
  } catch (err) {
    return { success: false, error: err.message || 'Login failed. Please try again.' }
  }
}

export async function signOut() {
  await supabase.auth.signOut()
  return { success: true }
}

export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch {
    return null;
  }
}

// Listings
export async function fetchListings(category = 'All', searchQuery = '', page = 1, limit = null) {
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }
  if (searchQuery) {
    // Use full-text search via Supabase textSearch
    const sanitized = searchQuery.replace(/[%_]/g, '\\$&');
    query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
  }

  query = query.order('created_at', { ascending: false })

  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query
  if (error) { console.error(error); return { listings: [], total: 0 } }
  return { listings: data || [], total: count || 0 }
}

export async function fetchListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function fetchUserListings(userId) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data || []
}

// Image upload to Supabase Storage
// Accepted types: jpg, jpeg, png, webp
const ACCEPTED_TYPES = ['jpg', 'jpeg', 'png', 'webp']
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const MAX_DIMENSION = 1200 // max width/height in pixels
const JPEG_QUALITY = 0.7

/**
 * Compress/resize an image using canvas, then convert to a JPEG File.
 * @param {File} file - The source image file
 * @param {number} [maxWidth=1200] - Maximum width/height in pixels
 * @param {number} [quality=0.7] - JPEG quality (0-1)
 * @returns {Promise<File>} A compressed JPEG File
 */
export function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Scale down if exceeds maxWidth
      if (width > maxWidth || height > maxWidth) {
        if (width >= height) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxWidth) / height)
          height = maxWidth
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      // Fill white background (for transparent PNGs)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Convert Blob to File with a .jpg name
            const baseName = file.name.replace(/\.[^.]+$/, '')
            const compressedFile = new File(
              [blob],
              `${baseName}_compressed.jpg`,
              { type: 'image/jpeg' }
            )
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for compression'))
    }

    img.src = objectUrl
  })
}

export async function uploadImage(file, onProgress) {
  // 1) Validate file type (extension + MIME type)
  const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ACCEPTED_TYPES.includes(fileExt) || !ACCEPTED_MIME_TYPES.includes(file.type)) {
    const allowed = ACCEPTED_TYPES.join(', ')
    return {
      success: false,
      error: `Unsupported file type ".${fileExt}". Please use: ${allowed}.`,
      errorSw: `Faili ya aina hii ".${fileExt}" haikubaliki. Tafadhali tumia: ${allowed}.`,
    }
  }

  // 2) Validate file size (pre-compression)
  if (file.size > MAX_FILE_SIZE) {
    const fileMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      success: false,
      error: `Image is too large (${fileMB} MB). Maximum size is 5 MB. Please choose a smaller image.`,
      errorSw: `Picha ni kubwa sana (${fileMB} MB). Ukubwa wa juu ni 5 MB. Tafadhali chagua picha ndogo.`,
    }
  }

  // 3) Compress/resize and convert to JPEG
  let uploadFile
  try {
    if (onProgress) onProgress('compressing')
    uploadFile = await compressImage(file, MAX_DIMENSION, JPEG_QUALITY)
  } catch (err) {
    console.error('Image compression error:', err)
    return {
      success: false,
      error: 'Failed to process image. Please try a different file.',
      errorSw: 'Imeshindwa kushughulikia picha. Tafadhali jaribu faili nyingine.',
    }
  }

  // 4) Build file path (always .jpg)
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
  const filePath = `listings/${fileName}`

  // 5) Upload to Supabase
  if (onProgress) onProgress('uploading')
  const { error } = await supabase.storage
    .from('listing-images')
    .upload(filePath, uploadFile, {
      upsert: false,
      contentType: 'image/jpeg',
    })

  if (error) {
    console.error('uploadImage error:', error)
    return {
      success: false,
      error: `Upload failed: ${error.message}. Please try again.`,
      errorSw: `Upakiaji umeshindwa: ${error.message}. Tafadhali jaribu tena.`,
    }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('listing-images')
    .getPublicUrl(filePath)

  if (onProgress) onProgress('done')
  return { success: true, url: publicUrl }
}

// Create listing
export async function createListing(formData) {
  const { data: { user } } = await supabase.auth.getUser()
  const catId = CATEGORY_TO_ID[formData.category] || null

  const { data, error } = await supabase
    .from('listings')
    .insert({
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price) || 0,
      condition: formData.condition,
      category: formData.category,
      category_id: catId,
      location_city: formData.location,
      location_region: 'Kericho',
      images: formData.images && formData.images.length > 0 ? formData.images : (formData.image_url ? [formData.image_url] : []),
      seller_name: formData.seller_name || user?.user_metadata?.full_name,
      seller_id: user?.id || null,
      seller_phone: formData.seller_phone || null,
      status: formData.status || 'active',
      quantity: parseInt(formData.quantity) || 1,
      brand: formData.brand || null,
      model: formData.model || null,
      color: formData.color || null,
      weight: formData.weight || null,
      sku: formData.sku || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createListing error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, id: data?.id }
}

// Update listing
export async function updateListing(id, formData) {
  const { data: { user } } = await supabase.auth.getUser()
  const catId = CATEGORY_TO_ID[formData.category] || null

  const { data, error } = await supabase
    .from('listings')
    .update({
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price) || 0,
      condition: formData.condition,
      category: formData.category,
      category_id: catId,
      location_city: formData.location,
      location_region: 'Kericho',
      images: formData.images && formData.images.length > 0 ? formData.images : (formData.image_url ? [formData.image_url] : []),
      seller_name: formData.seller_name || user?.user_metadata?.full_name,
      seller_phone: formData.seller_phone || null,
      status: formData.status || 'active',
      quantity: parseInt(formData.quantity) || 1,
      brand: formData.brand || null,
      model: formData.model || null,
      color: formData.color || null,
      weight: formData.weight || null,
      sku: formData.sku || null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    console.error('updateListing error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, id: data?.id }
}

// Bulk update listing status
export async function bulkUpdateListingStatus(ids, status) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('listings')
    .update({ status })
    .in('id', ids)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Bulk delete listings
export async function bulkDeleteListings(ids) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('listings')
    .delete()
    .in('id', ids)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Delete listing
export async function deleteListing(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteListing error:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

// Admin: fetch all listings
export async function fetchAllListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return data || []
}

// Admin: update listing status
export async function updateListingStatus(id, status) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Admin: delete any listing
export async function adminDeleteListing(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Orders (Online Store) ────────────────────────────────

export async function createOrder({ items, total, customerName, phone, email, address, city, area, landmark, promoCode, promoCodeId, isFreeDelivery }) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in to place an order. Please log in and try again.' }
  }

  if (!items || items.length === 0) {
    return { success: false, error: 'Your cart is empty. Please add items before checking out.' }
  }

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('omix_orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      total_amount: total,
      customer_name: customerName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      area: area || null,
      landmark: landmark || null,
      promo_code_id: promoCodeId || null,
      promo_code_text: promoCode || null,
      delivery_discount: isFreeDelivery ? 1 : 0,
    })
    .select('*')
    .single()

  if (orderError) {
    console.error('createOrder error:', orderError)
    // Provide user-friendly error messages
    if (orderError.code === '42501' || orderError.message?.includes('policy') || orderError.message?.includes('permission')) {
      return { success: false, error: 'Permission denied. Please log out and log in again, then try.' }
    }
    if (orderError.code === '23502') {
      return { success: false, error: 'Missing required information. Please fill in all fields.' }
    }
    return { success: false, error: `Order creation failed: ${orderError.message}` }
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id || null,
    product_name: item.product_name,
    product_sku: item.product_sku || null,
    product_image: item.product_image || null,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal || (item.price * item.quantity),
  }))

  if (orderItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('omix_order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('createOrder items error:', itemsError)
      // Try to clean up the orphaned order
      await supabase.from('omix_orders').delete().eq('id', order.id)
      return { success: false, error: `Order items failed: ${itemsError.message}` }
    }
  }

  // Award loyalty points (1 point per KES 100)
  if (user) {
    const pointsEarned = Math.floor(total / 100);
    if (pointsEarned > 0) {
      const { error: ptsTxError } = await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: pointsEarned,
        description: `Order #${order.id}`,
        reference_type: 'order',
        reference_id: order.id,
      });
      if (ptsTxError) console.warn('Points transaction failed:', ptsTxError.message);

      const { data: currentProfile } = await supabase
        .from('profiles').select('loyalty_points').eq('id', user.id).single();
      const { error: ptsUpdateError } = await supabase.from('profiles').update({
        loyalty_points: (currentProfile?.loyalty_points || 0) + pointsEarned
      }).eq('id', user.id);
      if (ptsUpdateError) console.warn('Loyalty points update failed:', ptsUpdateError.message);
    }
  }

  // Check if referee -> award referral reward
  try {
    const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', user.id).single();
    if (profile?.referred_by) {
      const { data: existing } = await supabase
        .from('referral_rewards')
        .select('id')
        .eq('referee_id', user.id)
        .maybeSingle();
      if (!existing) {
        const { error: refError } = await supabase.from('referral_rewards').insert({
          referrer_id: profile.referred_by,
          referee_id: user.id,
          order_id: order.id,
          reward_amount: 100,
          status: 'pending',
        });
        if (refError) console.warn('Referral reward failed:', refError.message);
      }
    }
  } catch {}

  // Increment promo code usage
  if (promoCodeId) {
    // Use raw increment via rpc or fallback to select+update
    try {
      const { data: current } = await supabase.from('promo_codes').select('times_used').eq('id', promoCodeId).single();
      if (current) {
        await supabase.from('promo_codes').update({ times_used: (current.times_used || 0) + 1 }).eq('id', promoCodeId);
      }
    } catch (e) {
      // Non-critical: log but don't fail the order
      console.warn('Failed to increment promo usage:', e.message);
    }
  }

  return { success: true, order }
}

export async function fetchOrders(userId) {
  const { data, error } = await supabase
    .from('omix_orders')
    .select('*, omix_order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchOrders error:', error); return [] }
  return data || []
}

export async function fetchOrder(orderId) {
  const { data, error } = await supabase
    .from('omix_orders')
    .select('*, omix_order_items(*)')
    .eq('id', orderId)
    .single()

  if (error) { console.error('fetchOrder error:', error); return null }
  return data
}

export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from('omix_orders')
    .select('*, omix_order_items(*)')
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchAllOrders error:', error); return [] }
  return data || []
}

export async function updateOrderNotes(orderId, notes) {
  const { error } = await supabase
    .from('omix_orders')
    .update({ admin_notes: notes })
    .eq('id', orderId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function cancelOrder(orderId) {
  const { error } = await supabase
    .from('omix_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchOrderStats() {
  const { data, error } = await supabase
    .from('omix_orders')
    .select('status, total_amount, created_at');
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
// ── Saved Addresses ───────────────────────────────────────────
export async function fetchAddresses(userId) {
  try {
    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchAddresses error:', err);
    return [];
  }
}

export async function saveAddress(address) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  try {
    if (address.is_default) {
      await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', user.id);
    }
    const { data, error } = await supabase
      .from('saved_addresses')
      .insert({ ...address, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return { success: true, address: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteAddress(id) {
  try {
    const { error } = await supabase.from('saved_addresses').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function setDefaultAddress(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  try {
    await supabase.from('saved_addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Referral System ─────────────────────────────────────────────
export async function getReferralCode(userId) {
  try {
    // Read the stored referral code from the profile
    const { data } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', userId)
      .maybeSingle();
    if (data?.referral_code) return data.referral_code;
    // Fallback: generate from UUID (for profiles without stored code)
    return (userId || '').replace(/-/g, '').slice(0, 8).toUpperCase();
  } catch { return null; }
}

export async function getReferralStats(userId) {
  try {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', userId);
    return { success: true, count: count || 0 };
  } catch { return { success: true, count: 0 }; }
}

// ── Loyalty Points ───────────────────────────────────────────────
export async function getLoyaltyPoints(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('loyalty_points')
      .eq('id', userId)
      .single();
    if (error) return { success: true, points: 0 };
    return { success: true, points: data?.loyalty_points || 0 };
  } catch { return { success: true, points: 0 }; }
}

export async function getPointsHistory(userId) {
  try {
    const { data } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    return data || [];
  } catch { return []; }
}

// ── Admin ────────────────────────────────────────────────

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('omix_orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function isAdmin() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (error || !profile) return false;
    return profile.role === 'admin';
  } catch {
    return false;
  }
}

// ── Listing Payment (Paystack) ──────────────────────────────────────
export async function createListingPayment(formData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('listing_payments')
      .insert({
        user_id: user.id,
        amount: 500, // KES 5.00 in cents
        currency: 'KES',
        status: 'pending',
        listing_data: formData,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, payment: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateListingPaymentStatus(paymentId, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };
    const { error } = await supabase
      .from('listing_payments')
      .update({ ...updates })
      .eq('id', paymentId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Paystack ────────────────────────────────────────────────────────
export async function paystackInitialize({ email, amount, reference, callbackUrl }) {
  try {
    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, reference, callback_url: callbackUrl }),
    });
    const data = await res.json();
    if (data.status) return { success: true, authorization_url: data.data.authorization_url, reference: data.data.reference };
    return { success: false, error: data.message || 'Paystack init failed' };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function paystackVerify(reference) {
  try {
    const res = await fetch(`/api/paystack/verify/${reference}`);
    const data = await res.json();
    if (data.status && data.data.status === 'success') return { success: true, data: data.data };
    return { success: false, error: 'Payment not verified' };
  } catch (err) { return { success: false, error: err.message }; }
}

// ── Price Drop Watchers ────────────────────────────────────

/**
 * Create a price drop watch for a listing.
 * @param {string} userId - The user's UUID
 * @param {number} listingId - The listing ID
 * @param {number|null} targetPrice - The target price (null = any drop)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function watchPriceDrop(userId, listingId, targetPrice = null) {
  try {
    const { data, error } = await supabase
      .from('price_watchers')
      .upsert({
        user_id: userId,
        listing_id: listingId,
        target_price: targetPrice,
      }, {
        onConflict: 'user_id, listing_id, coalesce(target_price, -1)',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all price watchers for a user.
 * @param {string} userId - The user's UUID
 * @returns {Promise<Array>}
 */
export async function getPriceWatchers(userId) {
  try {
    const { data, error } = await supabase
      .from('price_watchers')
      .select('*, listings:listing_id(title, price, images, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) { console.error('getPriceWatchers error:', error); return []; }
    return data || [];
  } catch (err) {
    console.error('getPriceWatchers error:', err);
    return [];
  }
}

/**
 * Remove a price watcher.
 * @param {number} id - The price_watchers row ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removePriceWatcher(id) {
  try {
    const { error } = await supabase
      .from('price_watchers')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Back in Stock Watchers ─────────────────────────────────

/**
 * Create a back-in-stock watch for a listing.
 * @param {string} userId - The user's UUID
 * @param {number} listingId - The listing ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function watchBackInStock(userId, listingId) {
  try {
    const { data, error } = await supabase
      .from('stock_watchers')
      .upsert({
        user_id: userId,
        listing_id: listingId,
      }, {
        onConflict: 'user_id, listing_id',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all stock watchers for a user.
 * @param {string} userId - The user's UUID
 * @returns {Promise<Array>}
 */
export async function getStockWatchers(userId) {
  try {
    const { data, error } = await supabase
      .from('stock_watchers')
      .select('*, listings:listing_id(title, price, images, quantity, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) { console.error('getStockWatchers error:', error); return []; }
    return data || [];
  } catch (err) {
    console.error('getStockWatchers error:', err);
    return [];
  }
}

/**
 * Remove a stock watcher.
 * @param {number} id - The stock_watchers row ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeStockWatcher(id) {
  try {
    const { error } = await supabase
      .from('stock_watchers')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// ── Saved Searches ────────────────────────────────────────────────────
export async function saveSearch(userId, query) {
  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert({ user_id: userId, query })
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSavedSearches(userId) {
  try {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getSavedSearches error:', err);
    return [];
  }
}

export async function deleteSavedSearch(id) {
  try {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
