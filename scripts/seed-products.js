#!/usr/bin/env node
/**
 * Omix Store — Seed Products Script
 *
 * Run this from the omix-api backend to seed the database with products.
 * Requires SUPABASE_SERVICE_KEY to be set in environment.
 *
 * Usage:
 *   cd /home/oliver/omix-api
 *   node seed-products.js
 *
 * Or from Render:
 *   Add SEED_RUN=true to env vars, deploy, then remove.
 */

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fdwoezyataxhdtgjlfxt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY || SUPABASE_KEY.includes('...')) {
  console.error('ERROR: Full SUPABASE_SERVICE_KEY is required. Current key is truncated.');
  console.error('Update the key in /home/oliver/omix-api/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PRODUCTS = [
  {
    title: 'Fresh Farm Eggs (Tray)',
    description: 'High-quality fresh farm eggs, 30 eggs per tray. Sourced from local farms in Kericho.',
    price: 450,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 1,
    quantity: 50,
  },
  {
    title: 'Organic Kenyan Tea (500g)',
    description: 'Premium organic black tea from the Kericho highlands. Rich flavor, 500g pack.',
    price: 350,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 1,
    quantity: 30,
  },
  {
    title: 'Wireless Bluetooth Earbuds',
    description: 'High-quality wireless earbuds with noise cancellation. 8hr battery life.',
    price: 1200,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 3,
    quantity: 20,
  },
  {
    title: 'Smartphone Charger USB-C',
    description: 'Fast charging USB-C charger, compatible with most smartphones. 2m cable included.',
    price: 500,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 3,
    quantity: 25,
  },
  {
    title: 'Men\'s Casual Sneakers (Size 42)',
    description: 'Comfortable casual sneakers, perfect for everyday wear. Black/white.',
    price: 1800,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 5,
    quantity: 15,
  },
  {
    title: 'Women\'s Handbag - Leather',
    description: 'Elegant synthetic leather handbag with multiple compartments. Brown.',
    price: 1500,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 5,
    quantity: 10,
  },
  {
    title: 'Cooking Gas - 6kg Cylinder',
    description: 'Refill of 6kg LPG cooking gas cylinder. Delivery within Kericho town.',
    price: 2300,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 1,
    quantity: 10,
  },
  {
    title: 'Blender 3-Speed 1.5L',
    description: 'Powerful 3-speed blender with 1.5L capacity. Stainless steel blades.',
    price: 2500,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 2,
    quantity: 8,
  },
  {
    title: 'School Notebooks (Pack of 10)',
    description: 'Pack of 10 exercise books, 200 pages each. Ruled paper.',
    price: 600,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 4,
    quantity: 40,
  },
  {
    title: 'Men\'s Wrist Watch - Digital',
    description: 'Digital wrist watch with alarm, stopwatch, and backlight. Water resistant.',
    price: 1000,
    condition: 'new',
    status: 'active',
    location_city: 'Kericho',
    images: [],
    category_id: 5,
    quantity: 12,
  },
];

async function seed() {
  console.log(`Seeding ${PRODUCTS.length} products...`);

  const { data: { user } } = await supabase.auth.admin.getUserById('seed');
  if (!user) {
    // Use first admin user or create seed user
    console.log('Creating seed as anonymous...');
  }

  const { data, error } = await supabase.from('listings').insert(
    PRODUCTS.map(p => ({
      ...p,
      seller_id: null, // System products
    }))
  );

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ ${PRODUCTS.length} products seeded successfully!`);
}

seed().catch(console.error);
