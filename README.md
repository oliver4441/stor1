# STOR1 / Omix Store

A modern P2P marketplace platform for discovering, buying, and managing products in one place.

## Overview

STOR1 (Omix Store) is a full-stack marketplace application built for desktop and mobile devices. It includes storefront browsing, seller and affiliate portals, administrative dashboards, and real-time payment integrations.

### Key Features

- Responsive marketplace UI (Tailwind CSS)
- Product search, filtering, and seller listings
- Customer orders, wallet, and loyalty points
- Seller dashboard and affiliate tracking
- Admin management dashboard
- Paystack (M-Pesa) payment processing
- AI assistant (Nia) & push notifications

## Tech Stack

- **Frontend:** React 18, React Router v6, Vite 5, Tailwind CSS
- **State & Data Fetching:** React Context, TanStack Query (React Query)
- **Backend / DB:** Supabase (Auth & PostgreSQL), Express Node.js Server (`server.js`)
- **Testing & Quality:** Vitest, React Testing Library, Playwright, ESLint, Prettier, TypeScript (`tsc`)
- **Deployment:** Render / Vercel

## Project Structure

```text
src/
├── app/           # App shell, routing, providers
├── components/    # Reusable UI components & auth guards
├── features/      # Feature-based modules (auth, cart, products, seller)
├── hooks/         # Reusable React hooks
├── lib/           # Supabase client, utils, validation, observability
├── pages/         # Route-level page components
├── services/      # API/data services
├── styles/        # Global CSS and Tailwind stylesheets
└── types/         # TypeScript definitions (e.g., Supabase schema)
tests/
├── unit/          # Vitest unit tests
└── e2e/           # Playwright E2E tests
supabase/
└── migrations/    # RLS policies and SQL migrations
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```

4. **Run checks and tests:**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Supabase & Database Setup

- Run database migrations located in `supabase/migrations/` using the Supabase CLI or Supabase Dashboard SQL Editor.
- Row Level Security (RLS) policies are configured in `supabase/migrations/20250101000000_enable_rls.sql`.

## License

This project is licensed under the [MIT License](LICENSE).
