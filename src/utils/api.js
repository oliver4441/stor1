// API layer — back to Supabase
import { supabase } from './supabase'
import { CATEGORY_TO_ID } from './constants'

// Auth
export async function signUp({ email, password, fullName, phone }) {
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } }
  });
  if (authError) return { success: false, error: authError.message };
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      role: 'customer',
    });
    if (profileError) {
      console.warn('Profile insert failed (non-critical):', profileError.message);
    }
  }
  // Return session if auto-signed in (email confirmation disabled), null if verification needed
  return { success: true, user: data.user, session: data.session };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  return { success: true, user: data.user }
}

export async function signOut() {
  await supabase.auth.signOut()
  return { success: true }
}

export function getCurrentUser() {
  return supabase.auth.getUser().then(({ data }) => data.user)
}

// Listings
export async function fetchListings(category = 'All', searchQuery = '') {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query
  if (error) { console.error(error); return [] }
  return data || []
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
      images: formData.image_url ? [formData.image_url] : [],
      seller_name: formData.seller_name || user?.user_metadata?.full_name,
      seller_id: user?.id || null,
      seller_phone: formData.seller_phone || null,
      status: 'active',
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
      images: formData.image_url ? [formData.image_url] : [],
      seller_name: formData.seller_name || user?.user_metadata?.full_name,
      seller_phone: formData.seller_phone || null,
      updated_at: new Date().toISOString(),
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

// Delete listing
export async function deleteListing(id) {
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
  const { error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Admin: delete any listing
export async function adminDeleteListing(id) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Orders (Online Store) ────────────────────────────────

export async function createOrder({ items, total, customerName, phone, email, address, city }) {
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

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('omix_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Admin ────────────────────────────────────────────────

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
