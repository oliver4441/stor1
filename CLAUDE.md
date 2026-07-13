# Omix Store Frontend (stor1)

## Project Overview
Omix Store is a P2P e-commerce marketplace for Kericho, Kenya. React 18 SPA with Vite 5, Tailwind CSS, and Supabase backend. Deployed on Render.

## Tech Stack
- **Framework**: React 18, React Router v6, Vite 5
- **Styling**: Tailwind CSS 3, Lucide React icons
- **Backend**: Supabase (auth + DB), custom Express API at stor1-api
- **Payments**: Paystack (M-Pesa via STK push + inline)
- **Deployment**: Render (serve -s dist for SPA)

## Key Architecture
- **Auth**: Supabase Auth (email/password + Google OAuth). Guest checkout uses `guest_id` cookie.
- **State**: Cart in localStorage. UI state per-component.
- **API Layer**: `src/utils/api.js` — direct Supabase queries + Express API fallback
- **Routes**: 50+ routes in `src/App.jsx`. Admin routes nested under `/admin`.
- **Chunking**: Vite manual chunks — vendor (React), admin (all admin pages), help (help center pages)

## Key Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | All route definitions |
| `src/utils/api.js` | API layer (Supabase + Express) |
| `src/utils/constants.js` | Categories, tier configs, static data |
| `src/utils/storeConfig.js` | Store phone/WhatsApp numbers |
| `src/pages/Checkout.jsx` | Guest + user checkout flow |
| `src/pages/AdminProducts.jsx` | Product CRUD admin panel |
| `src/pages/AdminOrders.jsx` | Order management admin panel |
| `src/pages/AdminAffiliates.jsx` | Affiliate management admin panel |
| `src/pages/ListingDetails.jsx` | Product detail page |

## Conventions
- **No emojis in UI** — use SVG icons (Lucide React) exclusively
- **Functional components** with hooks
- **Clean, professional UI** with proper navbars (search, notifications, user dropdown on dashboard; hamburger menu on landing)
- **Admin panel required** for every business feature (never just customer-facing)
- **Real data** — no placeholders, no dummy text

## State / Order Statuses
`pending`, `cod_pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `payment_failed`

## Affiliate Program
- Tiers: Silver 5%, Gold 10%
- First-touch attribution, 100-year cookie
- Payouts via M-Pesa, min KES 2,000

## Deployment
- Frontend: `https://stor1-web.onrender.com/`
- API: `https://stor1-api.onrender.com/`
- Build: `pnpm build` (Vite), served via `serve -s dist`
- Env vars set in Render Dashboard — never modify via API (PUT replaces all vars)
- Use deploy hook URL for redeploy, not env var modification
