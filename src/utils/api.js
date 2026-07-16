// API layer — back to Supabase
import { supabase } from './supabase'
import { CATEGORY_TO_ID, ID_TO_CATEGORY, VARIANT_REQUIRED_CATEGORIES } from './constants'
import { sounds } from './sounds'
import { lookupAffiliateByCode } from './affiliate_api'
import { processReferralPending } from './affiliate_logic'

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com'

// Cookie helper — also used for referral cookie
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Batch chunk size for bulk operations to avoid Supabase REST API URL length limits
const BATCH_SIZE = 200;

// Helper: add virtual 'category' text field from category_id
function mapCategoryName(listing) {
  if (listing && listing.category_id != null && !listing.category) {
    listing.category = ID_TO_CATEGORY[listing.category_id] || 'Other';
  }
  return listing;
}
export function mapListingCategories(listings) {
  if (Array.isArray(listings)) return listings.map(mapCategoryName);
  if (listings) mapCategoryName(listings);
  return listings;
}

// Auth
export async function signUp({ email, password, fullName, phone, refCode }) {
  // Use backend API signup (bypasses client-side anon key limitations)
  try {
    const resp = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, refCode }),
    });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      return { success: false, error: data.error || 'Signup failed. Please try again.' };
    }

    // Auto-sign-in after successful signup
    const signInResult = await signIn({ email, password });
    return signInResult;

    // Note: referral processing is handled server-side
  } catch (err) {
    return { success: false, error: err.message || 'Something went wrong. Please try again.' };
  }
}

export async function signIn({ email, password }) {
  try {
    // First try: normal Supabase auth sign-in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { success: true, user: data.user, session: data.session }

    // If login fails with credential error, try backend admin-login endpoint
    // (handles admin users whose password may not be set in auth yet)
    if (error.message?.toLowerCase().includes('invalid login credentials')) {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/admin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const adminResult = await resp.json();
        if (adminResult.success) {
          // Admin password was set — retry normal sign-in
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
          if (!retryError) return { success: true, user: retryData.user, session: retryData.session };
        }
      } catch (_) {
        // Admin login fallback failed silently — fall through to original error
      }
    }

    return { success: false, error: error.message }
  } catch (err) {
    return { success: false, error: err.message || 'Login failed. Please try again.' }
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  return { success: true };
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
export async function fetchListings(category = 'All', searchQuery = '', page = 1, limit = null, productType = 'all') {
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // Filter by product type (new / refurbished)
  if (productType === 'new') {
    // Show only new (or untyped) products — exclude refurbished
    query = query.neq('product_type', 'refurbished');
  } else if (productType === 'refurbished') {
    query = query.eq('product_type', 'refurbished');
  }
  // 'all' = no filter (shows everything)

  if (category && category !== 'All') {
    // Use category_id for filtering (Blue Prism DB uses integer FK, not text column)
    const catId = CATEGORY_TO_ID[category] || null;
    if (catId) {
      query = query.eq('category_id', catId)
    } else {
      // Fallback: try text category column in case it exists
      query = query.eq('category', category)
    }
  }
  if (searchQuery) {
    // Sanitize: only allow alphanumeric, spaces, hyphens, periods
    const sanitized = searchQuery.replace(/[^a-zA-Z0-9\s\-.]/g, '').trim();
    if (sanitized.length > 0) {
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }
  }

  query = query.order('created_at', { ascending: false })

  if (limit) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query
  if (error) { console.error(error); return { listings: [], total: 0 } }
  return { listings: mapListingCategories(data || []), total: count || 0 }
}

// Advanced search via backend API with filters
const API_BASE_SEARCH = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';
export async function advancedSearch(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.min_price) params.set('min_price', filters.min_price);
  if (filters.max_price) params.set('max_price', filters.max_price);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.location) params.set('location', filters.location);
  if (filters.brand) params.set('brand', filters.brand);
  if (filters.availability) params.set('availability', filters.availability);
  if (filters.min_rating) params.set('min_rating', filters.min_rating);
  if (filters.has_discount) params.set('has_discount', filters.has_discount);
  if (filters.size) params.set('size', filters.size);
  if (filters.page) params.set('page', filters.page);
  if (filters.limit) params.set('limit', filters.limit);
  if (filters.sort) params.set('sort', filters.sort);
  try {
    const res = await fetch(`${API_BASE_SEARCH}/api/search?${params.toString()}`);
    if (!res.ok) throw new Error('Search request failed');
    const data = await res.json();
    // API returns category_id but not category string — map it for display
    if (data.listings && Array.isArray(data.listings)) {
      data.listings = data.listings.map(mapCategoryName);
    }
    return data;
  } catch (err) {
    console.error('[advancedSearch]', err);
    return { listings: [], total: 0, page: 1, limit: 20, total_pages: 0 };
  }
}

