# PROJECT_STATE — NOIR FORM

## Project
**NOIR FORM** — an original, fictional premium fashion e-commerce storefront. Minimal/editorial aesthetic inspired by
the philosophy of high-end contemporary fashion (no copyrighted branding, copy, or imagery — all imagery is
AI-generated, garment-focused, and generated for this project; no identifiable people).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 (design tokens in `src/app/globals.css` via `@theme`)
- lucide-react icons, clsx
- Drizzle/Postgres scaffold exists (`src/db`, `/api/health`) but the storefront intentionally uses a **mock data
  layer** — architecture is DB-ready (see "Database assumptions").

## Architecture
- `src/lib/types.ts` — domain model (Product, CartItem, Order, Coupon, Collection, JournalPost…)
- `src/lib/config.ts` — brand facts, currencies (BDT default, USD/GBP/EUR display conversion), shipping rates,
  seed coupons, payment-method descriptors, NAV, DEMO_USER
- `src/lib/utils.ts` — price formatting, stock helpers, coupon validation, local-storage helpers + `LS_KEYS`
- `src/lib/data/` — `products.ts` (28 products + image map `IMG`), `collections.ts`, `content.ts` (journal, FAQ, legal)
- `src/lib/store.tsx` — client providers: Toasts, UI (search/cart/menu/currency/quickview), Cart, Wishlist,
  RecentlyViewed. All persisted to `localStorage` under `nf-*` keys.
- `src/lib/search.ts` — local scoring search (swap for DB/API search later)
- `src/components/ui/` — primitives (Button/Input/Select/Price/QtyStepper/Accordion/Breadcrumb/Badge/EmptyState)
  and overlays (Drawer/Modal/Reveal)
- `src/components/layout/` — header (mega menu, transparent-on-hero), mobile menu, footer (+ NewsletterForm),
  cookie consent
- `src/components/product/` — card/grid, gallery (swipe + zoom), selectors (size/colour/size-guide), quick view,
  wishlist button, product info (PDP), recently viewed
- `src/components/shop/shop-client.tsx` — filters (availability/gender/category/collection/size/colour/price/
  highlights), 6 sort orders, mobile filter drawer, URL-driven initial state
- `src/components/home/sections.tsx` — hero, marquee, featured collection, selected pieces, category split,
  story, collection feature, product highlight, newsletter
- App routes: `/` `/shop` `/products/[slug]` `/collections/[slug]` `/search` `/cart` `/wishlist` `/checkout`
  `/account` `/admin` `/journal` `/journal/[slug]` `/about` `/contact` `/faq` `/privacy` `/terms` `/cookies`
  `/shipping-policy` `/return-policy` + `sitemap.ts` `robots.ts` `not-found.tsx` `error.tsx`

## Completed features
- Full visual system (tokens, Fraunces + Inter typography, motion, reduced-motion support)
- Header w/ mega menu, mobile accordion menu, announcement bar, transparent hero header
- Homepage (8 editorial sections) with AI-generated original imagery
- Shop: 8 filter groups + 6 sorts + mobile drawer + empty states
- PDP: swipe gallery w/ zoom, size/colour/qty, sold-out + low-stock states, size guide modal, accordions,
  related products, recently viewed
- Cart drawer + full cart page, free-shipping progress, coupons (WELCOME10/NEWSEASON/FLAT500/VIP15)
- Wishlist (local), quick view, search overlay (instant results, recent searches) + results page
- Checkout: 5 steps (Contact → Shipping → Payment → Review → Confirmation), BD-first fields/divisions,
  standard/express delivery, COD/card/bKash-Nagad (demo), order persisted to local storage
- Account: demo sign-in/register/forgot, orders + order details, addresses CRUD, profile
- Admin (demo/mock, clearly labelled): dashboard KPIs + chart + stock alerts, products table + edit modal
  (price/stock/flags), add-product (local), orders table + status updates + detail modal, customers, inventory
  bars, discounts manager, settings + clear-demo-data
- Journal (4 posts), About, Contact (validated form), FAQ (6 sections), 5 legal pages (marked placeholder),
  cookie consent, 404/error pages, sitemap + robots

## Incomplete / integration points
- Real database (Drizzle schema + repositories) — see projects notes below
- Real authentication (Supabase/Auth.js) — account is demo-only
- Payment gateways (SSLCommerz/bKash/Nagad) — descriptors exist; needs server-side API routes + credentials
- Admin auth guard — demo only, must never ship admin as mere hidden route
- Email sending (order confirmation, newsletter)

## Environment variables
- `DATABASE_URL` (exists for the scaffold; storefront does not require it yet)
- Future: `NEXT_PUBLIC_SITE_URL`, SSLCommerz/bKash/Nagad server secrets, auth provider keys

## Database assumptions (when wiring up)
Tables: users, profiles, products, product_variants (size/stock/sku), categories, collections (+ join),
inventory, orders, order_items, addresses, wishlists, wishlist_items, reviews, coupons, coupon_usage, settings.
Types in `src/lib/types.ts` were modelled to map onto these tables. `LS_KEYS` marks every demo persistence point.

## Deployment notes
- `next build` + `next start`. All images are local (`public/images/*`) — no remote image domains required.
- Keep `/api/health` intact (used by the platform healthcheck).

## Known issues / notes
- Product editing in admin persists to local storage only; the public catalogue reads `src/lib/data/*` (by design
  for demo; swap the data layer to DB reads when wiring the backend).
- USD/GBP/EUR are display conversions at fixed demo rates in `config.ts`.
