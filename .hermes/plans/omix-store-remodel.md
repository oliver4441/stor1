# Omix Store — Customer-Facing Visual Remodel

> **For Hermes:** Execute phase-by-phase. Build after each phase. Commit after each phase.

**Goal:** Re-skin all customer-facing pages of Omix Store from current green/gold dark theme to a dark navy/blue theme inspired by the Figma bike shopping app design.

**Design Source:** Figma file V17LHIS67npPb4nx9IpMwO (online bike shopping app)
**New Design Tokens:**
- Background: `#242C3B` (dark navy) with subtle blue gradient accents
- Surface/Cards: `#252D3C` to `#28303F` (lighter navy)
- Primary accent: `#007AFF` / `#3D9CEA` (bright blue)
- Text primary: White `#FAFAFA`
- Text secondary: `#4A5771` (muted blue-gray)
- Font: Poppins (was Inter)
- Style: Dark mode, clean, card-based, rounded corners, mobile-first

**Admin untouched** — all `/admin/*` routes keep existing styling.

---

## Phase 0: Design Tokens & Theme Infrastructure

### Task 0.1: Update designSystem.js tokens

**File:** `src/lib/designSystem.js`

Replace all color values with the new dark navy palette:

```js
export const colors = {
  primary: '#007AFF',
  primaryHover: '#0066CC',
  accent: '#007AFF',
  danger: '#dc2626',
  surface: '#242C3B',
  surfaceAlt: '#28303F',
  border: '#353F54',
  textPrimary: '#FAFAFA',
  textSecondary: '#4A5771',
  textMuted: '#4A5771',
  success: '#4ade80',
  priceColor: '#38B8EA',
};
```

Update font to Poppins:
```js
export const fonts = {
  sans: "'Poppins', system-ui, -apple-system, sans-serif",
  display: "'Poppins', system-ui, sans-serif",
};
```

Update button variants for blue accent:
```js
primary: 'bg-[#007AFF] text-white hover:bg-[#0066CC] transition-colors duration-150',
secondary: 'bg-[#28303F] text-white border border-[#353F54] hover:bg-[#323B4F] transition-colors duration-150',
```

### Task 0.2: Update tailwind.config.js

**File:** `tailwind.config.js`

Update primary colors to blue scheme (update the 50-900 scale):
- primary DEFAULT: `#007AFF`
- primary hover: `#0066CC`
- accent DEFAULT: `#007AFF`

### Task 0.3: Update index.css CSS custom properties

**File:** `src/index.css`

Replace all `:root` CSS variables from green/gold to navy/blue:

```
--seasonal-primary: #007AFF;
--seasonal-secondary: #0066CC;
--seasonal-accent: #007AFF;
--seasonal-hero-from: #1E2A3D;
--seasonal-hero-via: #242C3B;
--seasonal-hero-to: #2A3548;
--seasonal-hero-text: #ffffff;
--seasonal-hero-subtext: #8E9BB5;
--seasonal-hero-accent: #007AFF;
--seasonal-hero-overlay: rgba(0,122,255,0.2);
--seasonal-cta-bg: #007AFF;
--seasonal-cta-text: #ffffff;
--seasonal-cta-hover: #0066CC;
--seasonal-badge-bg: #007AFF;
--seasonal-badge-text: #ffffff;
--seasonal-nav-accent: #007AFF;
--seasonal-nav-accent-text: #ffffff;
--seasonal-nav-bg-from: #1E2A3D;
--seasonal-nav-bg-to: #242C3B;
--seasonal-surface: #242C3B;
--seasonal-surface-alt: #28303F;
--seasonal-border: #353F54;
--seasonal-muted: #4A5771;
--seasonal-text-primary: #FAFAFA;
--seasonal-text-secondary: #4A5771;
--seasonal-footer-bg: #1E2A3D;
--seasonal-footer-text: #4A5771;
--seasonal-footer-link: #007AFF;
--seasonal-card-bg: #28303F;
--seasonal-card-border: #353F54;
--seasonal-price-color: #38B8EA;
--seasonal-button-bg: #007AFF;
--seasonal-button-text: #ffffff;
```

Also update `body` background from `bg-zinc-950` to `bg-[#242C3B]` (or equivalent CSS var).

Update font-family on `html` from `Inter` to `Poppins`.

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: update design tokens to dark navy/blue theme"`

---

## Phase 1: Shared Components

### Task 1.1: Restyle Navbar

**File:** `src/components/Navbar.jsx`

Changes needed:
- Background from green gradient to dark navy (`bg-[#1E2A3D]` or use `--seasonal-nav-bg-from`)
- Feature links colored with blue accent instead of green/gold
- Search bar styling updated to navy surface
- Category dropdown/menu restyled with navy surfaces and blue accent
- Cart badge color to blue
- All hover states use blue instead of green
- Keep all functionality identical