export async function fetchListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return mapCategoryName(data)
}

export async function fetchUserListings(userId) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return mapListingCategories(data || [])
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (!user) return { success: false, error: 'Authentication required' };

  // Extract referral code from cookie if present
  const refCode = getCookie('omix_ref');

  if (refCode) {
    // Look up affiliate via backend API
    try {
      const affiliate = await lookupAffiliateByCode(refCode);
      if (affiliate?.id) {
        // Permanent attribution: link this user to the affiliate
        await processReferralPending(user.id, refCode);
      }
    } catch (e) {
      console.warn('Affiliate referral skip:', e);
    }
  }

  const catId = CATEGORY_TO_ID[formData.category] || null;
  // ... (rest of the original createListing code)

  const { data, error } = await supabase
    .from('listings')
    .insert({
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price) || 0,
      condition: formData.condition,
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
      has_variants: formData.has_variants || false,
      variants: Array.isArray(formData.variants) ? formData.variants : [],
      size_guide: formData.size_guide || null,
      product_type: formData.product_type || 'new',  // Refurbished support
      wholesale_enabled: formData.wholesale_enabled || false,
      wholesale_min_qty: formData.wholesale_min_qty || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createListing error:', error)
    return { success: false, error: error.message }
  }

  // Sync to Meilisearch (fire-and-forget — don't block the response)
  if (data?.id) {
    meiliSyncProduct(data.id).catch(err =>
      console.warn('[MeiliSync] createListing background sync:', err)
    );
  }

  return { success: true, id: data?.id }
}

// Update listing — only seller or admin can update
export async function updateListing(id, formData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Authentication required' };

  // Verify ownership or admin role
  const { data: listing } = await supabase.from('listings').select('seller_id').eq('id', id).maybeSingle();
  if (!listing) return { success: false, error: 'Listing not found' };
  if (listing.seller_id !== user.id) {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: 'You can only edit your own listings' };
  }

  const catId = CATEGORY_TO_ID[formData.category] || null

  const { data, error } = await supabase
    .from('listings')
    .update({
      title: formData.title,
      description: formData.description,
      price: parseInt(formData.price) || 0,
      condition: formData.condition,
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
      has_variants: formData.has_variants || false,
      variants: Array.isArray(formData.variants) ? formData.variants : [],
      size_guide: formData.size_guide || null,
      product_type: formData.product_type || 'new',  // Refurbished support
      wholesale_enabled: formData.wholesale_enabled || false,
      wholesale_min_qty: formData.wholesale_min_qty || null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    console.error('updateListing error:', error)
    return { success: false, error: error.message }
  }

  // Sync to Meilisearch (fire-and-forget)
  meiliSyncProduct(id).catch(err =>
    console.warn('[MeiliSync] updateListing background sync:', err)
  );

  return { success: true, id: data?.id }
}

// Bulk update listing status — only seller or admin
// Batches in chunks of 200 to avoid Supabase REST API URL length limits
export async function bulkUpdateListingStatus(ids, status) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  // Verify ownership or admin — batched SELECT to avoid URL too long
  let allOwned = true;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const { data: listings } = await supabase.from('listings').select('seller_id').in('id', chunk);
    if (listings && listings.length > 0) {
      if (!listings.every(l => l.seller_id === user.id)) {
        allOwned = false;
        break;
      }
    }
  }

  if (!allOwned) {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: 'You can only update your own listings' };
  }

  // Batch update in chunks of 200
  const errors = [];
  let updatedCount = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .in('id', chunk);

    if (error) {
      errors.push(error.message);
    } else {
      updatedCount += chunk.length;
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `Failed to update ${ids.length - updatedCount} of ${ids.length} listings: ${errors.join('; ')}`,
      partial: true,
      updatedCount,
      totalCount: ids.length,
    };
  }

  return { success: true, updatedCount, totalCount: ids.length };
}

