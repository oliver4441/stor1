# Last-Mile Agent Network Architecture

## What It Is

A decentralized delivery network where local agents (boda boda riders, shopkeepers, students, stay-at-home parents) sign up to deliver orders in their neighbourhood for a fee. Think of it as Uber for local delivery, but designed for Kericho's infrastructure — no GPS required, cash-friendly, SMS-capable.

## Why This Works in Kericho

- **Boda boda density**: Kericho town has hundreds of boda boda riders who already know every route
- **Low data reliance**: Agents can receive delivery requests via SMS if smartphone isn't available
- **Hyperlocal**: Most deliveries are within 2-5 km radius — perfect for motorbike delivery
- **Community trust**: Neighbours delivering to neighbours, not anonymous couriers
- **Side-hustle economy**: KES 50-150 per delivery is meaningful supplemental income

## The Flow

```
┌────────────┐     ┌──────────────┐     ┌─────────────┐
│  Customer  │     │  Omix Store  │     │  Agent      │
│  orders    │ ──► │  matches to  │ ──► │  notified   │
│  delivery  │     │  nearest     │     │  via SMS/   │
│            │     │  agent       │     │  app        │
└────────────┘     └──────┬───────┘     └──────┬──────┘
                          │                     │
                          ▼                     ▼
                   ┌──────────────┐     ┌─────────────┐
                   │  Agent       │     │  Customer   │
                   │  picks up    │ ──► │  receives   │
                   │  from hub    │     │  + pays     │
                   │  or store    │     │  agent/cash │
                   └──────────────┘     └─────────────┘
```

## Entity Model

### Agents Table

```sql
create table delivery_agents (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  phone text not null unique,
  alternate_phone text,
  id_number text, -- Kenyan ID
  kra_pin text, -- for payouts > KES 5,000
  vehicle_type text not null check (vehicle_type in ('boda_boda', 'bicycle', 'foot', 'car')),
  vehicle_reg text, -- e.g., KMEB 123X
  coverage_areas text[], -- list of sub-locations they serve
  is_active boolean default true,
  is_verified boolean default false, -- background check completed
  rating decimal(2,1) default 5.0,
  total_deliveries int default 0,
  current_location text, -- last known area
  last_seen_at timestamptz,
  bank_name text,
  bank_account text,
  mpesa_number text,
  created_at timestamptz default now()
);
```

### Delivery Tasks Table

```sql
create table delivery_tasks (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id),
  agent_id uuid references delivery_agents(id),
  status text not null default 'pending' check (status in (
    'pending', 'accepted', 'at_pickup', 'picked_up', 
    'in_transit', 'delivered', 'failed', 'cancelled'
  )),
  fee_kes int not null, -- agent's delivery fee
  pickup_address text,
  dropoff_address text,
  dropoff_instructions text,
  customer_phone text,
  distance_km decimal(4,2),
  picked_up_at timestamptz,
  delivered_at timestamptz,
  customer_rating decimal(1,0), -- 1-5
  agent_rating decimal(1,0),
  created_at timestamptz default now()
);
```

## Agent Onboarding

### 1. Registration (via WhatsApp / SMS / Web)
```
Agent texts: JOIN OMIX <Full Name> <ID Number>
Omix replies: Welcome to Omix Delivery Network!
  Provide your:
  1. Vehicle type (boda_boda/bicycle/foot/car)
  2. Vehicle reg (if applicable)
  3. Coverage area (Kericho Town / Kapsoit / etc.)
  4. M-Pesa number
```

### 2. Verification (1-2 days)
- ID check (manual or via API)
- Physical meeting at Omix hub for uniform/vest collection (optional)
- Brief training: pickup procedure, customer interaction, returns handling

### 3. Go Live
Agent appears in the nearest-agent matching pool.

## Matching Algorithm

When a delivery is ready:

```
1. Get the delivery's origin (hub + radius) and destination
2. Query active, verified agents within 2 km of pickup
3. Filter by coverage_areas matching destination
4. Sort by: rating DESC, total_deliveries ASC (spread the wealth)
5. Select top 3 candidates
6. Notify candidates via SMS/WhatsApp (first-come-first-served)
7. If no accept in 3 min → expand radius + notify next batch
8. If no accept in 10 min → fall back to external courier/retry later
```

