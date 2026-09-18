## Stor1 Marketplace Journey, Listings, Checkout & Hosting Migration

### Scope
Audit and rebuild the customer-facing marketplace journey and infrastructure around:

- Listing/discovery pages
- Product detail pages
- Seller product-listing criteria and publishing
- Checkout/payment flow
- New-user onboarding
- Vercel frontend
- Turso/libSQL database evaluation/migration
- Vercel Functions vs Cloudflare Workers backend evaluation

The full implementation specification and wireframes are in `.hermes/plans/marketplace-journey-and-hosting-migration.md`.

### Core journey

```text
Discovery → Product → Cart → Delivery/Pickup → Customer → Payment → Confirmation
```

### Required wireframe direction

Desktop listing:

```text
┌─────────────────────────────────────────────────────┐
│ OMIX        Search products...        Cart  Account │
├─────────────────────────────────────────────────────┤
│ Category / Subcategory                    Sort ▾    │
│                                                     │
│ Filters     ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│             │ Product │ │ Product │ │ Product │    │
│             │ KSh ... │ │ KSh ... │ │ KSh ... │    │
│             └─────────┘ └─────────┘ └─────────┘    │
└─────────────────────────────────────────────────────┘
```

Mobile checkout:

```text
┌─────────────────────────────┐
│ Checkout              2/4   │
├─────────────────────────────┤
│ ITEMS                       │
│ Product ×2        KSh ...   │
│                             │
│ DELIVERY                    │
│ ● Delivery  ○ Pickup        │
│ [ Location / Area       ]   │
│                             │
│ PAYMENT                     │
│ [ M-Pesa ]                  │
│                             │
│ Total              KSh ...  │
│ [ Continue → ]              │
└─────────────────────────────┘
```

### Product listing criteria

Every seller listing must validate:

- Product identity/category
- Price and stock
- Images/media
- Description/specifications
- Variants where applicable
- Fulfillment/delivery information
- Required category attributes
- Restricted/prohibited-product checks
- Seller ownership/authorization
- Duplicate/quality checks where possible

Required lifecycle:

`Draft → Validation → Pending review → Approved → Published → Paused/Out of stock/Suspended`

Server-side validation must enforce state transitions.

### Responsive requirements

Mobile:
- 320/360/390/430px tests
- 16px page padding
- >=44px touch targets; prefer 48px primary controls
- Bottom sheets for filters
- Full-screen/detail flows for complex actions
- No horizontal overflow
- Skeletons reserve exact content dimensions
- Respect safe areas and reduced motion

Desktop:
- 1024/1280/1440/1920px tests
- 12-column layout where appropriate
- 1440px content max-width
- 24–32px page padding
- Adaptive 4/3/2-column product grids
- Sticky filters/headers where useful

### Checkout integrity

- Guest checkout must remain possible unless a verified business rule requires auth.
- Server validates price, stock, promotions, delivery and seller state.
- Payment success comes from verified gateway/webhook state, not the browser callback alone.
- Order/payment mutations are idempotent.
- Payment states must include pending, paid, failed, cancelled and refund/reversal states.
- Preserve cart/order state across interrupted payment.

### Hosting migration

Current repository uses React/Vite + Express + Supabase. `server.js` currently contains payment, webhook, maintenance and push-notification responsibilities. Inventory all of these before migration.

Target architecture to evaluate:

```text
Vercel React/Vite PWA
        ↓
Vercel Functions OR Cloudflare Workers
        ↓
Turso/libSQL
```

Do not blindly convert Supabase/Postgres to Turso. Audit tables, constraints, indexes, RPCs, RLS, Auth, Storage and Realtime first.

Vercel supports Express backends, while Cloudflare Workers has broadening Node.js compatibility but still requires dependency-by-dependency testing. citehttps://vercel.com/kb/expresshttps://developers.cloudflare.com/workers/runtime-apis/nodejs/

### Acceptance criteria

- [ ] Discovery/listing pages rebuilt responsively
- [ ] Product detail rebuilt responsively
- [ ] Seller listing workflow has enforceable validation/state model
- [ ] Checkout audited and rebuilt without trusting client payment state
- [ ] New-user and seller onboarding separated
- [ ] Supabase dependencies inventoried
- [ ] Turso migration feasibility tested
- [ ] Vercel backend evaluated
- [ ] Cloudflare Workers backend evaluated
- [ ] Rollback/reconciliation plan exists before financial migration
- [ ] Critical flows have automated tests
- [ ] Low-end mobile performance tested
