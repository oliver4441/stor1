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
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      role: 'seller',
    });
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

export async function fetchWishes(category = 'All', status = 'open') {
  let query = supabase
    .from('wishes')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'All') {
    query = query.eq('status', status)
  }
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) { console.error('fetchWishes error:', error); return [] }
  return data || []
}

export async function fetchWish(id) {
  let query = supabase
    .from('wishes')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await query
  if (error) { console.error(error); return null }
  return data
}

export async function fetchUserWishes() {
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchUserWishes error:', error); return [] }
  return data || []
}

export async function createWish(formData) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('wishes')
    .insert({
      title: formData.title,
      category: formData.category,
      description: formData.description,
      budget_min: parseInt(formData.budget_min) || 0,
      budget_max: parseInt(formData.budget_max) || 0,
      urgency: formData.urgency || 'normal',
      requester_name: formData.requester_name || user?.user_metadata?.full_name || 'Anonymous',
      requester_phone: formData.requester_phone || null,
      user_id: user?.id || null,
      status: 'open',
    })
    .select('*')
    .single()

  if (error) {
    console.error('createWish error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, wish: data }
}

export async function updateWishStatus(id, status) {
  const { error } = await supabase
    .from('wishes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Messages (P2P Chat) ────────────────────────────────

export async function fetchMessages(wishId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('wish_id', wishId)
    .order('created_at', { ascending: true })
  if (error) { console.error('fetchMessages error:', error); return [] }
  return data || []
}

export async function sendMessage({ wishId, receiverId, content }) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      wish_id: wishId,
      sender_id: user?.id || null,
      receiver_id: receiverId || null,
      sender_name: user?.user_metadata?.full_name || 'Anonymous',
      content,
    })
    .select('*')
    .single()

  if (error) {
    console.error('sendMessage error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, message: data }
}

// ── Events ──────────────────────────────────────────────

export async function fetchEvents(status = 'published', category = 'All') {
  let query = supabase
    .from('events')
    .select('*, ticket_types(*)')
    .order('event_date', { ascending: true })

  if (status && status !== 'All') {
    query = query.eq('status', status)
  }
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) { console.error('fetchEvents error:', error); return [] }
  return data || []
}

export async function fetchEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*, ticket_types(*)')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function fetchOrganizerEvents(organizerId) {
  const { data, error } = await supabase
    .from('events')
    .select('*, ticket_types(*)')
    .eq('organizer_id', organizerId)
    .order('event_date', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function createEvent(formData) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: formData.title,
      description: formData.description,
      category: formData.category || 'General',
      venue: formData.venue,
      event_date: formData.event_date,
      event_end_date: formData.event_end_date || null,
      image_url: formData.image_url || null,
      organizer_id: user?.id || null,
      organizer_name: formData.organizer_name || user?.user_metadata?.full_name || 'Anonymous',
      organizer_phone: formData.organizer_phone || null,
      status: 'pending_review',
      commission_type: 'hybrid',
      commission_flat: 50,
      commission_percent: 5,
      max_tickets_per_order: 4,
    })
    .select('*')
    .single()

  if (error) {
    console.error('createEvent error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, event: data }
}

export async function createTicketType(formData) {
  const { data, error } = await supabase
    .from('ticket_types')
    .insert({
      event_id: formData.event_id,
      name: formData.name,
      description: formData.description || null,
      price: parseInt(formData.price) || 0,
      quantity_total: parseInt(formData.quantity_total) || 100,
      max_per_order: parseInt(formData.max_per_order) || 4,
      sale_start: formData.sale_start || null,
      sale_end: formData.sale_end || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('createTicketType error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, ticketType: data }
}

// ── Orders & Tickets ────────────────────────────────────

export async function createOrder({ eventId, ticketTypeId, quantity, buyerName, buyerEmail, buyerPhone }) {
  // Fetch ticket type to get price
  const { data: ticketType, error: ttError } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('id', ticketTypeId)
    .single()

  if (ttError || !ticketType) {
    return { success: false, error: 'Ticket type not found' }
  }

  // Check availability
  const available = ticketType.quantity_total - ticketType.quantity_sold
  if (quantity > available) {
    return { success: false, error: `Only ${available} tickets remaining` }
  }
  if (quantity > ticketType.max_per_order) {
    return { success: false, error: `Maximum ${ticketType.max_per_order} tickets per order` }
  }

  const unitPrice = ticketType.price

  // Hybrid commission: KES 50 OR 5%, whichever is higher
  const flatCommission = 50
  const percentCommission = Math.ceil(unitPrice * 0.05)
  const commissionPerTicket = Math.max(flatCommission, percentCommission)
  const totalAmount = (unitPrice * quantity) + (commissionPerTicket * quantity)

  const { data, error } = await supabase
    .from('orders')
    .insert({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      quantity,
      unit_price: unitPrice,
      commission_amount: commissionPerTicket * quantity,
      total_amount: totalAmount,
      payment_status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    console.error('createOrder error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, order: data }
}

export async function updateOrderPayment(orderId, { paystackReference, paymentStatus, mpesaReceipt }) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      paystack_reference: paystackReference,
      payment_status: paymentStatus,
      mpesa_receipt: mpesaReceipt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error) {
    console.error('updateOrderPayment error:', error)
    return { success: false, error: error.message }
  }
  return { success: true, order: data }
}

export async function fetchOrder(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, events(*), ticket_types(*)')
    .eq('id', id)
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function fetchTickets(orderId) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}

export async function generateTickets(orderId) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, events(*), ticket_types(*)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: 'Order not found' }
  }

  // Generate ticket records
  const tickets = []
  for (let i = 0; i < order.quantity; i++) {
    const ticketNumber = `OMX-EVT${String(order.event_id).padStart(3, '0')}-${String(Date.now()).slice(-6)}${String(i).padStart(2, '0')}`
    tickets.push({
      order_id: orderId,
      event_id: order.event_id,
      ticket_type_id: order.ticket_type_id,
      ticket_number: ticketNumber,
      holder_name: order.buyer_name,
      qr_code_data: ticketNumber,
      status: 'valid',
    })
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert(tickets)
    .select('*')

  if (error) {
    console.error('generateTickets error:', error)
    return { success: false, error: error.message }
  }

  // Update ticket type quantity_sold
  await supabase
    .from('ticket_types')
    .update({ quantity_sold: (order.ticket_types?.quantity_sold || 0) + order.quantity })
    .eq('id', order.ticket_type_id)

  return { success: true, tickets: data }
}

// ── Paystack Integration ─────────────────────────────────
// Paystack inline payment — user completes payment on Paystack's hosted page
// Server-side proxy needed — these functions call our backend

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function paystackInitialize({ orderId, email, amount, phone, callbackUrl }) {
  const res = await fetch(`${API_BASE}/api/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId, email, amount, phone, callback_url: callbackUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.message || 'Payment initialization failed' };
  }

  const data = await res.json();
  return { success: true, ...data };
}

export async function paystackVerify(reference) {
  const res = await fetch(`${API_BASE}/api/paystack/verify/${reference}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.message || 'Verification failed' };
  }

  const data = await res.json();
  return { success: true, ...data };
}

// ── Listing Payments ─────────────────────────────────────

export async function createListingPayment(listingData) {
  const { data: { user } } = await supabase.auth.getUser();

  const paymentRecord = {
    user_id: user?.id || null,
    amount: 5,
    payment_status: 'pending',
    listing_data: listingData,
  };

  const { data, error } = await supabase
    .from('listing_payments')
    .insert(paymentRecord)
    .select('*')
    .single();

  if (error) {
    console.error('createListingPayment error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, payment: data };
}

export async function updateListingPaymentStatus(paymentId, { paystackReference, paymentStatus }) {
  const { data, error } = await supabase
    .from('listing_payments')
    .update({
      paystack_reference: paystackReference,
      payment_status: paymentStatus,
    })
    .eq('id', paymentId)
    .select('*')
    .single();

  if (error) {
    console.error('updateListingPaymentStatus error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, payment: data };
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

export async function updateEventStatus(eventId, { status, rejectionReason = null }) {
  const updateData = { status, updated_at: new Date().toISOString() };
  if (rejectionReason !== null) {
    updateData.rejection_reason = rejectionReason;
  }
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .select('*')
    .single();

  if (error) {
    console.error('updateEventStatus error:', error);
    return { success: false, error: error.message };
  }
  return { success: true, event: data };
}

export async function paystackPollStatus(orderId, reference, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000)); // wait 3s between polls
    const result = await paystackVerify(reference);
    if (result.success && result.data?.status === 'success') {
      return { success: true, data: result.data };
    }
    if (result.data && result.data.status !== 'pending' && result.data.status !== 'processing') {
      return result;
    }
  }
  return { success: false, error: 'Payment timed out. If money was deducted, contact support.' };
}