### Agent Assignment Priority
1. Currently idle agents closest to pickup point
2. Agents with highest rating (>4.5 preferred)
3. Agents with fewer deliveries that day (load balancing)
4. Agents whose coverage area includes dropoff location

## Economics

| Parameter | Value |
|-----------|-------|
| Delivery fee (customer pays) | KES 150-350 (distance-based) |
| Matatu fare equivalent | KES 50-100 |
| Agent earns | KES 100-250 per delivery |
| Omix commission | KES 30-50 per delivery |
| Average deliveries/day/agent | 5-12 |
| Agent monthly income (avg) | KES 15,000-45,000 |

**Distance-based fee structure:**
| Distance | Customer Fee | Agent Earns | Omix Cut |
|----------|-------------|-------------|----------|
| 0-1 km | KES 100 | KES 80 | KES 20 |
| 1-3 km | KES 200 | KES 150 | KES 50 |
| 3-5 km | KES 300 | KES 220 | KES 80 |
| 5-8 km | KES 400 | KES 300 | KES 100 |
| 8-10 km | KES 500 | KES 370 | KES 130 |

## Agent Mobile Experience

### Feature Phone (SMS)
```
Agent receives: "Deliver order OMX4821 from Omix Hub
  to 123 Kapsoit Rd, Kericho. Fee: KES 150.
  Reply: ACCEPT or DECLINE"

Agent accepts: "ACCEPT"

System replies: "Pickup at Omix Hub before 3 PM.
  Customer: 07XX-XXX-XXX. 
  Mark delivered: text DELIVERED OMX4821"

Agent delivers: "DELIVERED OMX4821"

System replies: "KES 150 added to your balance.
  Current balance: KES 2,450. 
  Withdraw: text WITHDRAW to receive via M-Pesa"
```

### Smartphone (Web App)
- Simple PWA interface (no app store required)
- Shows available deliveries on a simple map/list
- One-tap accept, navigation via Google Maps
- Photo proof-of-delivery
- In-app earnings dashboard with M-Pesa withdrawal

## Payment & Settlement

### Agent Payout Flow
1. Delivery completed → fee added to agent's `available_balance`
2. Agent requests withdrawal: text `WITHDRAW` or button in app
3. B2C M-Pesa API sends funds to agent's registered number
4. Min withdrawal: KES 200 (to reduce transaction costs)
5. Daily settlement: Net position calculated at midnight

### Customer Payment at Doorstep (COD)
- Customer pays agent in cash **or** M-Pesa to agent's till number
- Agent confirms payment in app/SMS: `PAID OMX4821 CASH`
- Cash collected by agent is netted against their delivery payouts

## Hub Network

Central collection points where agents pick up pre-packed orders:

| Hub | Location | Operating Hours | Areas Served |
|-----|----------|----------------|--------------|
| Omix Hub Kericho | Kericho Town, next to Total | 7 AM - 8 PM | Town, Kapsoit, Sosiot |
| Litein Collection Point | Litein Market | 8 AM - 6 PM | Litein, Chepseon |
| Bomet Hub | Bomet Town Centre | 8 AM - 6 PM | Bomet, Sotik |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Theft or lost package | Agent bond (KES 500 deducted weekly until KES 2,000 saved) |
| Failed delivery | Photo proof required; 3 strikes → deactivation |
| Customer disputes | COD means customer inspects before paying |
| Agent ghosting (accepts but never picks up) | Auto-cancel after 15 min; penalty = 24h suspension |
| Cash handling errors | Cash + M-Pesa payments logged in app; daily reconciliation |
| Accident / injury | Agent's own insurance (boda boda SACCOs usually cover) |

## Timeline & Phases

| Phase | What | Cost | Timeline |
|-------|------|------|----------|
| 1 | Recruit 20 agents in Kericho Town | KES 0 (organic via WhatsApp) | 2 weeks |
| 2 | SMS dispatch system + hub operations | KES 50,000 (SMS + hub setup) | 2 weeks |
| 3 | Web app for agents | Already built as extension of Omix | 1 week |
| 4 | Expand to Litein, Kapsoit, Sosiot | KES 30,000 | 2 weeks |
| 5 | M-Pesa B2C automated payouts | KES 5,000 (API setup fee) | 1 week |
| 6 | Full rollout Kericho region | KES 100,000 | 1 month |
