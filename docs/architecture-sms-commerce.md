# SMS Commerce Architecture

## What It Is

SMS Commerce lets users browse, search, and order products from Omix Store using only a basic feature phone via SMS. No smartphone, data plan, or app required. This opens the marketplace to the ~60% of Kenyans who primarily use feature phones.

## How It Works

```
┌──────────────┐      ┌───────────────┐      ┌─────────────┐
│  Customer     │      │  SMS Gateway   │      │  Omix API   │
│  (Feature     │ ──►  │  (Africa's     │ ──►  │  Server     │
│   Phone)      │ ◄──  │   Talking,     │ ◄──  │             │
│               │      │   Twilio etc.) │      │             │
└──────────────┘      └───────────────┘      └──────┬──────┘
                                                     │
                                           ┌─────────▼──────────┐
                                           │   Supabase         │
                                           │   (Products,       │
                                           │    Orders, Users)  │
                                           └────────────────────┘
```

## User Journey — Step by Step

### 1. First Contact (Discovery)
User texts `HI OMIX` to a shortcode (e.g., `22472`):

```
User:    HI OMIX
Omix:   Welcome to Omix Store! Shop by category:
        Reply with number:
        1. Electronics
        2. Fashion
        3. Home & Kitchen
        4. Phones & Tablets
        5. Search products
        Or text SEARCH <item> to find products.
```

### 2. Browse Products
```
User:    1
Omix:   Electronics:
        1. Bluetooth Speaker - KES 1,500
        2. Power Bank 20K mAh - KES 2,200
        3. USB-C Cable 2m - KES 350
        Reply ITEM <number> for details
        Or BACK for menu
```

### 3. Product Details
```
User:    ITEM 2
Omix:   Power Bank 20K mAh
        Price: KES 2,200
        Brand: Oraimo
        In Stock: Yes
        Rating: 4.5/5 (23 reviews)
        To order, reply: BUY 2 qty:1
        Or text BACK
```

### 4. Placing an Order
```
User:    BUY 2 qty:1
Omix:   Confirm order:
        1x Power Bank 20K mAh
        Total: KES 2,200
        Delivery to Kericho Town: KES 100
        Grand Total: KES 2,300
        Payment: M-Pesa Paybill 247247
        Account: OMIX<your-order-id>
        Reply YES to confirm
```

### 5. Confirmation & Payment
```
User:    YES
Omix:   ✅ Order #OMX-4821 confirmed!
        Pay via M-Pesa:
        Paybill: 247247
        Account: OMX4821
        Amount: KES 2,300
        STK push sent to 07XXXXXXXX
        Reply STATUS <order-id> to check order
```

### 6. Order Status Updates
```
User:    STATUS OMX4821
Omix:   Order #OMX-4821
        Status: SHIPPED
        Rider: John K. (07XX-XXX-XXX)
        Est. delivery: Tomorrow 2-4 PM
        Track live: https://omix.store/t/OMX4821
```

## Technical Architecture

### Backend Components

#### 1. SMS Gateway Integration
- **Provider**: Africa's Talking (best Kenyan coverage, supports Safaricom/Airtel/Telkom)
- **Protocol**: HTTP REST API (send/receive SMS)
- **Incoming**: Webhook endpoint `/api/sms/incoming` receives messages
- **Outgoing**: HTTP POST to AT API for replies
- **Cost**: ~KES 0.30-0.50 per SMS (user pays standard SMS rates to send)

#### 2. Session State Machine
Each user has an active SMS session stored in a `sms_sessions` table:

```sql
create table sms_sessions (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  state text not null default 'menu',
  context jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

States: `menu` → `browsing` → `item_detail` → `confirm_order` → `payment` → `tracking`

#### 3. Message Router
Parses incoming SMS, routes by state + keyword:
- `SEARCH <term>` → search products → return top 5 results
- `BUY <id> qty:<n>` → add to cart → show confirmation
- `BACK` → previous menu state
- `YES` → confirm current action
- `STATUS <order>` → lookup + return tracking
- `HELP` → usage guide
- `STOP` → opt out (compliance: save to DNC list)

#### 4. Search Engine
SMS search needs to be fast and forgiving:
- Full-text search on title + description (Postgres `tsvector`)
- Fuzzy matching for misspellings (trigram similarity via `pg_trgm`)
- Returns top 5 results with minimal info (id, title, price)

#### 5. Order Pipeline
1. SMS received → parsed → product resolved
2. Order created in `orders` table (status: `pending_payment`, source: `sms`)
3. M-Pesa STK push sent to user's phone
4. Webhook confirms payment → order status → `confirmed`
5. SMS sent to user with confirmation + delivery ETA

### Security & Compliance

- **Opt-out**: Every SMS includes "Reply STOP to opt out" footer
- **Safaricom compliance**: Must register shortcode and get content licence
- **PIN/PII**: Full credit card numbers never stored; partial M-Pesa reference stored
- **Rate limiting**: Max 5 outbound SMS per user per hour
- **Cost control**: Daily budget cap (configurable, default KES 500/day)

## Infrastructure Needs

| Component | Requirement |
|-----------|------------|
| Shortcode | KES 30,000/year (application + renewal) |
| SMS Gateway | Africa's Talking (free tier: 10 SMS/day, paid from ~KES 0.30/SMS) |
| M-Pesa Paybill | Already set up for Omix Store |
| Webhook endpoint | HTTPS (existing Render deployment) |

## Revenue Model

- Average order via SMS: KES 1,500-3,000
- Conversion rate: estimated 15-25% (higher than web because SMS users are more intentional)
- Break-even: ~500 orders/month at KES 0.50/SMS cost

## Implementation Priority

| Phase | What | Timeline |
|-------|------|----------|
| 1 | Africa's Talking account + shortcode application | 2-4 weeks |
| 2 | SMS session state machine + keyword routing | 1 week |
| 3 | Search + browse + order flow | 1 week |
| 4 | M-Pesa payment integration (existing, extend) | 3 days |
| 5 | Order tracking SMS updates | 3 days |
| 6 | Testing with feature phones | 1 week |
| 7 | Launch + marketing | Ongoing |
