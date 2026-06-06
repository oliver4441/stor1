import { supabase } from './supabase'
import { CATEGORY_TO_ID, ID_TO_CATEGORY } from './constants'

// Fetch listings from Supabase
export async function fetchListings(category = 'All', searchQuery = '') {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (category && category !== 'All') {
    const catId = CATEGORY_TO_ID[category];
    if (catId) {
      query = query.eq('category_id', catId);
    }
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchListings error:', error);
    return [];
  }

  // Map DB fields to frontend format
  return (data || []).map(listing => ({
    ...listing,
    category: listing.category || ID_TO_CATEGORY[listing.category_id] || 'Others',
    location: listing.location_city || listing.location_region || '',
    images: listing.images || null,
    seller_name: listing.seller_name || null,
  }));
}

// Fetch single listing
export async function fetchListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('fetchListing error:', error);
    return null;
  }
  if (!data) return null;

  // Map DB fields to frontend format
  return {
    ...data,
    category: data.category || ID_TO_CATEGORY[data.category_id] || 'Others',
    location: data.location_city || data.location_region || '',
    images: data.images || null,
    seller_name: data.seller_name || null,
  };
}

// Create listing
export async function createListing(formData) {
  const { data: { user } } = await supabase.auth.getUser();
  const catId = CATEGORY_TO_ID[formData.category] || null;

  const insertData = {
    title: formData.title,
    description: formData.description,
    price: parseInt(formData.price),
    condition: formData.condition,
    category_id: catId,
    location_city: formData.location,
    location_region: 'Kericho',
    images: formData.image_url ? [formData.image_url] : [],
    seller_name: formData.seller_name || user?.user_metadata?.full_name,
    seller_id: user?.id || null, // Link to auth user
    seller_phone: formData.seller_phone || null,
    status: 'active',
  };

  const { data, error } = await supabase
    .from('listings')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('createListing error:', error);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}
