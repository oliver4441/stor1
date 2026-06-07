-- Omix Events & Ticketing Schema v2
-- Run this in Supabase SQL Editor (replace the previous version)

-- ── Events table ──
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT,
  organizer_verified BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  venue TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'paused', 'ended', 'cancelled', 'rejected')),
  commission_type TEXT DEFAULT 'hybrid' CHECK (commission_type IN ('flat', 'percent', 'hybrid')),
  commission_flat INTEGER DEFAULT 50,
  commission_percent INTEGER DEFAULT 5,
  max_tickets_per_order INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Ticket types per event ──
CREATE TABLE IF NOT EXISTS ticket_types (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 4,
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ──
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
  ticket_type_id BIGINT REFERENCES ticket_types(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  paystack_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  mpesa_receipt TEXT,
  refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'requested', 'approved', 'processed')),
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tickets ──
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
  ticket_type_id BIGINT REFERENCES ticket_types(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  holder_name TEXT NOT NULL,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  qr_code_data TEXT,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Organizer verification ──
CREATE TABLE IF NOT EXISTS organizer_verification (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  mpesa_till TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS Policies ──
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_verification ENABLE ROW LEVEL SECURITY;

-- Events: anyone can view published, organizers manage own
CREATE POLICY "Anyone can view published events" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "Organizers can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete own events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- Ticket types
CREATE POLICY "Anyone can view ticket types" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "Organizers can manage ticket types" ON ticket_types FOR ALL USING (
  auth.uid() IN (SELECT organizer_id FROM events WHERE id = ticket_types.event_id)
);

-- Orders
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view orders" ON orders FOR SELECT USING (true);

-- Tickets
CREATE POLICY "Anyone can view tickets" ON tickets FOR SELECT USING (true);

-- Organizer verification
CREATE POLICY "Users can manage own verification" ON organizer_verification FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_paystack ON orders(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_organizer_verification_user ON organizer_verification(user_id);