// Bulk delete listings — only seller or admin
// Batches in chunks of 200 to avoid Supabase REST API URL length limits
export async function bulkDeleteListings(ids) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  // Verify ownership or admin — batched SELECT to avoid URL too long
  let allOwned = true;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const { data: listings } = await supabase.from('listings').select('seller_id').in('id', chunk);
    if (listings && listings.length > 0) {
      if (!listings.every(l => l.seller_id === user.id)) {
        allOwned = false;
        break;
      }
    }
  }

  if (!allOwned) {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: 'You can only delete your own listings' };
  }

  // Batch delete in chunks of 200
  const errors = [];
  let deletedCount = 0;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('listings')
      .delete()
      .in('id', chunk);

    if (error) {
      errors.push(error.message);
    } else {
      deletedCount += chunk.length;
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `Failed to delete ${ids.length - deletedCount} of ${ids.length} listings: ${errors.join('; ')}`,
      partial: true,
      deletedCount,
      totalCount: ids.length,
    };
  }

  return { success: true, deletedCount, totalCount: ids.length };
}

// Delete listing — only seller or admin can delete
export async function deleteListing(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Authentication required' };

  // Verify ownership or admin role
  const { data: listing } = await supabase.from('listings').select('seller_id').eq('id', id).maybeSingle();
  if (!listing) return { success: false, error: 'Listing not found' };
  if (listing.seller_id !== user.id) {
    const admin = await isAdmin();
    if (!admin) return { success: false, error: 'You can only delete your own listings' };
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteListing error:', error)
    return { success: false, error: error.message }
  }

  // Remove from Meilisearch (fire-and-forget)
  meiliRemoveProduct(id).catch(err =>
    console.warn('[MeiliSync] deleteListing background removal:', err)
  );

  return { success: true }
}

// ── Meilisearch sync helpers ──────────────────────────────────────

