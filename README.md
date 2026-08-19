# Meem Market CMS

Admin dashboard for managing the [Meem Market](https://meem.market) e-commerce platform. Handles products, orders, promotions, coupons, categories, brands, content, users, roles, and settings for the Meem Market retail chain ([meem-market.com](https://meem-market.com)).

## Features

- **Authentication** — Login/logout with JWT, protected routes, guest redirects
- **Dashboard** — Overview analytics and quick actions
- **Category Management** — CRUD with tree structure, ordering, featured categories
- **Brand Management** — CRUD with image uploads and drag-and-drop reordering
- **Slider Management** — Banner slides with desktop/mobile images and product linking
- **FAQ Management** — Frequently asked questions with sorting
- **Flash Sales** — Time-limited promotions with product selection
- **Coupon Management** — Discount codes with configurable limits and date ranges
- **Promotion Management** — Price discounts, quantity promotions, and gift-with-purchase
- **Attribute Management** — Product attributes and variations
- **Role & Permission Management** — RBAC with granular permission assignment
- **User Management** — Admin user CRUD with role assignment
- **Contact Messages** — Inbox for customer inquiries
- **Settings** — Application configuration
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
├── features/           # Feature modules
│   ├── auth/
│   ├── brands/
│   ├── categories/
│   ├── coupons/
│   ├── faqs/
│   ├── flash-sale/
│   ├── promotions/
│   ├── roles/
│   ├── settings/
│   ├── sliders/
│   └── users/
├── layouts/            # Admin layout, sidebar, header
├── shared/             # Shared UI components, i18n, hooks, styles
│   ├── components/
│   ├── hooks/
│   ├── i18n/
│   └── styles/
└── widgets/            # Reusable feature widgets
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Base URL of the backend API |

## License

All Rights Reserved — Meem Market (ميم المتميزة للتجارة)
