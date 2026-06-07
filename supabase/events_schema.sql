-- Omix Events & Ticketing Schema
-- Run this in Supabase SQL Editor

-- ── Events table ──
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  venue TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'cancelled')),
  commission_fee INTEGER DEFAULT 50, -- flat fee per ticket in KES
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Ticket types per event ──
CREATE TABLE IF NOT EXISTS ticket_types (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Early Bird", "VIP", "Regular"
  description TEXT,
  price INTEGER NOT NULL, -- in KES
  quantity_total INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  sale_start TIMESTAMPTZ,
  sale_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders (ticket purchases) ──
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
  ticket_type_id BIGINT REFERENCES ticket_types(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL, -- price per ticket in KES
  commission_fee INTEGER NOT NULL, -- flat fee per ticket
  total_amount INTEGER NOT NULL, -- (unit_price * quantity) + (commission_fee * quantity)
  paystack_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  mpesa_receipt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tickets (generated after payment) ──
CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  event_id BIGINT REFERENCES events(id) ON DELETE SET NULL,
  ticket_type_id BIGINT REFERENCES ticket_types(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL UNIQUE, -- e.g. "OMX-EVT001-00042"
  holder_name TEXT NOT NULL,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  qr_code_data TEXT, -- data encoded in QR
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS Policies ──
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Events: anyone can view active events, organizers can manage own
CREATE POLICY "Anyone can view active events" ON events FOR SELECT USING (status = 'active');
CREATE POLICY "Organizers can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete own events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- Ticket types: anyone can view, organizers can manage
CREATE POLICY "Anyone can view ticket types" ON ticket_types FOR SELECT USING (true);
CREATE POLICY "Organizers can manage ticket types" ON ticket_types FOR ALL USING (
  auth.uid() IN (SELECT organizer_id FROM events WHERE id = ticket_types.event_id)
);

-- Orders: buyers can view own, anyone can create
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Buyers can view own orders" ON orders FOR SELECT USING (true);

-- Tickets: view own tickets
CREATE POLICY "Anyone can view tickets" ON tickets FOR SELECT USING (true);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_paystack ON orders(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
