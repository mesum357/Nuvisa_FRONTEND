# NUvisa

Customer-facing web application for **Schengen and UK visa applications**: choose country and visa type, upload documents (with passport OCR), book appointments, and pay via Stripe (including Google Pay, coupons, gift cards).

## Documentation

All project documentation is in the **`docs/`** folder:

| Document | Description |
|----------|-------------|
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Purpose, tech stack, and main features |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow, entry points, source layout, Prisma vs Admin API |
| [docs/SETUP.md](docs/SETUP.md) | Environment variables, install, database, and run commands |
| [docs/ROUTES_AND_PAGES.md](docs/ROUTES_AND_PAGES.md) | Pages Router routes and API routes |

## Quick start

```bash
pnpm install
# Set DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (see docs/SETUP.md)
pnpm dev   # runs on port 3002
```

**Tech:** Next.js 16 (Pages Router), React 19, Redux, Tailwind CSS v4, Prisma (PostgreSQL), Stripe, external Admin API.
