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
  'Services': 10,
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
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

// ── Size Presets per category ──────────────────────────────
export const SIZE_PRESETS = {
  'Clothing': ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  'T-Shirts': ['S', 'M', 'L', 'XL', 'XXL'],
  'Shoes (Men)': ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  'Shoes (Women)': ['34', '35', '36', '37', '38', '39', '40', '41', '42'],
  'Shoes (Kids)': ['28', '29', '30', '31', '32', '33', '34', '35'],
  'Pants': ['28', '30', '32', '34', '36', '38', '40', '42'],
  'Belts': ['S', 'M', 'L', 'XL'],
  'Hats': ['S', 'M', 'L', 'XL', 'One Size'],
  'Jewelry': ['One Size'],
};

// Get size preset for a category, fallback to generic
export function getPresetSizes(category) {
  if (SIZE_PRESETS[category]) return SIZE_PRESETS[category];
  // Try partial match
  for (const [key, sizes] of Object.entries(SIZE_PRESETS)) {
    if (category.toLowerCase().includes(key.toLowerCase().replace(/ *\(.*\)/, ''))) return sizes;
  }
  return null; // No preset — free text input
}

// ── Color Palette ──────────────────────────────────────────
export const COLOR_PALETTE = [
  { name: 'Black',       hex: '#1a1a1a' },
  { name: 'White',       hex: '#FFFFFF' },
  { name: 'Navy',        hex: '#1e3a5f' },
  { name: 'Blue',        hex: '#2563eb' },
  { name: 'Light Blue',  hex: '#7dd3fc' },
  { name: 'Red',         hex: '#dc2626' },
  { name: 'Burgundy',    hex: '#7f1d1d' },
  { name: 'Pink',        hex: '#f472b6' },
  { name: 'Hot Pink',    hex: '#ec4899' },
  { name: 'Green',       hex: '#16a34a' },
  { name: 'Olive',       hex: '#4d7c0f' },
  { name: 'Khaki',       hex: '#a3a37c' },
  { name: 'Lime',        hex: '#65a30d' },
  { name: 'Yellow',      hex: '#eab308' },
  { name: 'Orange',      hex: '#ea580c' },
  { name: 'Brown',       hex: '#78350f' },
  { name: 'Tan',         hex: '#d4b896' },
  { name: 'Purple',      hex: '#7c3aed' },
  { name: 'Violet',      hex: '#8b5cf6' },
  { name: 'Grey',        hex: '#6b7280' },
  { name: 'Silver',      hex: '#9ca3af' },
  { name: 'Gold',        hex: '#d4a017' },
  { name: 'Cream',       hex: '#fef3c7' },
  { name: 'Beige',       hex: '#d6d3d1' },
  { name: 'Maroon',      hex: '#6b1d2a' },
  { name: 'Teal',        hex: '#0d9488' },
  { name: 'Coral',       hex: '#fb7185' },
  { name: 'Mint',        hex: '#6ee7b7' },
  { name: 'Multicolor',  hex: 'linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #9b59b6)' },
];
