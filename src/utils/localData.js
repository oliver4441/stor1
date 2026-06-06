// Local storage-based data layer (replaces Supabase)
const STORAGE_KEY = 'omix_listings';
const USERS_KEY = 'omix_users';
const SESSION_KEY = 'omix_session';

// Seed data for demo
const SEED_LISTINGS = [
  {
    id: '1',
    title: 'iPhone 13 Pro',
    description: 'Excellent condition, 256GB, Pacific Blue. Comes with original box and charger.',
    price: 85000,
    condition: 'Like New',
    category: 'Electronics',
    category_id: 1,
    location: 'CBD',
    images: [],
    seller_name: 'Kiprono Yegon',
    seller_phone: '+254712345678',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Sofa Set (3+2)',
    description: 'Leather sofa set in great condition. Moving out sale.',
    price: 35000,
    condition: 'Good',
    category: 'Furniture',
    category_id: 2,
    location: 'Litein',
    images: [],
    seller_name: 'Chebet Langat',
    seller_phone: '+254723456789',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Samsung 55" 4K TV',
    description: 'Smart TV, works perfectly. Wall mount included.',
    price: 42000,
    condition: 'Good',
    category: 'Electronics',
    category_id: 1,
    location: 'Brooke',
    images: [],
    seller_name: 'Langat Kipkoech',
    seller_phone: '+254734567890',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Men\'s Sneakers Size 42',
    description: 'Nike Air Max, worn twice. Original price 12,000.',
    price: 7000,
    condition: 'Like New',
    category: 'Clothing',
    category_id: 3,
    location: 'Kapsoit',
    images: [],
    seller_name: 'Kiplangat Rotich',
    seller_phone: '+254745678901',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Tecno Spark 10C',
    description: 'Brand new, sealed in box. 128GB storage.',
    price: 16500,
    condition: 'New',
    category: 'Electronics',
    category_id: 1,
    location: 'Sosiot',
    images: [],
    seller_name: 'Jelagat Chelangat',
    seller_phone: '+254756789012',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Dining Table (6 seater)',
    description: 'Solid wood dining table with 6 chairs. Slight scratches but sturdy.',
    price: 28000,
    condition: 'Fair',
    category: 'Furniture',
    category_id: 2,
    location: 'Kaitet',
    images: [],
    seller_name: 'Kipchirchir Ngetich',
    seller_phone: '+254767890123',
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

function getListings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LISTINGS));
    return SEED_LISTINGS;
  }
  return JSON.parse(stored);
}

function saveListings(listings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
}

// Auth functions (local session-based)
export function getCurrentUser() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export async function signUp({ email, password, fullName }) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const exists = users.find(u => u.email === email);
  if (exists) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  const newUser = {
    id: 'user_' + Date.now(),
    email,
    password, // Note: stored in plain text locally — fine for local-only demo
    full_name: fullName,
    role: 'seller',
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Auto-login
  const session = { id: newUser.id, email: newUser.email, full_name: newUser.full_name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export async function signIn({ email, password }) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return { success: false, error: 'Invalid email or password.' };
  }
  const session = { id: user.id, email: user.email, full_name: user.full_name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export async function signOut() {
  localStorage.removeItem(SESSION_KEY);
  return { success: true };
}

// Listing functions
export async function fetchListings(category = 'All', searchQuery = '') {
  let listings = getListings().filter(l => l.status === 'active');

  if (category && category !== 'All') {
    listings = listings.filter(l => l.category === category);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    listings = listings.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q)
    );
  }

  return listings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function fetchListing(id) {
  const listings = getListings();
  return listings.find(l => l.id === id) || null;
}

export async function uploadImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ success: true, url: reader.result });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  });
}

export async function createListing(formData) {
  const user = getCurrentUser();
  const listings = getListings();

  const newListing = {
    id: 'listing_' + Date.now(),
    title: formData.title,
    description: formData.description,
    price: parseInt(formData.price) || 0,
    condition: formData.condition,
    category: formData.category,
    category_id: formData.category_id || null,
    location: formData.location,
    location_region: 'Kericho',
    images: formData.image_url ? [formData.image_url] : [],
    seller_name: formData.seller_name || user?.full_name || 'Anonymous',
    seller_id: user?.id || null,
    seller_phone: formData.seller_phone || null,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  listings.unshift(newListing);
  saveListings(listings);
  return { success: true, id: newListing.id };
}

export async function fetchUserListings(userId) {
  const listings = getListings();
  return listings.filter(l => l.seller_id === userId);
}

export { getCurrentUser as getUser };
