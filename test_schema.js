import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkTables() {
  // Check omix_orders table
  const { data: ordersCols } = await supabase.rpc('get_columns', { table_name: 'omix_orders' });
  console.log('omix_orders columns:', JSON.stringify(ordersCols, null, 2));
  
  // Check omix_order_items table
  const { data: itemsCols } = await supabase.rpc('get_columns', { table_name: 'omix_order_items' });
  console.log('omix_order_items columns:', JSON.stringify(itemsCols, null, 2));
}

checkTables().catch(console.error);
