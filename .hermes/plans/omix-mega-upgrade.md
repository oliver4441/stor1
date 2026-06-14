# Omix Mega Upgrade — Implementation Plan

> **17 features** organized into 5 phases with parallel execution

**Goal:** Add 17 new features to the Omix marketplace in one deploy

**Architecture:** React SPA + Supabase backend. Each feature is independently built and verified before merging. Use subagents for parallel work on independent features.

**Execution:** Each feature gets its own branch, is built and verified, then merged.

---

## Phase 0: Infrastructure (parallel)

### Feature 1: Route-Based Code Splitting
- Wrap all routes in `React.lazy(() => import(...))` 
- Add `Suspense` with fallback
- **Files:** `src/App.jsx`, `src/main.jsx`
- **Time:** ~10 min

### Feature 2: Error Boundaries
- Create `<ErrorBoundary>` component wrapping each route
- Global fallback UI with retry button
- **Files:** `src/components/ErrorBoundary.jsx`, `src/App.jsx`
- **Time:** ~10 min

### Feature 3: Loading Skeletons
- Create reusable `<Skeleton>` component
- Create `<ProductCardSkeleton>`, `<ListingDetailSkeleton>`, `<CheckoutSkeleton>`
- Use Tailwind's `animate-pulse`
- **Files:** `src/components/Skeleton.jsx`
- **Time:** ~15 min

### Feature 4: Mobile Bottom Navigation
- Fixed bottom tab bar with 5 icons: Home, Search, Cart, Wishlist, Account
- Hidden on desktop (lg: hidden), shown on mobile
- Use `lucide-react` icons
- **Files:** `src/components/MobileBottomNav.jsx`, `src/App.jsx`
- **Time:** ~15 min

## Phase 1: Product Features (parallel)

### Feature 5: Product Reviews & Ratings
- **Schema:** `product_reviews` table (id, listing_id, user_id, rating, review, created_at)
- **Page:** Review section on `ListingDetails.jsx`
- **API:** `fetchReviews(listingId)`, `submitReview(listingId, rating, review)`
- **Files:** `src/utils/api.js`, `src/pages/ListingDetails.jsx`
- **Time:** ~20 min

### Feature 6: Wishlist/Favorites
- **Schema:** `wishlist` table (id, user_id, listing_id, created_at)
- **Context:** WishlistContext or extend CartContext pattern
- **UI:** Heart button on ProductCard + ListingDetails
- **Page:** `/wishlist` page
- **Files:** `src/context/WishlistContext.jsx`, `src/pages/Wishlist.jsx`, `src/components/ProductCard.jsx`, `src/pages/ListingDetails.jsx`
- **Time:** ~25 min

### Feature 7: Image Zoom / Lightbox
- Click product image → fullscreen overlay
- Pinch/pinch with mouse wheel or touch
- Swipe between images
- **Files:** `src/components/ImageLightbox.jsx`, `src/components/ImageGallery.jsx`
- **Time:** ~15 min

## Phase 2: Search & Browse (sequential)

### Feature 8: Full-Text Search
- Replace ILIKE with Supabase `fts` via `to_tsvector`/`to_tsquery`
- Add `search_vector` column to listings
- Create Supabase function or computed column
- **Files:** `src/utils/api.js`, `src/components/SearchBar.jsx`, `src/pages/Home.jsx`
- **Time:** ~20 min

### Feature 9: Lazy Loading with "Load More"
- Add pagination to API: `page`, `limit` params
- "Load More" button at bottom of product grid
- Replace current single-fetch with paginated fetches
- **Files:** `src/utils/api.js`, `src/pages/Home.jsx`, `src/pages/UserDashboard.jsx`
- **Time:** ~20 min

## Phase 3: Account Features (sequential)

### Feature 10: Saved Addresses
- **Schema:** `saved_addresses` table (id, user_id, label, area, landmark, phone, is_default)
- **Page:** Manage addresses in UserDashboard
- **Checkout:** Pre-fill from saved addresses dropdown
- **Files:** `src/utils/api.js`, `src/pages/UserDashboard.jsx`, `src/pages/Checkout.jsx`
- **Time:** ~25 min

### Feature 11: Flash Sales & Countdowns
- **Schema:** Extend `promo_codes` with `type: 'flash_sale'`, `product_id`, start/end times
- **UI:** Countdown timer on product cards + listing detail
- **Logic:** Discount auto-applied during sale period
- **Files:** `src/components/CountdownTimer.jsx`, `src/components/ProductCard.jsx`, `src/pages/ListingDetails.jsx`
- **Time:** ~20 min

## Phase 4: Growth Features (parallel)

### Feature 12: Referral System
- **Schema:** `referrals` table, add `referred_by` to profiles
- **Flow:** Share referral link → friend signs up + orders → both get discount
- **Page:** Referral section in UserDashboard
- **Files:** `src/utils/api.js`, `src/pages/UserDashboard.jsx`
- **Time:** ~25 min

### Feature 13: Loyalty Points
- **Schema:** Add `loyalty_points` to profiles, `points_transactions` table
- **Logic:** Earn 1 point per KES 100 spent. Redeem at checkout
- **UI:** Points balance in account, toggle at checkout
- **Files:** `src/utils/api.js`, `src/pages/Checkout.jsx`, `src/pages/UserDashboard.jsx`
- **Time:** ~25 min

## Phase 5: Quality (parallel)

### Feature 14: Supabase RLS Audit
- Write RLS policies for all tables
- `listings`: sellers manage own, everyone reads active
- `orders`: users see own, admins see all
- `profiles`: users see own, admins see all
- **Files:** SQL migration in `supabase/migrations/`
- **Time:** ~20 min

### Feature 15: Automated Tests (Cypress/Playwright)
- Set up Playwright
- Write tests for: login, view product, add to cart, checkout flow
- **Files:** `tests/` directory
- **Time:** ~30 min

### Feature 16: CI/CD Pipeline
- GitHub Action: test → lint → build → deploy to Render
- Trigger on push to main
- **Files:** `.github/workflows/deploy.yml`
- **Time:** ~15 min

---

## Execution Order

```
Phase 0 ──────────────────────────┐
  ├─ Code splitting               │
  ├─ Error boundaries             │  (all parallel)
  ├─ Loading skeletons            │
  └─ Mobile bottom nav            │
                                  │
Phase 1 ──────────────────────────┤
  ├─ Reviews & ratings            │  (all parallel)
  ├─ Wishlist/Favorites           │
  └─ Image zoom / lightbox        │
                                  │
Phase 2 ──────────────────────────┤
  ├─ Full-text search             │  (sequential - search then load more)
  └─ Lazy loading / Load more     │
                                  │
Phase 3 ──────────────────────────┤
  ├─ Saved addresses              │  (both touch checkout)
  └─ Flash sales / countdowns     │
                                  │
Phase 4 ──────────────────────────┤
  ├─ Referral system              │  (parallel)
  └─ Loyalty points               │
                                  │
Phase 5 ──────────────────────────┤
  ├─ RLS audit                    │  (all parallel)
  ├─ Automated tests              │
  └─ CI/CD pipeline               │
                                  │
Delivery tracking ────────────────┘  (plan only, explain after)
```

Each phase builds and is verified before moving to the next.
