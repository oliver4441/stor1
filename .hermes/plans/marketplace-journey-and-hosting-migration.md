# Stor1 Marketplace Journey + Hosting Migration Specification

## Scope

Audit and rebuild the customer-facing marketplace journey around four connected areas:

1. Listing/product discovery pages.
2. Seller product-listing criteria and publishing workflow.
3. Checkout and payment flow.
4. New-user onboarding.
5. Infrastructure migration: Vercel frontend + Turso database + Vercel Functions or Cloudflare Workers backend.

This is an incremental modernization. Preserve working Stor1 business rules, authentication, payments, orders, affiliates, seller/admin functionality and existing data until the audit proves a replacement is safe.

## Current repository observations

The current checkout is already a substantial flow: cart, customer details, delivery/pickup, M-Pesa, wallet, gift cards, loyalty points, promo codes, saved payment methods and order creation are present in `src/pages/Checkout.jsx`. However, it also accesses Supabase directly from the client for promo-code validation and authentication-related data, while payment/order operations use API functions. Treat this as a security and architecture audit target rather than simply restyling it.

The repository is currently a React 18 + Vite application with Express and Supabase dependencies. `server.js` currently serves the built frontend and contains Paystack initialization/verification/webhook endpoints, maintenance handling and push-notification infrastructure. Do not migrate infrastructure until all server responsibilities are inventoried.

## Part A — Listing / discovery experience

Rebuild listing pages around a fast marketplace discovery model.

### Listing page structure

```text
┌─────────────────────────────────────────────────────┐
│ OMIX        Search products...        Cart  Account │
├─────────────────────────────────────────────────────┤
│ Home / Category / Subcategory                       │
│                                                     │
│ Electronics                              Sort ▾     │
│ 284 products                                        │
│                                                     │
│ Filters     ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│             │ image   │ │ image   │ │ image   │    │
│             │ Product │ │ Product │ │ Product │    │
│             │ KSh ... │ │ KSh ... │ │ KSh ... │    │
│             │ ★ 4.6   │ │ ★ 4.8   │ │ ★ 4.4   │    │
│             └─────────┘ └─────────┘ └─────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Desktop:
- Content max-width: 1440px.
- 24–32px page padding.
- 12-column grid.
- Product cards should be 4-up at ~1200px+, 3-up around 900–1199px, 2-up around tablet widths.
- Filters can occupy 240–280px on desktop.
- Search/filter/sort controls remain sticky where useful.
- Avoid loading every product into the browser.
- Use server-side pagination or cursor pagination.
- Images must use fixed aspect-ratio containers to eliminate layout shift.

Mobile:
- 16px horizontal padding.
- 2-column product grid where cards remain usable; fall back to 1-column only when required by content.
- Product card image aspect ratio around 1:1.
- Card tap target should be the entire card except explicit controls.
- Filter and sort become bottom sheets.
- Search remains accessible without forcing navigation away from results.
- Preserve scroll position when returning from product details.
- Use skeleton cards with identical dimensions to real cards.

### Product card specification

Every card should have:
- Image.
- Product title limited to 2–3 lines.
- Current price.
- Previous price/discount only when meaningful.
- Seller/store identity where marketplace context matters.
- Availability/stock signal.
- Rating/review count where data exists.
- Delivery/pickup signal when available.
- Wishlist/favorite action if supported.
- Clear disabled state for unavailable products.

Do not fabricate ratings, stock, discounts or seller badges. UI must reflect actual backend state.

## Part B — Product detail page

Target structure:

```text
┌─────────────────────────────────────────────────────┐
│ Gallery                 Product information         │
│ ┌─────────────────┐     Brand / Seller              │
│ │                 │     Product title               │
│ │     IMAGE       │     ★ rating                    │
│ │                 │     KSh 12,500                  │
│ └─────────────────┘     In stock                    │
│ thumbnails             Delivery estimate            │
│                         Quantity  − 1 +             │
│                         [ Add to cart ]              │
│                         [ Buy now ]                  │
├─────────────────────────────────────────────────────┤
│ Description | Specifications | Reviews | Seller     │
└─────────────────────────────────────────────────────┘
```

Mobile should move gallery above purchase controls and keep Add to Cart / Buy Now accessible near the bottom of the viewport. Avoid oversized galleries that push purchase actions excessively far down the page.

Product detail must clearly distinguish:
- Product data.
- Seller data.
- Inventory state.
- Price.
- Delivery estimate.
- Promotions.
- Trust/review information.

## Part C — Product listing criteria

The seller listing workflow should prevent incomplete or misleading marketplace listings.

Minimum required criteria:

### Identity
- Product name.
- Category.
- Subcategory where applicable.
- SKU/internal identifier where required.
- Brand/manufacturer if applicable.

### Commercial
- Selling price.
- Optional compare-at price only when supported by real pricing history/rules.
- Cost/base price where required internally.
- Quantity/stock.
- Minimum order quantity if applicable.
- Seller fulfillment method.

### Media
- At least 1 usable product image.
- Prefer 3–5 images for normal physical products.
- Validate image dimensions/file type/size.
- No broken image URLs.
- First image becomes the primary thumbnail.

### Description
- Concise summary.
- Detailed description.
- Specifications/attributes appropriate to category.
- Variants where applicable.
- Dimensions/weight when relevant to delivery.

### Fulfillment
- Delivery availability.
- Pickup availability where applicable.
- Processing/handling time.
- Stock status.

### Compliance / marketplace quality
- Prohibited/restricted product checks.
- Duplicate-product detection where possible.
- Price sanity checks.
- Required category attributes.
- Seller ownership/authorization.
- Moderation status.

### Listing states

```text
Draft
  ↓