**Pattern for buttons/links:** Replace `from-green-* to-green-*` with `from-blue-* to-blue-*`, replace gold accents (`#d4a017`) with blue (`#007AFF`).

### Task 1.2: Restyle Footer

**File:** `src/components/Footer.jsx`

Changes:
- Background uses `--seasonal-footer-bg` (already dynamic, but the default is now navy)
- Link colors use blue accent
- Keep functional structure identical

Minimal change — mostly just works from the CSS var updates.

### Task 1.3: Restyle MobileBottomNav

**File:** `src/components/MobileBottomNav.jsx`

Changes:
- Background to dark navy (`bg-[#242C3B]` or `bg-surface`)
- Active icon color to blue (`#007AFF`)
- Cascade menu to navy surface with blue accents
- Border top to `#353F54`
- Keep all functionality identical

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle shared components to navy/blue theme"`

---

## Phase 2: Home Page & Product Cards

### Task 2.1: Restyle Home page

**File:** `src/pages/Home.jsx`

Changes:
- Hero section background uses navy gradient (already uses CSS vars — just works)
- Category filter pills — change from green/gold to blue/navy
  - Active pill: `bg-[#007AFF] text-white`
  - Inactive pill: `bg-[#28303F] text-[#4A5771] border-[#353F54]`
- Section headings remain white
- Pagination buttons — blue accent
- Keep all data-fetching, state, and logic identical

### Task 2.2: Restyle ProductCard

**File:** `src/components/ProductCard.jsx`

Changes:
- Card background: `bg-[#28303F]` (was `bg-zinc-900`/`bg-black`)
- Card border: `border-[#353F54]`
- Price color: `text-[#38B8EA]` (was green)
- Add to cart button: blue `bg-[#007AFF]`
- Wishlist heart: blue when active
- Image container background: slightly lighter
- Hover state: subtle blue glow instead of green
- Keep all logic, variant handling, cart/wishlist functionality identical

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle Home page and ProductCard to navy theme"`

---

## Phase 3: Core Shopping Pages

### Task 3.1: Restyle Cart page

**File:** `src/pages/Cart.jsx`

Changes:
- Page header: navy background
- Cart item cards: `bg-[#28303F]` border `#353F54`
- Quantity controls: blue +/- buttons
- Promo code input: navy surface with blue button
- Summary section: navy card
- Checkout CTA: blue `bg-[#007AFF]`
- Empty cart state: restyled

### Task 3.2: Restyle Checkout page

**File:** `src/pages/Checkout.jsx`

Changes:
- Form backgrounds: navy surface
- Input fields: `bg-[#28303F]` border `#353F54` focus ring blue
- Order summary card: navy
- Pay button: blue
- Guest checkout section: restyled

### Task 3.3: Restyle ListingDetails (product detail)

**File:** `src/pages/ListingDetails.jsx`

Changes:
- Product image area: navy background
- Info section: navy card
- Variant selectors: blue accent
- Add to cart / Buy now: blue buttons
- Description/spec tabs: blue active indicator
- Reviews section: navy cards
- Related products: uses ProductCard (already done)

### Task 3.4: Restyle Wishlist + Compare

**Files:** `src/pages/Wishlist.jsx`, `src/pages/Compare.jsx`

Changes:
- Header backgrounds: navy
- Product cards: use restyled ProductCard
- Empty states: navy themed

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle cart, checkout, product detail, wishlist, compare"`

---

## Phase 4: Auth Pages

### Task 4.1: Restyle Login + Signup

**Files:** `src/pages/Login.jsx`, `src/pages/Signup.jsx`

Changes:
- Card/container: `bg-[#28303F]` with `border-[#353F54]`
- Input fields: navy surface with blue focus
- Submit button: blue `bg-[#007AFF]`
- OAuth buttons: navy with white text
- Links: blue accent
- Background: full page navy

### Task 4.2: Restyle AuthCallback

**File:** `src/pages/AuthCallback.jsx`

Minimal — loading spinner on navy background.

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle auth pages to navy theme"`

---

## Phase 5: Remaining Customer Pages (Batch A)

### Task 5.1: Restyle pages: TrackOrder, OrderSuccess, UserDashboard

**Files:** `src/pages/TrackOrder.jsx`, `src/pages/OrderSuccess.jsx`, `src/pages/UserDashboard.jsx`

Changes:
- All cards/surfaces: navy (`bg-[#28303F]`)
- All borders: `#353F54`
- All CTAs/primary actions: blue
- Status badges: blue variants
- Inputs: navy surface with blue focus
- Keep all functionality identical

### Task 5.2: Restyle pages: SearchPage, FlashDeals, Refurbished

**Files:** `src/pages/SearchPage.jsx`, `src/pages/FlashDeals.jsx`, `src/pages/Refurbished.jsx`

Changes:
- Filter panels: navy surfaces
- Result cards: restyled with navy cards (or use ProductCard)
- Price displays: blue/cyan
- Active filters: blue highlight
- Pagination: blue

