-- Enable RLS on core tables
ALTER TABLE IF EXISTS listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS omix_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Public listings are viewable by everyone" ON listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can insert their own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings" ON listings
  FOR UPDATE USING (auth.uid() = seller_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON omix_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create orders" ON omix_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