Validation
  ↓
Pending review ──→ Rejected → Edit → Review
  ↓
Approved
  ↓
Published
  ↓
Paused / Out of stock / Suspended
```

Never let the frontend alone determine that a listing is approved or published. Server-side validation and authorization must enforce the state transitions.

## Part D — Seller listing UI

Use a guided form rather than one giant form.

```text
STEP 1  Basics
STEP 2  Media
STEP 3  Pricing & Stock
STEP 4  Delivery
STEP 5  Review & Publish
```

Desktop can use a two-column editor with live preview. Mobile should use one section per screen with autosave/draft persistence.

Target mobile controls:
- Inputs: minimum 44px height; prefer 48px.
- Buttons: minimum 44x44px; primary actions 48px+.
- Sticky bottom action bar for Save Draft / Continue / Publish.
- Autosave indicator.
- Unsaved-changes protection.

## Part E — Checkout redesign

The existing checkout should be audited before replacement. Current functionality includes cart management, customer details, delivery/pickup, M-Pesa, wallet payment, promo codes, gift cards, loyalty points and saved payment methods.

Target checkout:

```text
CART
 ↓
DELIVERY / PICKUP
 ↓
CUSTOMER DETAILS
 ↓
PAYMENT
 ↓
REVIEW
 ↓
ORDER CONFIRMED
```

For mobile, keep the number of visible decisions low and show a persistent order-total summary.

### Checkout requirements

- Guest checkout remains possible unless a business rule explicitly requires authentication.
- New users should not be forced through a long registration form before purchase.
- Account creation can happen after a successful guest order or through an optional fast account path.
- Validate stock, prices, promotions, delivery fees and seller availability server-side before creating/confirming an order.
- Payment success must never be inferred from client-side callback state alone.
- Payment gateway webhook/verification is authoritative.
- Order creation and payment confirmation must be idempotent.
- Prevent double submission.
- Preserve cart/order state if payment is interrupted.
- Clearly distinguish `payment pending`, `paid`, `failed`, `cancelled`, `refunded` and `partially refunded`.
- M-Pesa/STK Push should have an explicit pending state with retry/status polling or webhook-driven refresh.
- Never expose secret payment credentials to the frontend.

### Checkout mobile wireframe

```text
┌─────────────────────────────┐
│ Checkout              2/4   │
├─────────────────────────────┤
│ ITEMS                       │
│ ┌─────────────────────────┐ │
│ │ Product ×2    KSh 4,000 │ │
│ └─────────────────────────┘ │
│                             │
│ DELIVERY                    │
│ ● Delivery   ○ Pickup       │
│                             │
│ Location                    │
│ [ Nairobi ▼ ]               │
│ [ Area / landmark       ]   │
│                             │
│ PAYMENT                     │
│ [ M-Pesa ]                  │
│                             │
│ ─────────────────────────── │
│ Total              KSh ...  │
│                             │
│ [ Continue → ]              │
└─────────────────────────────┘
```

Do not hide critical fees until the final screen. Show subtotal, delivery, discounts and final total clearly before payment authorization.

## Part F — New-user onboarding

Separate customer onboarding from seller onboarding.

### Customer

Recommended path:

```text
Landing / Product
      ↓
