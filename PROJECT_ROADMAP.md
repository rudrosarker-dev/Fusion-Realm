# PROJECT ROADMAP — NOIR FORM

## Foundation
* [x] Project setup (Next.js 16 + TS strict + Tailwind v4)
* [x] Design system & tokens (colours, type, motion, focus states)
* [x] Global styles + accessibility primitives (skip link, reduced motion)
* [x] Documentation (PROJECT_STATE / ROADMAP)

## Navigation
* [x] Header (transparent-on-hero, sticky, announcement bar)
* [x] Mega menu (Shop / Men / Women / Collections)
* [x] Mobile menu (accordion, currency selector)

## Homepage
* [x] Hero (FORM / FUNCTION, dual CTA)
* [x] Featured collection (editorial asymmetry)
* [x] Selected pieces (8 products, quick view)
* [x] Category split (Men / Women)
* [x] Brand story (dark editorial)
* [x] Collection feature (CORE / 01)
* [x] Product highlight (Studio Heavy Hoodie)
* [x] Value marquee + Newsletter
* [x] Footer (4 columns, newsletter, region selector, socials)

## Commerce
* [x] Product listing (28 products, filters, sort, mobile drawer)
* [x] Product page (gallery, swipe, zoom, size guide, accordions)
* [x] Search (overlay, instant results, recents, results page)
* [x] Cart drawer + cart page (qty, remove, coupons, free-ship bar)
* [x] Wishlist (local storage)
* [x] Checkout (5 steps, validation, BD address + delivery options)
* [x] Recently viewed + related products
* [x] Quick view

## Account
* [x] Auth UI (demo sign-in / register / forgot)
* [x] Profile, orders + order details, addresses, sign-out
* [ ] Production auth provider (Supabase/Auth.js)

## Admin
* [x] Dashboard (KPIs, revenue chart, stock alerts, recent orders)
* [x] Products (table, edit price/stock/flags, add demo product)
* [x] Orders (status management + details)
* [x] Customers (derived), Inventory (bars + edit), Discounts (CRUD demo)
* [x] Settings + danger zone
* [ ] Admin authentication & authorization
* [ ] Homepage CMS

## Backend
* [x] DB-ready domain model + mock data layer
* [x] Coupon validation engine (seed codes)
* [x] Order persistence (demo local storage)
* [ ] Drizzle schema for commerce tables
* [ ] API routes: products, orders, search
* [ ] Payment gateway: SSLCommerz (cards), bKash, Nagad, live COD flow
* [ ] Image storage (replace generated placeholders with campaign shoots)
* [ ] Email (order confirmation, newsletter)

## Deployment
* [x] Production build
* [x] Sitemap + robots + SEO metadata
* [ ] Environment variables on hosting
* [ ] Domain + SSL
* [ ] Analytics (privacy-friendly)

## i18n / Region
* [x] BDT-first pricing, ৳ formatting ( lakh grouping )
* [x] Currency selector (BDT/USD/GBP/EUR display conversion)
* [ ] Bengali locale (architecture keeps copy in data/config files)
