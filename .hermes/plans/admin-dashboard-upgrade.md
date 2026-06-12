# Admin Dashboard Upgrade Plan

## Current State
- Single `AdminDashboard.jsx` (421 lines) — monolithic page with inline modals
- Tabs: Products (grid + add/edit modal + delete) and Orders (list + status dropdown)
- Stats: Products count, Orders count, Revenue, Pending orders
- Product form: title, price, category, condition, quantity, brand, model, color, weight, SKU, description, image upload
- No search, no filters, no pagination
- No analytics/charts
- No customer management
- No order details view (just a flat list)
- No bulk actions
- No activity log / audit trail
- No settings page

## Upgrade Plan — Phased Approach

### Phase 1: Layout & Navigation (Foundation)
**Goal:** Professional sidebar layout with proper sub-pages

1. Create `AdminLayout.jsx` — sidebar navigation wrapper
   - Sidebar: Logo, nav links (Dashboard, Products, Orders, Customers, Analytics, Settings)
   - Collapsible on mobile (hamburger menu)
   - Active state highlighting with `#ff385c` accent
   - User info + logout at bottom of sidebar
   - Top bar: page title, notification bell, admin avatar

2. Create sub-page components (split from monolith):
   - `AdminOverview.jsx` — dashboard home with stats + charts
   - `AdminProducts.jsx` — product management
   - `AdminOrders.jsx` — order management
   - `AdminCustomers.jsx` — customer list
   - `AdminAnalytics.jsx` — sales analytics
   - `AdminSettings.jsx` — store settings

3. Update `App.jsx` routes:
   - `/admin` → redirects to `/admin/dashboard`
   - `/admin/dashboard` → AdminOverview
   - `/admin/products` → AdminProducts
   - `/admin/orders` → AdminOrders
   - `/admin/customers` → AdminCustomers
   - `/admin/analytics` → AdminAnalytics
   - `/admin/settings` → AdminSettings

### Phase 2: Products Management (Core)
**Goal:** Full CRUD with search, filter, bulk actions

1. Product list: table view (not grid) with columns: Image, Title, Price, Category, Stock, Status, Actions
2. Search by title/SKU
3. Filter by category, condition, status
4. Sort by price, date, stock
5. Bulk actions: delete multiple, change status
6. Quick edit inline (price, stock, status)
7. Product form improvements:
   - Multi-image upload (up to 5 images)
   - Image reordering (drag)
   - Rich text description (basic formatting)
   - Tags/keywords field
   - SEO fields (meta title, meta description)
   - Visibility toggle (active/draft)
8. Stock management: low stock alerts, out-of-stock auto-hide option

### Phase 3: Orders Management (Core)
**Goal:** Detailed order view with fulfillment workflow

1. Order list: table with Order ID, Customer, Date, Total, Status, Items count
2. Search by order ID, customer name, email
3. Filter by status, date range
4. Order detail modal/sidebar:
   - Customer info (name, email, phone, address)
   - Items list with images
   - Payment info (method, status, transaction ref)
   - Status timeline (pending → processing → shipped → delivered)
   - Notes field (admin notes)
   - Print/Export button
5. Status change with confirmation + optional customer notification
6. Refund/cancel workflow

### Phase 4: Customers & Analytics
**Goal:** Customer insights and sales data

1. Customers page:
   - Table: Name, Email, Phone, Orders count, Total spent, Last order
   - Search by name/email/phone
   - Customer detail: order history, total spent, joined date
   - Export customer list (CSV)

2. Analytics page:
   - Revenue chart (daily/weekly/monthly)
   - Orders chart
   - Top products by sales
   - Top categories
   - Conversion rate (visitors → orders)
   - Date range picker
   - Export report button

### Phase 5: Settings & Polish
**Goal:** Store configuration and final polish

1. Settings page:
   - Store name, logo, contact info
   - Delivery zones and pricing
   - Payment settings (Paystack public key display)
   - Email notifications toggle
   - Maintenance mode toggle
   - Tax settings

2. Polish:
   - Loading skeletons (not just spinners)
   - Empty states with illustrations
   - Toast notifications (replace inline success messages)
   - Keyboard shortcuts
   - Responsive design (mobile-first admin)
   - Dark mode consistency

## Technical Notes
- Keep existing Supabase queries, just reorganize into separate components
- Reuse existing `formatKES`, `CATEGORIES`, `CONDITIONS` from constants
- Reuse existing API functions from `utils/api.js`
- Add new API functions as needed (bulk operations, analytics queries)
- Use recharts or similar lightweight chart library for analytics
- Keep Tailwind CSS styling consistent with existing design
- All modals should use the same pattern (backdrop blur, rounded-3xl, etc.)

## Estimated Effort
- Phase 1: ~2 hours (layout + routing)
- Phase 2: ~3 hours (products overhaul)
- Phase 3: ~2.5 hours (orders overhaul)
- Phase 4: ~2 hours (customers + analytics)
- Phase 5: ~1.5 hours (settings + polish)
- **Total: ~11 hours**

## Order of Execution
1. Phase 1 first (foundation everything else builds on)
2. Phase 2 + Phase 3 in parallel (independent)
3. Phase 4 (depends on data from 2+3)
4. Phase 5 (final polish)