async function meiliSyncProduct(id) {
  try {
    // Fetch the full product with category name from DB
    const { data: product, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !product) {
      console.warn('[MeiliSync] Could not fetch product', id, error?.message);
      return;
    }
    await fetch(`${API_BASE}/api/search/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    });
  } catch (err) {
    console.warn('[MeiliSync] syncProduct error:', err.message);
  }
}

async function meiliRemoveProduct(id) {
  try {
    await fetch(`${API_BASE}/api/search/sync/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[MeiliSync] removeProduct error:', err.message);
  }
}

// Admin: fetch all listings
export async function fetchAllListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return mapListingCategories(data || [])
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

export async function createOrder({ items, total, customerName, phone, email, address, city, area, landmark, promoCode, promoCodeId, isFreeDelivery, loyaltyPointsUsed, referralCode, paymentMethod = 'online', guestId, delivery_zone_id, delivery_type, pickup_station_id, delivery_estimate_min, delivery_estimate_max, delivery_fee, street, delivery_instructions, alternate_phone, order_notes, scheduled_date, id_number }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    return { success: false, error: 'Authentication error. Please log in and try again.' }
  }

  if (!items || items.length === 0) {
    return { success: false, error: 'Your cart is empty. Please add items before checking out.' }
  }

  // Validate variant data for products in variant-required categories
  const productIds = items.map(i => i.product_id).filter(Boolean);
  if (productIds.length > 0) {
    const { data: listings, error: listErr } = await supabase
      .from('listings')
      .select('id, category')
      .in('id', productIds);
    if (!listErr && listings) {
      const catMap = {};
      listings.forEach(l => { catMap[l.id] = l.category; });
      const missingVariant = items.find(item => {
        const cat = catMap[item.product_id];
        if (cat && VARIANT_REQUIRED_CATEGORIES.includes(cat)) {
          const hasVariant = item.variant_size || item.variant_color || item.variant_label || item.variant_sku || item.variant?.size || item.variant?.colorName || item.variant?.label || item.variant?.sku;
          return !hasVariant;
        }
        return false;
      });
      if (missingVariant) {
        return { success: false, error: `"${missingVariant.product_name}" requires size/colour selection. Please choose options before checking out.` }
      }
    }
  }

  // For guest checkout, skip profile lookup and set user_id to null
  if (!user) {
    // Create the order with guest_id and null user_id
    const { data: order, error: orderError } = await supabase
      .from('omix_orders')
      .insert({
        user_id: null,
        guest_id: guestId || null,
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
        loyalty_points_used: loyaltyPointsUsed || 0,
        referral_code: referralCode || null,
        payment_method: paymentMethod,
        status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
        delivery_zone_id: delivery_zone_id || null,
        delivery_type: delivery_type || 'delivery',
        pickup_station_id: pickup_station_id || null,
        delivery_estimate_min: delivery_estimate_min || null,
        delivery_estimate_max: delivery_estimate_max || null,
        delivery_fee: delivery_fee || 0,
        street: street || null,
        delivery_instructions: delivery_instructions || null,
        alternate_phone: alternate_phone || null,
        order_notes: order_notes || null,
        scheduled_date: scheduled_date || null,
        id_number: id_number || null,
      })
      .select('*')
      .single()

    if (orderError) {
      console.error('Guest createOrder error:', orderError)
      if (orderError.code === '42501' || orderError.message?.includes('policy') || orderError.message?.includes('permission')) {
        return { success: false, error: 'Permission denied. Please try again.' }
      }
      if (orderError.code === '23502') {
        return { success: false, error: 'Missing required information. Please fill in all fields.' }
      }
      return { success: false, error: `Order creation failed: ${orderError.message}` }
    }

    // Create order items for guest order
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      product_sku: item.variant_sku || item.product_sku || null,
      product_image: item.product_image || null,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal || (item.price * item.quantity),
      variant: item.variant || null,
      variant_size: item.variant_size || item.variant?.size || null,
      variant_color: item.variant_color || item.variant?.colorName || null,
      variant_label: item.variant_label || item.variant?.label || null,
      seller_id: item.seller_id || null,
      listing_snapshot: item.listing_snapshot || null,
    }))

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('omix_order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Guest createOrder items error:', itemsError)
        await supabase.from('omix_orders').delete().eq('id', order.id)
        return { success: false, error: `Order items failed: ${itemsError.message}` }
      }
    }

    // Increment promo code usage for guest orders
    if (promoCodeId) {
      try {
        const { error: rpcError } = await supabase.rpc('increment_promo_usage', { promo_id: promoCodeId });
        if (rpcError) {
          console.warn('Promo usage increment failed (RPC not available):', rpcError.message);
        }
      } catch (e) {
        console.warn('Failed to increment promo usage:', e.message);
      }
    }

    return { success: true, order }
  }

  // Ensure user profile exists before creating order (avoids FK violation on user_id)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!profile) {
      // Profile doesn't exist yet — create it from auth user metadata
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || customerName || '';
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          full_name: fullName,
          email: user.email || email || null,
          updated_at: new Date().toISOString()
        });
      if (profileErr) {
        console.warn('Profile auto-create failed:', profileErr.message);
        // Continue anyway — the order insert will fail with a clearer error if truly broken
      }
    }
  } catch (profileCheckErr) {
    console.warn('Profile check failed, proceeding with order:', profileCheckErr.message);
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
      loyalty_points_used: loyaltyPointsUsed || 0,
      referral_code: referralCode || null,
      payment_method: paymentMethod,
      status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
      delivery_zone_id: delivery_zone_id || null,
      delivery_type: delivery_type || 'delivery',
      pickup_station_id: pickup_station_id || null,
      delivery_estimate_min: delivery_estimate_min || null,
      delivery_estimate_max: delivery_estimate_max || null,
      delivery_fee: delivery_fee || 0,
      street: street || null,
      delivery_instructions: delivery_instructions || null,
      alternate_phone: alternate_phone || null,
      order_notes: order_notes || null,
      scheduled_date: scheduled_date || null,
      id_number: id_number || null,
    })
    .select('*')
    .single()

  if (orderError) {
    // If payment_method column doesn't exist, retry without it
    if (orderError.message?.includes('payment_method')) {
      console.warn('[Order] payment_method column missing, retrying without it...')
      const retryPayload = {
        user_id: user.id,
        status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
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
        loyalty_points_used: loyaltyPointsUsed || 0,
        referral_code: referralCode || null,
        delivery_zone_id: delivery_zone_id || null,
        delivery_type: delivery_type || 'delivery',
        pickup_station_id: pickup_station_id || null,
        delivery_estimate_min: delivery_estimate_min || null,
        delivery_estimate_max: delivery_estimate_max || null,
        delivery_fee: delivery_fee || 0,
        street: street || null,
        delivery_instructions: delivery_instructions || null,
        alternate_phone: alternate_phone || null,
        order_notes: order_notes || null,
        scheduled_date: scheduled_date || null,
        id_number: id_number || null,
      }
      const { data: retryOrder, error: retryError } = await supabase
        .from('omix_orders')
        .insert(retryPayload)
        .select('*')
        .single()

      if (retryError) {
        console.error('createOrder retry error:', retryError)
        if (retryError.code === '42501' || retryError.message?.includes('policy') || retryError.message?.includes('permission')) {
          return { success: false, error: 'Permission denied. Please log out and log in again, then try.' }
        }
        if (retryError.code === '23502') {
          return { success: false, error: 'Missing required information. Please fill in all fields.' }
        }
        return { success: false, error: `Order creation failed: ${retryError.message}` }
      }
      order = retryOrder
    } else {
      console.error('createOrder error:', orderError)
      if (orderError.code === '42501' || orderError.message?.includes('policy') || orderError.message?.includes('permission')) {
        return { success: false, error: 'Permission denied. Please log out and log in again, then try.' }
      }
      if (orderError.code === '23502') {
        return { success: false, error: 'Missing required information. Please fill in all fields.' }
      }
      return { success: false, error: `Order creation failed: ${orderError.message}` }
    }
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id || null,
    product_name: item.product_name,
    product_sku: item.variant_sku || item.product_sku || null,
    product_image: item.product_image || null,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal || (item.price * item.quantity),
    variant: item.variant || null,
    variant_size: item.variant_size || item.variant?.size || null,
    variant_color: item.variant_color || item.variant?.colorName || null,
    variant_label: item.variant_label || item.variant?.label || null,
    seller_id: item.seller_id || null,
    listing_snapshot: item.listing_snapshot || null,
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

  // NOTE: Loyalty points and referral rewards are NOT awarded here.
  // They are awarded on confirmed payment only (via Paystack webhook/server).
  // See server.js for the payment confirmation logic.

  // Increment promo code usage — atomic via DB function
  if (promoCodeId) {
    try {
      const { error: rpcError } = await supabase.rpc('increment_promo_usage', { promo_id: promoCodeId });
      if (rpcError) {
        console.warn('Promo usage increment failed (RPC not available):', rpcError.message);
      }
    } catch (e) {
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  try {
    const { error } = await supabase.from('saved_addresses').delete().eq('id', id).eq('user_id', user.id);
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
    await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id).eq('user_id', user.id);
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

    return !error && profile?.role === 'admin';
  } catch {
    return false;
  }
}

export async function isAffiliate() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return !error && profile?.role === 'affiliate';
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
        amount: 50000, // KES 500.00 in cents
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
    const res = await fetch(`${API_BASE}/api/paystack/initialize`, {
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


// ── Profile Management ─────────────────────────────────────────────────

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getProfile error:', err);
    return null;
  }
}

export async function updateProfile(userId, updates) {
  try {
    const allowed = {};
    if (updates.full_name !== undefined) allowed.full_name = updates.full_name;
    if (updates.phone !== undefined) allowed.phone = updates.phone;
    if (updates.avatar_url !== undefined) allowed.avatar_url = updates.avatar_url;

    const { data, error } = await supabase
      .from('profiles')
      .update(allowed)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, profile: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function uploadAvatar(file, userId) {
  try {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Please upload a JPG, PNG, or WebP image.' };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'Image must be under 2MB.' };
    }

    // Compress to 400x400 max
    const compressed = await compressImage(file, 400, 0.8);

    const fileName = `avatar_${userId}_${Date.now()}.jpg`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, compressed, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw new Error(updateError.message);

    return { success: true, url: publicUrl };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Enhanced Order Cancellation ───────────────────────────────────────

export async function cancelOrderWithReason(orderId, reason) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Authentication required' };

    const { data: order } = await supabase
      .from('omix_orders')
      .select('status, user_id')
      .eq('id', orderId)
      .single();

    if (!order) return { success: false, error: 'Order not found' };
    if (order.user_id !== user.id) return { success: false, error: 'You can only cancel your own orders' };

    if (!['pending', 'processing'].includes(order.status)) {
      return { success: false, error: `Order cannot be cancelled because it is already "${order.status}".` };
    }

    const updateData = {
      status: 'cancelled',
    };
    // Only set cancelled_at and cancellation_reason if columns exist
    try {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancellation_reason = reason || null;
    } catch (e) { /* columns may not exist yet */ }

    const { error } = await supabase
      .from('omix_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Wishlist ────────────────────────────────────────────────────────

export async function getWishlist() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('omix_wishlist')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, items: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addToWishlist(listingId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('omix_wishlist')
      .insert({ user_id: user.id, listing_id: listingId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: true, message: 'Already in wishlist' };
      }
      throw error;
    }
    sounds.wishlist();
    // Notify other components of wishlist change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omix:wishlist-changed'));
    }
    return { success: true, item: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function removeFromWishlist(listingId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('omix_wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);

    if (error) throw error;
    // Notify other components of wishlist change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omix:wishlist-changed'));
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function isInWishlist(listingId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: true, inWishlist: false };

    const { data, error } = await supabase
      .from('omix_wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .limit(1);

    if (error) throw error;
    return { success: true, inWishlist: data && data.length > 0 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Saved Searches ──────────────────────────────────────────────────

export async function getSavedSearches() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, searches: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveSearch(query, filters = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    if (!query || !query.trim()) return { success: false, error: 'Search query is required' };

    const { data, error } = await supabase
      .from('saved_searches')
      .upsert({
        user_id: user.id,
        query: query.trim(),
        filters,
      }, { onConflict: 'user_id,query' })
      .select()
      .single();

    if (error) throw error;
    return { success: true, search: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function removeSavedSearch(searchId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Delivery Zones ─────────────────────────────────────────────────
export async function getDeliveryZones() {
  try {
    const resp = await fetch(`${API_URL}/api/delivery-zones`);
    const data = await resp.json();
    return { success: true, zones: data.zones || [] };
  } catch (err) {
    return { success: false, error: err.message, zones: [] };
  }
}

// ── Pick-Up Stations ──────────────────────────────────────────────
export async function getPickupStations() {
  try {
    const resp = await fetch(`${API_URL}/api/pickup-stations`);
    const data = await resp.json();
    return { success: true, stations: data.stations || [] };
  } catch (err) {
    return { success: false, error: err.message, stations: [] };
  }
}

// ── Product Questions ─────────────────────────────────────────────
export async function getProductQuestions(listingId) {
  try {
    const resp = await fetch(`${API_URL}/api/products/${listingId}/questions`);
    const data = await resp.json();
    return { success: true, questions: data.questions || [] };
  } catch (err) {
    return { success: false, error: err.message, questions: [] };
  }
}

export async function postProductQuestion(listingId, question, userId, userName) {
  try {
    const resp = await fetch(`${API_URL}/api/products/${listingId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userId, userName }),
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function answerProductQuestion(questionId, answer, userId) {
  try {
    const resp = await fetch(`${API_URL}/api/questions/${questionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, userId }),
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Wholesale Pricing ─────────────────────────────────────────────
export async function getWholesalePrices(listingId) {
  try {
    const resp = await fetch(`${API_URL}/api/products/${listingId}/wholesale`);
    const data = await resp.json();
    return { success: true, prices: data.prices || [] };
  } catch (err) {
    return { success: false, error: err.message, prices: [] };
  }
}

export async function saveWholesalePrices(listingId, tiers) {
  try {
    const resp = await fetch(`${API_URL}/api/admin/products/${listingId}/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiers }),
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Seller Registration & Profile ─────────────────────────────────
export async function getSellerProfile(userId) {
  try {
    const resp = await fetch(`${API_URL}/api/seller/profile?user_id=${userId}`);
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message, seller: null };
  }
}

export async function getSellerBySlug(slug) {
  try {
    const resp = await fetch(`${API_URL}/api/seller/${slug}`);
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function registerSeller({ userId, shopName, shopSlug, description, phone, email, address, businessRegistration, kraPin, idNumber, mpesaPhone }) {
  try {
    const resp = await fetch(`${API_URL}/api/seller/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, shopName, shopSlug, description, phone, email, address, businessRegistration, kraPin, idNumber, mpesaPhone }),
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSellerAnalytics(sellerId) {
  try {
    const resp = await fetch(`${API_URL}/api/seller/${sellerId}/analytics`);
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Admin: Seller Management ──────────────────────────────────────
export async function getAdminSellers({ status, search, page, limit } = {}) {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    const resp = await fetch(`${API_URL}/api/admin/sellers?${params.toString()}`, {
      credentials: 'include',
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message, sellers: [], total: 0 };
  }
}

export async function approveSeller(sellerId) {
  try {
    const resp = await fetch(`${API_URL}/api/admin/sellers/${sellerId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectSeller(sellerId, reason) {
  try {
    const resp = await fetch(`${API_URL}/api/admin/sellers/${sellerId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Return Requests ───────────────────────────────────────────────
export async function submitReturnRequest(orderId, reason, userId, orderItemId) {
  try {
    const resp = await fetch(`${API_URL}/api/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason, userId, orderItemId }),
    });
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Full Order Tracking ───────────────────────────────────────────
export async function getOrderTrackingFull(orderId) {
  try {
    const resp = await fetch(`${API_URL}/api/orders/${orderId}/tracking-full`);
    const data = await resp.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}