Browse
      ↓
Cart
      ↓
Guest checkout OR quick sign-in
      ↓
Order confirmation
      ↓
Optional account completion
```

Quick account creation should request only what is necessary. Do not make users fill a marketplace profile before they can understand the product or checkout.

After signup, onboarding should be contextual:
- Complete profile.
- Save delivery address.
- Enable notifications.
- View order.
- Explore marketplace.

### Seller

Seller onboarding should be a separate guided workflow:

```text
Create account
 ↓
Seller application
 ↓
Business/store details
 ↓
Payout details
 ↓
Verification
 ↓
Seller dashboard
 ↓
Create first listing
 ↓
Submit for review
```

The UI must clearly communicate what is pending and what blocks activation.

## Part G — Hosting/database migration

Current repository is React/Vite + Express + Supabase. The current Express server also owns payment endpoints, webhook processing, maintenance behavior and push notification setup. Do not delete `server.js` until these responsibilities are mapped and migrated.

### Target architecture

Preferred target to evaluate:

```text
                         ┌─────────────────────┐
                         │       Vercel        │
                         │  React/Vite PWA     │
                         └──────────┬──────────┘
                                    │
                             HTTPS / API
                                    │
                         ┌──────────▼──────────┐
                         │ Backend API         │
                         │ Vercel Functions    │
                         │ OR Cloudflare       │
                         │ Workers             │
                         └──────────┬──────────┘
                                    │
                              libSQL / HTTP
                                    │
                         ┌──────────▼──────────┐
                         │       Turso         │
                         │     Database        │
                         └─────────────────────┘
