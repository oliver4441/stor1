export const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Clothing', 'Services', 'Vehicles', 'Home & Garden', 'Books', 'Sports', 'Health & Beauty', 'Others'];
export const LOCATIONS = ['CBD', 'Litein', 'Kapsoit', 'Brooke', 'Sosiot', 'Kaitet', 'Awasi', 'Kipchimchim', 'Chepseon'];

// Category name → category_id mapping (from Supabase categories table)
export const CATEGORY_TO_ID = {
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
export const ID_TO_CATEGORY = {};
Object.entries(CATEGORY_TO_ID).forEach(([name, id]) => { ID_TO_CATEGORY[id] = name; });

// Helper to format currency
export function formatKES(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
}
