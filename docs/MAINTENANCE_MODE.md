# Omix Market — Maintenance / Transition Mode

Temporary access gate + communication experience shown to public users while
Omix Market is being rebuilt. The existing application (routes, components,
business logic, data, auth, APIs, dashboard) is fully preserved behind the gate.

## The flag

| Variable | Consumed by | Effect |
|---|---|---|
| `MAINTENANCE_MODE=true` | Express `server.js` (Render) | Public page navigations get HTTP `503` + the static branded page |
| `VITE_MAINTENANCE_MODE=true` | React app at **build time** (Vercel, local dev) | Public routes render `<Maintenance />` instead of the storefront |

**Set both to the same value in production** so the two layers stay in sync.

```bash
# Enable
MAINTENANCE_MODE=true
VITE_MAINTENANCE_MODE=true   # then rebuild/redeploy the frontend

# Disable (normal storefront returns, no code changes needed)
MAINTENANCE_MODE=false
VITE_MAINTENANCE_MODE=false  # then rebuild/redeploy the frontend
```

Notes:

- `VITE_*` vars are baked into the JS bundle at build time — changing the
  value requires a rebuild. The server flag is read at process start —
  changing it requires a restart/redeploy only.
- On Render (`node server.js`), the server flag alone is enough to gate
  public traffic immediately; the React gate is a second layer for
  client-side navigation and non-Express hosts.
- On Vercel (static hosting, `vercel.json` rewrites to `/index.html`),
  only the React gate applies — set `VITE_MAINTENANCE_MODE=true` and redeploy.

## What users see

- **Public visitors** (`/`, `/search`, `/listing/*`, `/cart`, `/checkout`,
  `/account`, `/wishlist`, help pages, … — everything public) see the
  branded transition page: announcement banner, “We’re building something
  new.” hero, and the **Share Your Ideas →** feedback CTA
  (`https://tally.so/r/OD6Vx7`, opens in a new tab). No shop UI, product
  data, cart or checkout code is mounted.
- No preview URL exists yet, so no secondary “Preview” CTA is rendered
  (see `src/config/maintenance.json` → `preview.url`).

## What stays available (never gated)

- `/admin/*` — full dashboard (existing auth untouched, no bypasses)
- `/login`, `/auth/*` — staff sign-in + OAuth callbacks
- `/api/*`, `/health` — APIs, Paystack/M-Pesa webhooks, push, Nia proxy
- Static assets (`/assets/*`, images, `manifest.json`, service workers…)
- `/maintenance` — staff preview of the transition page (React route)

A discreet “Staff? Sign in to the dashboard” link sits in the maintenance
page footer so admins can reach `/login`.

## Architecture

```text
PUBLIC USER                    ADMIN / STAFF
    │                                │
    ▼                                ▼
Maintenance gate ON? ──yes──▶ Branded 503 / <Maintenance />
    │                                │
    no                               ▼
    ▼                          Normal app
Normal storefront              (/admin, /login, /auth/*)
```

1. **Server gate** (`server.js`): for `GET`/`HEAD` page navigations to
   non-bypass paths, serves `dist/maintenance.html` with `503`,
   `Retry-After: 3600`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control:
   no-store`. JSON/XHR traffic is never intercepted.
2. **React gate** (`src/components/MaintenanceGate.jsx` + `src/config/maintenance.js`):
   replaces public routes with `src/pages/Maintenance.jsx` (own `noindex`
   meta via Helmet, accessible, mobile-first). Bypass list mirrors the server.
3. **Copy deck** (`src/config/maintenance.json`): the single source of truth
   for every maintenance string. The React page imports it; the static
   fallback `public/maintenance.html` is generated from it by
   `scripts/build-maintenance-page.js`, which runs on every `npm run build`.

## Logo

Both pages show the existing Omix Store logo (`public/logo.jpg`, the same
asset used for the favicon and social cards) in a rounded tile above the
“Omix Market” eyebrow.

- `brand.imageSrc` in `src/config/maintenance.json` selects the logo file.
- `brand.tileTheme` (`"light"` / `"dark"`) matches the tile behind it to
  the image background so raster logos blend seamlessly.
- If `imageSrc` is ever removed, both pages fall back to the vector Omix
  wireframe knot at `public/omix-mark.svg` (generated deterministically by
  `scripts/generate-omix-mark.js`) on a dark tile.

To switch logo files, update `brand.imageSrc` (+ `tileTheme` if the
background brightness changes) and rebuild (`npm run build`) — no component
changes needed.

## Changing copy / evolving to launch

Edit `src/config/maintenance.json`, then rebuild:

```bash
node scripts/build-maintenance-page.js   # regenerate public/maintenance.html
npm run build                            # full build (runs the above too)
```

To evolve into a launch experience later (e.g. “🚀 The new Omix Market is
here.”), update the same JSON file — no component changes needed.

## Motion system

Both the React page and the static fallback share the same CSS-only motion
language (`transform` + `opacity` only — no libraries, no video/GIF/Lottie,
no layout-animating properties):

- **Entrance (450–600ms, coordinated):** banner drops in, then brand →
  heading → build line → supporting copy → feedback block/CTA → signoff →
  footer, each staggered ~60–100ms so the page reads as one composition.
- **“Building” motifs:** an extremely subtle blueprint grid drifts behind
  the content on an 18s cycle (radially masked, never competes with text),
  and a small dot sweeps slowly along a hairline under the heading (9s).
- **CTA physics:** 1px lift on hover, 3px arrow nudge (hover + keyboard
  focus), subtle press scale. Navigation is never delayed.
- **Banner:** enters once and stays stable — the warning icon is never
  pulsed or blinked.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables every
  animation/transition; the page remains fully usable as a static page.

Motion tokens live in `src/styles/maintenance.css` (React) and are mirrored
in `scripts/build-maintenance-page.js` (static fallback). Keep the two in
sync when tuning timing or easing.

## Not to be confused with…

- **Legacy Supabase `app_settings.maintenance_mode`** (Admin → Settings →
  Site Status + `useMaintenanceMode` hook): only disables purchases
  (“browse but can’t buy”). Left untouched by this system.
- **`MaintenanceBanner` ticker**: still shown on staff-visible routes
  (admin/login) while the env flag is on, so staff know the public
  storefront is gated.

## Verification checklist

```bash
# 1. Build with the flag ON, start the server
VITE_MAINTENANCE_MODE=true npm run build
MAINTENANCE_MODE=true PORT=3000 node server.js

# 2. Public → 503 maintenance page
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/            # 503
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/cart        # 503
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/listing/123 # 503

# 3. Staff + infra → untouched (200, SPA shell / JSON)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin       # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login       # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/health      # 200
curl -s http://localhost:3000/api/maintenance-status                      # {"maintenanceMode":true}

# 4. Flag OFF → everything back to normal
MAINTENANCE_MODE=false PORT=3000 node server.js
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/            # 200
```

Also verify in a browser (desktop + mobile widths): banner wraps without
horizontal scroll, CTA opens the Tally form in a new tab, keyboard focus is
visible, and `/admin` login → dashboard works end to end.