```

Vercel currently supports Express deployments and Node.js backend functions, so the existing Express API can be evaluated for a Vercel migration without assuming an immediate framework rewrite. citeturn1search0turn1search1

Cloudflare Workers should be evaluated separately for latency/edge API routes, but compatibility must be tested against all current Node-oriented dependencies. Workers have substantially improved Node.js compatibility in 2026, but some Node APIs/packages remain partial or stubbed, so do not assume the existing Express server can be copied unchanged. citeturn0search0turn0search4

Turso is SQLite/libSQL-based and supports transactions; current Turso Cloud also has an early preview for concurrent writes. This makes it a candidate for Stor1, but the existing Supabase/Postgres schema, RLS policies, auth, storage and realtime behavior must be inventoried before migration. citeturn1search11turn1search21

### Migration rule

Do not perform a blind Supabase → Turso conversion.

First classify every Supabase capability:

```text
Database tables       → Turso/libSQL
SQL functions/RPC     → application/API or SQLite-compatible SQL
RLS policies          → server-side authorization
Supabase Auth         → replacement auth layer / migration strategy
Supabase Storage      → object storage
Realtime              → WebSocket/SSE/event mechanism if still required
Edge Functions        → Vercel Functions / Workers
Secrets               → deployment secret manager
```

Preserve IDs and financial/order history where possible.

### Database migration requirements

Before migration:
- Export schema.
- Export representative production-safe data snapshot.
- Inventory foreign keys and constraints.
- Inventory indexes.
- Inventory triggers.
- Inventory RPC/functions.
- Inventory RLS policies.
- Inventory storage buckets.
- Inventory realtime subscriptions.
- Inventory auth dependencies.
- Identify Postgres-only SQL that requires redesign.
- Benchmark expected marketplace read/write patterns.

Create a migration verification suite comparing old and new systems for:
- Product retrieval.
- Seller retrieval.
- Cart/order creation.
- Inventory decrement.
- Payment/order state transition.
- Promo validation.
- Affiliate commission allocation.
- Seller balance calculation.
- Ledger writes.
- Refund/reversal.

Financial operations must use atomic transactions where multiple dependent writes must succeed together. Turso/libSQL supports transactional/batch operations; implementation must verify the exact transaction semantics used for the marketplace ledger. citeturn1search24

## Backend choice evaluation

Evaluate both options before committing:

### Option A — Vercel Functions

Advantages to validate:
- Minimal infrastructure change from current Node/Express code.
- Express is supported on Vercel.
- Good fit for payment APIs, webhooks and ordinary marketplace CRUD.
- Frontend/backend can share Vercel deployment workflow.
- Current Vercel Node runtime supports modern Node versions.

Risks to test:
- Existing long-lived Express assumptions.
- Webhook handling.
- Background work.
- Push notifications.
- PDF generation.
- Image processing.
- Runtime/package compatibility.

### Option B — Cloudflare Workers

Advantages to validate:
- Edge deployment.
- Natural fit for lightweight API endpoints and globally distributed requests.
- Strong integration with Cloudflare ecosystem.
- Current Workers Node compatibility is much broader than earlier Workers versions.

Risks to test:
- Express migration/adaptation.
- `fs`, native modules and Node-specific libraries.
- PDF/image generation dependencies.
- Push/webhook libraries.
- Any code relying on a traditional persistent Node process.

Do not select the backend solely on theoretical latency. Benchmark real Stor1 operations.

## Performance targets

### Mobile
- Test 320, 360, 390 and 430px widths.
- Touch targets >=44px.
- Primary controls preferably >=48px.
- Avoid horizontal overflow.
- Product image containers must reserve dimensions.
- Avoid unnecessary JavaScript on listing pages.
- Lazy-load below-the-fold images.
- Prefer responsive image sizes rather than shipping desktop assets to phones.
- Keep scroll interactions smooth on low-end Android hardware.
- Respect `prefers-reduced-motion`.

### Desktop
- Test 1024, 1280, 1440 and 1920px widths.
- Content max-width around 1440px.
- Use 12-column layouts where appropriate.
- Product grid should adapt without excessive whitespace.
- Filters should collapse into a drawer below desktop breakpoint.

### Data performance
- Server-side pagination/filtering/sorting for large collections.
- Avoid fetching complete product/order tables merely to calculate UI totals.
- Cache safe catalog reads.
- Revalidate inventory and pricing at checkout.
- Keep checkout writes idempotent.

## Security requirements

- No service-role/database-admin credentials in browser code.
- No payment secret keys in frontend environment variables.
- Server-side authorization for seller/admin mutations.
- Server-side price, stock and discount validation.
- Signed/verified payment webhooks.
- Idempotency keys for order/payment mutations.
- Rate limiting on authentication, checkout and payment endpoints.
- Audit financial state transitions.
- Sanitize seller-provided product content.
- Validate uploaded images/files.

## Acceptance criteria

- [ ] Listing pages have a coherent responsive discovery UI.
- [ ] Product cards show only authoritative product/seller/inventory data.
- [ ] Product detail supports clear purchase decisions on mobile and desktop.
- [ ] Seller listing creation has explicit validation criteria and state transitions.
- [ ] Customer checkout supports guest and authenticated journeys without unnecessary friction.
- [ ] Payment state is server-authoritative and idempotent.
- [ ] New-user onboarding is contextual and separated from seller onboarding.
- [ ] Current checkout capabilities are audited before removal/replacement.
- [ ] Supabase dependencies are completely inventoried before migration.
- [ ] Turso schema/data migration is tested against representative data.
- [ ] Vercel backend and Cloudflare Workers backend are evaluated against actual Stor1 dependencies before selecting one.
- [ ] Frontend is deployed on Vercel successfully.
- [ ] No production financial/order workflow is migrated without rollback/reconciliation capability.
- [ ] Mobile widths 320–430px have no broken layouts.
- [ ] Desktop widths 1024–1920px adapt without unusable whitespace or overflow.
- [ ] Critical flows have automated tests.

## Definition of done

Stor1 should have a fast, coherent customer journey from discovery → product detail → cart → checkout → payment → order confirmation, with a low-friction first-use experience and a separate, validated seller publishing workflow. The infrastructure should be portable enough to run the frontend on Vercel and the API on either Vercel or Cloudflare Workers, with Turso considered only after a schema/security/transaction audit proves it can safely replace the current Supabase/Postgres responsibilities.
