// API layer — back to Supabase
import { supabase } from './supabase'
import { CATEGORY_TO_ID } from './constants'

// Auth
export async function signUp({ email, password, fullName }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  if (authError) return { success: false, error: authError.message }
  if (authData.user) {
    await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role: 'seller'
    })
  }
  return { success: true, user: authData.user }
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
export async function uploadImage(file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `listings/${fileName}`

  const { error } = await supabase.storage
    .from('listing-images')
    .upload(filePath, file, { upsert: false })

  if (error) {
    console.error('uploadImage error:', error)
    return { success: false, error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('listing-images')
    .getPublicUrl(filePath)

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
