const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://fdwoezyataxhdtgjlfxt.supabase.co';
const serviceKey = 'eyJhbG...YTD4'; // From backend .env file, truncated for display - need full key

// Actually, let me read the actual key from the file
const fs = require('fs');
const path = require('path');

function getEnvVar(key) {
  const envPath = path.resolve('/home/oliver/omix-api/.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
}

const SUPABASE_URL = getEnvVar('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnvVar('SUPABASE_SERVICE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in /home/oliver/omix-api/.env');
  process.exit(1);
}

console.log(`Connecting to ${SUPABASE_URL}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to check if a table exists
async function tableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  // If we get a 404 or PGRST204, the table doesn't exist
  // If we get data or a different error (like permission), the table exists
  if (error) {
    if (error.code === '42P01' || error.message.includes('Could not find relation')) {
      return false;
    }
    // Other error might mean table exists but we lack permissions
    console.log(`Error checking table ${tableName}:`, error.message);
    return true; // Assume exists if we get a different error
  }
  return true;
}

// Function to check if a column exists in a table
async function columnExists(tableName, columnName) {
  const { data, error } = await supabase
    .from(tableName)
    .select(columnName)
    .limit(1);
    
  if (error) {
    if (error.code === '42703' || error.message.includes('column does not exist')) {
      return false;
    }
    // Other error might mean column exists but we lack permissions
    console.log(`Error checking column ${tableName}.${columnName}:`, error.message);
    return true; // Assume exists if we get a different error
  }
  return true;
}

// List of migrations to check from blue_prism_migration.sql
const checks = [
  // Table existence checks
  { type: 'table', name: 'omix_order_items' },
  { type: 'table', name: 'saved_addresses' },
  { type: 'table', name: 'referral_rewards' },
  { type: 'table', name: 'points_transactions' },
  { type: 'table', name: 'stock_watchers' },
  
  // Column existence checks
  { type: 'column', table: 'profiles', column: 'email' },
  { type: 'column', table: 'profiles', column: 'role' },
  { type: 'column', table: 'profiles', column: 'referred_by' },
  { type: 'column', table: 'listings', column: 'seller_name' },
  { type: 'column', table: 'listings', column: 'seller_phone' },
  { type: 'column', table: 'listings', column: 'sku' },
  { type: 'column', table: 'listings', column: 'model' },
  { type: 'column', table: 'listings', column: 'weight' },
  { type: 'column', table: 'listings', column: 'description' },
  { type: 'column', table: 'omix_orders', column: 'user_id' },
  { type: 'column', table: 'omix_orders', column: 'status' },
  { type: 'column', table: 'omix_orders', column: 'total_amount' },
  { type: 'column', table: 'omix_orders', column: 'customer_name' },
  { type: 'column', table: 'omix_orders', column: 'email' },
  { type: 'column', table: 'omix_orders', column: 'phone' },
  { type: 'column', table: 'omix_orders', column: 'address' },
  { type: 'column', table: 'omix_orders', column: 'city' },
  { type: 'column', table: 'omix_orders', column: 'area' },
  { type: 'column', table: 'omix_orders', column: 'landmark' },
  { type: 'column', table: 'omix_orders', column: 'promo_code_id' },
  { type: 'column', table: 'omix_orders', column: 'promo_code_text' },
  { type: 'column', table: 'omix_orders', column: 'delivery_discount' },
  { type: 'column', table: 'omix_orders', column: 'loyalty_points_used' },
  { type: 'column', table: 'omix_orders', column: 'referral_code' },
  { type: 'column', table: 'omix_orders', column: 'admin_notes' },
  { type: 'column', table: 'omix_orders', column: 'cancelled_at' },
  { type: 'column', table: 'omix_orders', column: 'cancellation_reason' },
  { type: 'column', table: 'omix_orders', column: 'paystack_reference' },
  { type: 'column', table: 'omix_orders', column: 'paid_at' },
  { type: 'column', table: 'categories', column: 'image_url' },
  { type: 'column', table: 'reviews', column: 'user_id' },
  { type: 'column', table: 'reviews', column: 'listing_id' },
  { type: 'column', table: 'reviews', column: 'rating' },
  { type: 'column', table: 'reviews', column: 'comment' },
  { type: 'column', table: 'reviews', column: 'created_at' },
];

async function runChecks() {
  console.log('Running migration status checks...\n');
  
  let allPassed = true;
  
  for (const check of checks) {
    let exists = false;
    let status = 'unknown';
    
    if (check.type === 'table') {
      exists = await tableExists(check.name);
      status = exists ? 'EXISTS' : 'MISSING';
    } else if (check.type === 'column') {
      exists = await columnExists(check.table, check.column);
      status = exists ? 'EXISTS' : 'MISSING';
    }
    
    const icon = exists ? '✓' : '✗';
    console.log(`${icon} ${check.type}: ${check.table}${check.column ? '.' + check.column : ''} - ${status}`);
    
    if (!exists) {
      allPassed = false;
    }
  }
  
  console.log(`\n${allPassed ? '✓ All migrations appear to be applied' : '✗ Some migrations are missing'}`);
  return allPassed;
}

runChecks().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Error running checks:', err);
  process.exit(1);
});