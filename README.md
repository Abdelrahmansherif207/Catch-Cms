# Rawd Al Aseel CMS

Admin dashboard for managing the Rawd Al Aseel e-commerce platform. Handles catalog, content, and marketing, the full order lifecycle, and a warehouse/fulfillment stack (warehouses, locations, inventory, wave picking, packing, packages, shipments) plus users, roles, and settings for the Rawd Al Aseel (روض الأصيل) retail brand.

> **Branch note** — this branch (`project/rawd-al-aseel`) is a brand-specific branch of the shared CMS: Rawd design tokens, logo, metadata, and translations, on top of the full mutual feature set. Mutual work lands on `main`; see `docs/multi-project-sync.md` for the sync playbook.

## Features

- **Authentication** — Login/logout with JWT, protected routes, guest redirects
- **Dashboard** — Overview analytics and quick actions
- **Category Management** — CRUD with tree structure, ordering, featured categories
- **Brand Management** — CRUD with image uploads and drag-and-drop reordering
- **Product Management** — Products with attributes/variations and digital asset management
- **Content Management** — Sliders and banners (desktop/mobile images, product linking), static pages, FAQs with sorting
- **Flash Sales** — Time-limited promotions with product selection
- **Coupon Management** — Discount codes with configurable limits and date ranges
- **Promotion Management** — Price discounts, quantity promotions, and gift-with-purchase
- **Order Management** — Order lifecycle, status badges, cancellation, shipment dialogs, release-selection workflow
- **Warehouses & Locations** — Warehouse CRUD with staff user assignment; placement locations
- **Inventory** — Stock receipts, transfers, and a live stock-operations feed
- **Fulfillment** — Placement-aware task flow, fulfillments, packing tasks and stations, packages with coverage guards, bulk cycle actions
- **Wave Picking** — Batch picking module with batch lifecycle stepper and operator dialogs
- **Tracking** — Live tracking dashboard with attention alerts (Pusher-powered)
- **Digital Entitlements** — Entitlement bits/limits admin with revoke and restore
- **Extra Commerce Modules** — Pickup locations with working-hours validation, invoices, currencies, reviews moderation, activity logs
- **Role & Permission Management** — RBAC with granular permission assignment
- **User Management** — Admin user CRUD with role assignment
- **Contact Messages** — Inbox for customer inquiries
- **Settings** — Application configuration (logo, favicon, branding)
- **Internationalization** — Full English/Arabic (RTL) support
- **Responsive Design** — Mobile-friendly with collapsible sidebar
- **Dark Mode** — Theme toggle with system preference detection

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 + shadcn/ui (Radix UI primitives) |
| Routing | react-router v7 (BrowserRouter) |
| Data Fetching | @tanstack/react-query 5 |
| State Management | Zustand 5 |
| Forms | react-hook-form + Zod 4 |
| HTTP Client | Axios |
| Internationalization | i18next + react-i18next |
| Drag & Drop | @dnd-kit (core, sortable, utilities) |
| Notifications | Sonner |
| Icons | Lucide React |
| Date Utilities | date-fns |
| CSS Utilities | class-variance-authority, clsx, tailwind-merge, tw-animate-css |
| Font | Geist (variable) by Vercel |
| React Compiler | Enabled via babel-plugin-react-compiler |
| Code Quality | ESLint + typescript-eslint |
| Package Manager | pnpm |

## Prerequisites

- Node.js 20 or higher
- pnpm (recommended) or npm

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd ecommerce-cms

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

Edit `.env` and set your API base URL:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Run ESLint across the codebase |

## Project Structure

```
src/
├── app/                # App entry point, root component, router
├── features/           # Domain modules (grouped per the Features list):
│                       #   commerce, content, marketing, WMS/fulfillment,
│                       #   tracking, entitlements, platform (users/roles/settings)
├── layouts/            # Admin layout, sidebar, header
├── shared/             # Shared UI components, i18n, hooks, styles, ui kit, utils
│   ├── components/
│   ├── hooks/
│   ├── i18n/
│   └── styles/
└── widgets/            # Reusable feature widgets
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL of the Rawd backend API |
| `VITE_PUSHER_APP_KEY` | Yes | Pusher app key (live updates) |
| `VITE_PUSHER_SECRET` | Yes | Pusher secret |
| `VITE_PUSHER_CLUSTER` | Yes | Pusher cluster |
| `VITE_TINYMCE_API_KEY` | Yes | TinyMCE key for the rich-text editor |

## Deployment

This branch deploys as a standalone Vercel project. `vercel.json` already rewrites all routes to `index.html` (SPA fallback). Set the `VITE_*` variables in the Vercel dashboard — they are inlined at build time, per environment.

## License

All Rights Reserved — Rawd Al Aseel (روض الأصيل)