### Task 5.3: Restyle pages: WholesalePage, ThisOrThat, SellerProfile

**Files:** `src/pages/WholesalePage.jsx`, `src/pages/ThisOrThat.jsx`, `src/pages/SellerProfile.jsx`

Changes:
- Surface/card colors to navy
- Buttons to blue
- Borders to `#353F54`
- Text hierarchy preserved

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle track-order, search, flash-deals, user pages to navy"`

---

## Phase 6: Info & Help Pages

### Task 6.1: Restyle info pages

**Files:** `src/pages/About.jsx`, `src/pages/HowItWorks.jsx`, `src/pages/Privacy.jsx`, `src/pages/Terms.jsx`, `src/pages/Install.jsx`, `src/pages/QRCodePage.jsx`

Changes:
- Cards/sections: navy background
- Headings: white
- Body text: `text-[#8E9BB5]` (light blue-gray for readability)
- Links: blue accent
- Buttons/CTAs: blue

### Task 6.2: Restyle Help Center pages

**Files:** `src/pages/help/*.jsx` (HelpCenter, ShoppingGuide, Refund, DisputeResolution, AfterSale, Delivery, FAQ, Payment, DeliveryTime, FlashSale, AffiliateHelp, WishlistHelp, TrackOrderHelp, SellerGuideHelp)

Changes:
- Sidebar/nav: navy surface
- Content cards: navy
- Search: navy input with blue focus
- Article cards: `bg-[#28303F]` border `#353F54`
- Links: blue
- Category icons: blue

### Task 6.3: Restyle Affiliate pages

**Files:** `src/pages/AffiliateDashboard.jsx`, `src/pages/AffiliatePage.jsx`, `src/pages/AffiliateApply.jsx`, `src/pages/AffiliateAgreement.jsx`, `src/pages/AffiliateWithdrawals.jsx`, `src/pages/AffiliateReferrals.jsx`, `src/pages/AffiliateLeaderboard.jsx`, `src/pages/AffiliateAchievements.jsx`

Changes:
- Dashboards cards: navy surface
- Stats/metrics: blue accent
- Tables: navy header rows
- Buttons: blue
- Progress/status: blue variants

### Task 6.4: Restyle Seller pages

**Files:** `src/pages/SellerDashboard.jsx`, `src/pages/SellerRegistration.jsx`

Changes:
- Form cards: navy
- Dashboard widgets: navy cards
- Buttons: blue

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle info, help, affiliate, seller pages to navy"`

---

## Phase 7: Remaining Shared Components

### Task 7.1: Restyle remaining shared components

**Files:**
- `src/components/NiaChat.jsx`, `src/components/NiaFloatingButton.jsx` — chat bubble blue, input navy
- `src/components/NotificationBell.jsx` — badge blue
- `src/components/InstallBanner.jsx` — navy surface, blue CTA
- `src/components/CookieConsentBanner.jsx` — navy with blue accept
- `src/components/BackToTop.jsx` — blue accent
- `src/components/SearchBar.jsx` — navy input
- `src/components/RecentlyViewed.jsx` — navy card
- `src/components/QuickViewModal.jsx` — navy modal
- `src/components/FlashDealsBar.jsx` — blue/cyan
- `src/components/Breadcrumb.jsx` — blue links
- `src/components/WhatsAppButtons.jsx` — keep green (brand color for WhatsApp)
- `src/components/Pagination.jsx` — blue active page, navy inactive
- `src/components/AutoScrollCarousel.jsx` — navy card background

**Verify:** `npm run build` passes.

**Commit:** `git commit -m "feat: restyle remaining shared components to navy"`

---

## Phase 8: Polish & QA

### Task 8.1: Dark mode consistency pass

- Browse every customer-facing route
- Verify no green/gold colors remain (search for `#1a5632`, `#14472a`, `#d4a017`, `#4ade80`)
- Verify cards, inputs, buttons consistently use blue/navy palette
- Check contrast: white text on navy bg meets 4.5:1

### Task 8.2: Build, fix, deploy

- `npm run build` — fix any build errors
- Push to GitHub: `git push origin kora-fixes`
- Let user know it's ready to deploy

---

## Summary of Files Changed

| Category | Files | Count |
|----------|-------|-------|
| Design tokens | `designSystem.js`, `tailwind.config.js`, `index.css` | 3 |
| Shared components | `Navbar`, `Footer`, `MobileBottomNav`, `ProductCard`, `NiaChat`, etc. | ~15 |
| Customer pages | `Home`, `Cart`, `Checkout`, `ListingDetails`, `Login`, `Signup`, etc. | ~30 |
| Info/Help | `About`, `HowItWorks`, `Privacy`, `Terms`, `Install`, help/*, affiliate/*, seller/* | ~25 |
| **Total** | | **~70 files** |