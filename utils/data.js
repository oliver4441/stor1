// Supabase client — loaded via CDN in HTML
const SUPABASE_URL = "https://fdwoezyataxhdtgjlfxt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkd29lenlhdGF4aGR0Z2psZnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzI4NjAsImV4cCI6MjA5Mzc0ODg2MH0.EdYm_7067vC16FJU5nocOnejoxAEHbeCatSuj4nYgnE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Clothing', 'Services', 'Vehicles', 'Home & Garden', 'Books', 'Sports', 'Health & Beauty', 'Others'];
const LOCATIONS = ['CBD', 'Litein', 'Kapsoit', 'Brooke', 'Sosiot', 'Kaitet', 'Awasi', 'Kipchimchim', 'Chepseon'];

// Category name → category_id mapping (from Supabase categories table)
const CATEGORY_TO_ID = {
  'Electronics': 1,
  'Furniture': 2,
  'Clothing': 3,
  'Books': 4,
  'Vehicles': 5,
  'Home & Garden': 6,
  'Sports': 7,
  'Toys & Games': 8,
  'Health & Beauty': 9,
  'Business Services': 10,
  'Others': 11,
};

// Category id → name mapping
const ID_TO_CATEGORY = {};
Object.entries(CATEGORY_TO_ID).forEach(([name, id]) => { ID_TO_CATEGORY[id] = name; });

// Helper to format currency
const formatKES = (amount) => {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
};

// Fetch listings from Supabase
async function fetchListings(category = 'All', searchQuery = '') {
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
async function fetchListing(id) {
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
async function createListing(formData) {
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
    seller_name: formData.seller_name,
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
