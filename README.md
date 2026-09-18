# STOR1

A modern marketplace platform for discovering, buying, and managing products in one place.

## Overview

STOR1 is a full-stack marketplace application focused on a fast, responsive shopping experience with dedicated tools for customers, sellers, affiliates, and administrators.

### Highlights

- Responsive marketplace UI for desktop and mobile
- Product discovery, search, categories, and featured products
- Customer account and order flows
- Seller and affiliate functionality
- Administrative dashboard
- PWA-ready experience with app installation support
- Theme support and responsive navigation
- Automated pull-request build validation with GitHub Actions

## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Backend / data:** Supabase
- **Authentication:** Supabase Auth
- **Icons:** Lucide React
- **Deployment:** Vercel-compatible Vite deployment
- **CI:** GitHub Actions

## Getting Started

### Requirements

- Node.js 20+
- npm
- A configured Supabase project

### Installation

```bash
npm install
```

Create a `.env` file with the environment variables required by the application, then start the development server:

```bash
npm run dev
```

For a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
src/
├── components/    # Reusable UI components
├── context/       # Application state and providers
├── hooks/         # Reusable React hooks
├── lib/           # Shared utilities and integrations
├── pages/         # Application pages and layouts
└── services/      # Data and application services
```

## Development Workflow

STOR1 uses pull requests for changes targeting `main`.

1. Create a feature branch.
2. Make and test your changes locally.
3. Push the branch to GitHub.
4. Open a pull request against `main`.
5. GitHub Actions validates the production build.
6. Approved Arena PRs can be automatically merged when the required CI check succeeds.

Keep credentials and private environment variables out of the repository.

## Environment Variables

Never commit secrets to Git. Configure Supabase and other deployment credentials through your local `.env` file or your hosting provider's environment-variable settings.

## Contributing

Before submitting a pull request:

- Keep changes focused and reviewable.
- Run `npm run build` locally.
- Verify affected customer, seller, affiliate, and admin flows.
- Check responsive behavior on mobile and desktop.
- Do not commit credentials, API keys, or private configuration.

## Production Checklist

Before releasing a significant change, verify:

- Authentication and authorization
- Product search and browsing
- Cart and checkout flows
- Orders and account pages
- Seller and affiliate dashboards
- Admin routes
- Mobile navigation
- PWA installation
- Theme behavior
- Supabase connectivity
- Production build and deployment

## License

This project is currently maintained as a private application. Licensing terms should be defined before distributing the source or derivative works publicly.

---

**STOR1** — marketplace infrastructure built for a fast, modern shopping experience.