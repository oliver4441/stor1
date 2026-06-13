export const CATEGORIES = [
  'All',
  'Electronics',
  'Furniture',
  'Clothing',
  'Services',
  'Vehicles',
  'Home & Garden',
  'Books',
  'Sports',
  'Health & Beauty',
  'Food',
  'Drinks',
  'Snacks',
  'Bakery',
  'Others'
];

// SKU prefix per category — used for auto-generating SKUs
export const CATEGORY_SKU_PREFIX = {
  'Electronics': 'ELEC',
  'Furniture': 'FURN',
  'Clothing': 'CLTH',
  'Services': 'SERV',
  'Vehicles': 'VEHI',
  'Home & Garden': 'HOME',
  'Books': 'BOOK',
  'Sports': 'SPRT',
  'Health & Beauty': 'BEAU',
  'Food': 'FOOD',
  'Drinks': 'DRNK',
  'Snacks': 'SNCK',
  'Bakery': 'BAKE',
  'Others': 'OTHR',
};

// Generate a unique SKU for a given category
export function generateSKU(category) {
  const prefix = CATEGORY_SKU_PREFIX[category] || 'PROD';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

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
  'Food': 12,
  'Drinks': 13,
  'Snacks': 14,
  'Bakery': 15,
  'Others': 11,
};

// Category id → name mapping
export const ID_TO_CATEGORY = {};
Object.entries(CATEGORY_TO_ID).forEach(([name, id]) => { ID_TO_CATEGORY[id] = name; });

// Helper to format currency
export function formatKES(amount) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(amount);
}
