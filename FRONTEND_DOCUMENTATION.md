# Kifayat Frontend — Complete Documentation

> **Last updated:** July 2026
> **Framework:** React 19 + Vite 7
> **Router:** TanStack Router (file-based)
> **Data fetching:** TanStack Query
> **Styling:** Tailwind CSS v4 + custom design tokens
> **Animation:** Framer Motion + Lenis smooth scroll
> **UI primitives:** Radix UI + shadcn/ui
> **SEO:** react-helmet-async + JSON-LD structured data
> **Auth:** Firebase (Google) + JWT httpOnly cookie
> **Real-time:** Socket.IO client

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Routing](#3-routing)
4. [Design System](#4-design-system)
5. [Component Library](#5-component-library)
6. [State Management](#6-state-management)
7. [API Layer](#7-api-layer)
8. [Authentication](#8-authentication)
9. [Cart System](#9-cart-system)
10. [SEO System](#10-seo-system)
11. [Real-time (Socket.IO)](#11-real-time-socketio)
12. [Admin Panel](#12-admin-panel)
13. [Page Reference](#13-page-reference)
14. [Environment Variables](#14-environment-variables)
15. [Build & Dev Setup](#15-build--dev-setup)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  kifayat-frontend/                   │
│                                                     │
│  Vite dev server — port 5000 (mapped to ext. 80)   │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐                │
│  │ TanStack    │   │ TanStack     │                │
│  │ Router      │   │ Query        │                │
│  │ (file-based)│   │ (data layer) │                │
│  └──────┬──────┘   └──────┬───────┘                │
│         │                 │                         │
│         ▼                 ▼                         │
│  ┌──────────────────────────────┐                   │
│  │    Page Components           │                   │
│  │  (routes/*.tsx)              │                   │
│  └──────────────┬───────────────┘                   │
│                 │                                   │
│         ┌───────┴────────┐                          │
│         ▼                ▼                          │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  lib/*.ts    │  │ components/  │                │
│  │  (API calls) │  │ (UI)         │                │
│  └──────┬───────┘  └──────────────┘                │
│         │                                          │
│         ▼  Vite proxy /api → localhost:3001         │
│  ┌──────────────────────────────┐                   │
│  │  Express Backend (port 3001) │                   │
│  └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- File-based routing via TanStack Router (routes in `src/routes/`)
- All data fetching through TanStack Query with typed `lib/*.functions.ts` wrappers
- localStorage-backed cart (not server-side)
- httpOnly cookie auth — no tokens in localStorage or memory
- SEO via react-helmet-async (per-route overrides) + JSON-LD structured data

---

## 2. Directory Structure

```
kifayat-frontend/
├── index.html                        # Shell HTML with default meta, font preloads
├── vite.config.ts                    # Vite + TanStack Router + Tailwind + tsconfigPaths
├── tsconfig.json                     # TypeScript config
├── eslint.config.js
├── package.json
│
└── src/
    ├── main.tsx                      # Entry: StrictMode, QueryClient, Router, HelmetProvider
    │
    ├── routes/                       # TanStack Router — one file = one route
    │   ├── __root.tsx                # Root layout: SmoothScroll, PageTransition, Toaster
    │   ├── index.tsx                 # / — Homepage
    │   ├── products.tsx              # /products — layout wrapper
    │   ├── products.index.tsx        # /products/ — product catalogue
    │   ├── products.$productId.tsx   # /products/:productId — product detail
    │   ├── category.$slug.tsx        # /category/:slug — category listing
    │   ├── search.tsx                # /search — search results
    │   ├── cart.tsx                  # /cart — shopping bag
    │   ├── checkout.tsx              # /checkout — checkout form
    │   ├── confirm-order.tsx         # /confirm-order?token=... — email link handler
    │   ├── blog.tsx                  # /blog — article list
    │   ├── blog.$postId.tsx          # /blog/:postId — single article
    │   ├── about.tsx                 # /about
    │   ├── contact.tsx               # /contact
    │   ├── faq.tsx                   # /faq
    │   ├── privacy.tsx               # /privacy
    │   ├── terms.tsx                 # /terms
    │   ├── return-policy.tsx         # /return-policy
    │   ├── shipping-policy.tsx       # /shipping-policy
    │   ├── auth.tsx                  # /auth — auth gateway
    │   ├── login.tsx                 # /login
    │   ├── register.tsx              # /register
    │   ├── account.tsx               # /account — account layout
    │   ├── account.orders.tsx        # /account/orders
    │   ├── account.wishlist.tsx      # /account/wishlist
    │   ├── account.addresses.tsx     # /account/addresses
    │   ├── account.reviews.tsx       # /account/reviews
    │   ├── account.payment-methods.tsx
    │   ├── _authenticated/           # Routes requiring auth (guard applied)
    │   │   └── admin.tsx             # /admin — full admin panel
    │   └── sitemap[.]xml.ts          # Dummy route (prevents router error; backend serves real XML)
    │
    ├── components/
    │   ├── landing/                  # Page-level sections for the storefront
    │   │   ├── PageShell.tsx         # Universal layout: Header + Footer + MobileNav + SideDrawer
    │   │   ├── PageHeader.tsx        # Page title + subtitle + breadcrumbs
    │   │   ├── Header.tsx            # Top navigation, search, cart icon, auth links
    │   │   ├── Footer.tsx            # Site footer: links, social, legal
    │   │   ├── MobileNav.tsx         # Bottom mobile navigation bar
    │   │   ├── SideDrawer.tsx        # Mobile side navigation drawer
    │   │   ├── Hero.tsx              # Homepage hero section
    │   │   ├── Categories.tsx        # Category grid / pill row
    │   │   ├── Products.tsx          # Featured products grid
    │   │   ├── FlashDeals.tsx        # Flash deals / discounted products strip
    │   │   ├── Testimonials.tsx      # Customer testimonials carousel
    │   │   ├── Newsletter.tsx        # Email newsletter sign-up
    │   │   ├── ValueStrip.tsx        # Trust badges / USP strip
    │   │   ├── PressStrip.tsx        # Press mentions strip
    │   │   ├── EditStory.tsx         # Brand editorial section
    │   │   ├── Lookbook.tsx          # Visual lookbook / editorial grid
    │   │   ├── Journal.tsx           # Blog preview on homepage
    │   │   ├── FounderLetter.tsx     # Founder's note section
    │   │   ├── LiveStats.tsx         # Real-time stats display
    │   │   └── LegalPage.tsx         # Shared layout for all policy/legal pages
    │   │
    │   ├── shop/                     # Product & shopping UI
    │   │   ├── ProductCard.tsx       # Product tile (image, name, price, brand, badge)
    │   │   ├── ReviewsAndQA.tsx      # Reviews list + Q&A section on product page
    │   │   ├── Lightbox.tsx          # Full-screen image lightbox (lazy loaded)
    │   │   ├── ZoomImage.tsx         # Hover-to-zoom product image
    │   │   └── WishlistButton.tsx    # Toggle wishlist heart button
    │   │
    │   ├── seo/                      # SEO metadata
    │   │   ├── SEO.tsx               # Main <Helmet> component (title, meta, OG, Twitter)
    │   │   └── JsonLd.tsx            # JSON-LD structured data schemas
    │   │
    │   ├── motion/                   # Animation utilities
    │   │   ├── Reveal.tsx            # Scroll-triggered fade/slide-in wrapper
    │   │   ├── PageTransition.tsx    # Page-level enter/exit animation
    │   │   ├── SmoothScroll.tsx      # Lenis smooth scroll initializer
    │   │   └── fly-to-cart-event.ts  # Add-to-cart fly animation trigger
    │   │
    │   └── ui/                       # shadcn/ui base components
    │       └── (slider, tooltip, dialog, etc.)
    │
    ├── lib/                          # Business logic and API clients
    │   ├── api.ts                    # Axios instance (baseURL: /api, withCredentials: true)
    │   ├── auth-store.ts             # useAuth hook — user state, signIn, signOut
    │   ├── cart-store.ts             # cart object — add, remove, clear, localStorage sync
    │   ├── ui-store.ts               # Global UI state (drawer open, etc.)
    │   ├── shop.functions.ts         # Product listing, detail, categories, orders
    │   ├── admin.functions.ts        # Admin CRUD — products, orders, users, stats
    │   ├── account.functions.ts      # Addresses, wishlist, recently viewed
    │   ├── analytics.functions.ts    # Dashboard analytics queries
    │   ├── reviews.functions.ts      # Product reviews (list, submit, delete)
    │   ├── search.functions.ts       # Full-text search + suggestions
    │   ├── socket.ts                 # Socket.IO client singleton
    │   └── utils.ts                  # Shared utility functions
    │
    ├── hooks/                        # Custom React hooks
    │   ├── useIsMobile.ts            # Responsive breakpoint detection
    │   ├── usePricingSync.ts         # Syncs prices when backend emits pricing_updated
    │   └── useRealtimeProducts.ts    # Refreshes product list on Socket.IO events
    │
    ├── styles/
    │   ├── index.css                 # Tailwind base + custom @theme tokens
    │   ├── auth.css                  # Auth page specific styles
    │   └── dashboard.css             # Admin dashboard specific styles
    │
    ├── utils/
    │   └── pendingSignup.ts          # Handles interrupted Google sign-up flows
    │
    └── assets/                       # Static images and icons
```

---

## 3. Routing

TanStack Router generates a type-safe route tree from `src/routes/`. The generated file is `src/routeTree.gen.ts` (auto-generated, do not edit manually).

### Route Tree

```
/                           → Homepage
/products                   → Product catalogue layout
/products/                  → Product grid (all products)
/products/:productId        → Product detail page
/category/:slug             → Category listing page
/search                     → Search results (?q=, ?sort=, ?brand=, ?min_price=, ?max_price=)
/cart                       → Shopping bag
/checkout                   → Checkout form
/confirm-order              → Email confirmation handler (?token=)
/blog                       → Blog article list
/blog/:postId               → Single blog article
/about                      → About Kifayat
/contact                    → Contact page
/faq                        → FAQ
/privacy                    → Privacy Policy
/terms                      → Terms & Conditions
/return-policy              → Return & Refund Policy
/shipping-policy            → Shipping Policy
/auth                       → Auth gateway
/login                      → Login
/register                   → Register
/account                    → Account dashboard layout
/account/orders             → Order history
/account/wishlist           → Saved products
/account/addresses          → Saved addresses
/account/reviews            → User's product reviews
/account/payment-methods    → Payment methods
/_authenticated/admin       → Admin panel (auth-guarded)
```

### Search Param Validation

`/search` validates all search params via `validateSearch`:
```ts
{
  q: string,
  sort: string,       // "relevance" | "newest" | "price_asc" | "price_desc" | "rating"
  brand: string,
  min_price: number | undefined,
  max_price: number | undefined,
  min_rating: number | undefined,
  page: number
}
```

### Loaders

`/products/:productId` uses a TanStack Router loader that calls `getProductById(params.productId)` before the component renders. If the product is not found, `notFound()` is thrown.

`/blog/:postId` uses a loader that finds the post from the static `blogPosts` array.

---

## 4. Design System

### 4.1 Typography

| Token | Font | Usage |
|-------|------|-------|
| `font-display` | Syne (wght 400–800) | Headings, hero titles, editorial text |
| `font-sans` | Plus Jakarta Sans (wght 300–800) | Body text, labels, UI copy |
| `font-mono` | JetBrains Mono (wght 400–500) | Prices, numbers, code |

Custom utility class: `eyebrow` — small-caps tracking for section labels (e.g. `§ About this product`).

### 4.2 Color Palette

Defined as CSS custom properties in `src/styles/index.css` via `@theme inline`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-coal` | `#1a1a1a` | Primary text, dark backgrounds |
| `--color-bone` | `#f5f0e8` | Page background, light surfaces |
| `--color-brass` | `#b8973c` | Accent color — CTAs, highlights, stars |
| `--color-paper` | `#fafaf8` | Product image backgrounds |
| `--color-primary-dark` | | Dark brand variant |
| `--color-primary-soft` | | Soft brand variant |
| `--color-emerald-deep` | | In-stock indicator |

In Tailwind classes: `text-coal`, `bg-bone`, `text-brass`, `bg-brass`, `bg-paper`.

### 4.3 Shadows & Radii

| Token | Value |
|-------|-------|
| `--shadow-e1` | Subtle card shadow |
| `--shadow-e2` | Medium elevation |
| `--shadow-e3` | High elevation (modals) |
| `--radius-pill` | `9999px` (full round) |

### 4.4 Tailwind Config

Tailwind v4 using the `@tailwindcss/vite` plugin. Configuration is CSS-first — all tokens declared in `src/styles/index.css`, no `tailwind.config.js` file. Custom utilities like `eyebrow` are defined with `@utility`.

---

## 5. Component Library

### 5.1 PageShell

The universal layout wrapper. Every public-facing page should be wrapped in `<PageShell>`.

**Renders:**
- `<SideDrawer />` (mobile navigation overlay)
- `<BlendCursor />` (custom cursor on desktop)
- `<Header />` (top nav)
- `<main>{children}</main>`
- `<Footer />`
- `<MobileNav />` (bottom bar on mobile)

Framer Motion layout animation applied when the side drawer is open (nudges main content).

### 5.2 Header

- Logo linking to `/`
- Search bar (`/search?q=`)
- Category navigation links (Beauty, Electronics, Fashion, Home & Kitchen, Sports, Toys, All Deals)
- Sign In / account icon (auth-aware)
- Cart icon with item count badge
- Language / currency selector (EN · PKR)

### 5.3 ProductCard

Used in all product grids (homepage, category, search, similar products).

**Props:**
```ts
{
  p: {
    slug?: string
    name: string
    brand?: string
    price: number
    oldPrice?: number
    image: string
    badge?: string
  }
  index?: number   // for staggered animation delay
}
```

**Behaviour:**
- Links to `/products/${slug || id}`
- Shows discount badge if `oldPrice` present
- Image: lazy loaded, `object-contain`, hover scale
- Falls back to large italic first-letter if no image

### 5.4 LegalPage

Shared layout for all policy pages (Privacy, Terms, Return Policy, Shipping Policy).

**Props:**
```ts
{
  title: string
  subtitle: string
  effectiveDate: string
  related: { label: string; to: string }[]
  sections: {
    heading: string
    body: string | string[]
    callout?: string
  }[]
}
```

### 5.5 Reveal

Scroll-triggered animation wrapper using Framer Motion `whileInView`.

**Props:** `delay?: number`, `className?: string`, standard HTML div props.

### 5.6 ZoomImage

Hover-to-zoom product image. Mouse position tracked to calculate zoom origin.

### 5.7 ReviewsAndQA

Product reviews section. Fetches reviews via `listProductReviews(productId)`. Shows star distribution, individual review cards, and a "Write a review" form (auth-gated).

---

## 6. State Management

### 6.1 Auth Store (`lib/auth-store.ts`)

Hook-based store — no external library.

```ts
const { user, loading } = useAuth()
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `loading` | `boolean` | Auth check in progress |

**On mount:** calls `GET /api/auth/me` to restore session from the httpOnly cookie.

**`signOut()`** — calls `POST /api/auth/logout`, clears local state, redirects to `/`.

**`refreshAuth()`** — re-fetches `/api/auth/me`.

### 6.2 Cart Store (`lib/cart-store.ts`)

localStorage-backed. No server sync during browsing — only validated against the backend at checkout via `POST /api/cart/validate`.

```ts
// Add item
cart.add({ product_id, slug, name, brand, price, image, qty })

// Remove
cart.remove(product_id)

// Clear
cart.clear()

// Read (reactive)
const { items, totalItems, totalPrice } = useCart()
```

**`refreshCartPrices()`** — calls `POST /api/cart/validate`, updates prices if the backend reports changes.

### 6.3 UI Store (`lib/ui-store.ts`)

Global UI flags:
- `drawerOpen` / `setDrawerOpen` — side navigation drawer
- Any other transient UI state shared across components

### 6.4 TanStack Query

All server data is fetched and cached through TanStack Query. Common query keys:

| Key | Fetches |
|-----|---------|
| `["products"]` | Product listing |
| `["product", productId]` | Single product |
| `["similar", productId]` | Similar products |
| `["categories"]` | Category list |
| `["search", searchParams]` | Search results |
| `["reviews", productId]` | Product reviews |

`staleTime` is set per-query (e.g. categories: 5 min).

---

## 7. API Layer

### 7.1 Axios Instance (`lib/api.ts`)

```ts
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,   // sends httpOnly cookie on every request
})
```

All API calls are relative `/api/*` — Vite proxies them to `localhost:3001` in dev.

### 7.2 `shop.functions.ts`

| Function | Method + Path | Description |
|----------|--------------|-------------|
| `listCategories()` | `GET /products/categories` | All category objects |
| `listProducts(params)` | `GET /products` | Paginated, filterable product list |
| `getProductById(id)` | `GET /products/:id` | Single product by ID or slug |
| `getProductBySlug(slug)` | `GET /products/:slug` | Single product by slug |
| `getSimilarProducts(id)` | `GET /products/:id/similar` | Related products |
| `createOrder(payload)` | `POST /orders/place` | Place order |
| `getShipmentEmails()` | `GET /auth/shipment-emails` | User's verified shipment emails |

### 7.3 `search.functions.ts`

| Function | Method + Path | Description |
|----------|--------------|-------------|
| `searchProducts(params)` | `GET /products` (with `search=`) | Full-text search with filters |
| `searchSuggest(q)` | `GET /products?search=q&limit=5` | Autocomplete suggestions |

### 7.4 `reviews.functions.ts`

| Function | Method + Path | Description |
|----------|--------------|-------------|
| `listProductReviews(productId)` | `GET /reviews/product/:productId` | All reviews for a product |
| `submitReview(payload)` | `POST /reviews` | Submit a new review |
| `deleteMyReview(productId)` | `DELETE /reviews/:productId` | Delete own review |

### 7.5 `account.functions.ts`

| Function | Description |
|----------|-------------|
| `listWishlist()` | Returns saved product IDs from localStorage |
| `toggleWishlist(productId)` | Add/remove from localStorage wishlist |
| `isWishlisted(productId)` | Check if product is in wishlist |
| `recordRecentlyViewed(productId)` | Appends to localStorage recently-viewed list |
| `listAddresses()` | Reads saved addresses from localStorage |
| `upsertAddress(address)` | Save/update address in localStorage |
| `deleteAddress(id)` | Remove address from localStorage |

### 7.6 `admin.functions.ts`

Used exclusively by the admin panel. Key functions:

| Function | Method + Path | Description |
|----------|--------------|-------------|
| `adminDashboardStats()` | `GET /products/stats` | Product and order counts |
| `adminListProducts(params)` | `GET /products/leaderboard` | All products (admin view) |
| `adminUpdateProduct(id, data)` | `PUT /products/:id` | Edit product fields |
| `adminListOrders()` | `GET /orders` | All orders |
| `adminUpdateOrderStatus(id, status)` | `PATCH /orders/:id/status` | Change order status |
| `adminListUsers()` | `GET /admin/users` | All users |
| `adminDeleteUser(id)` | `DELETE /admin/users/:id` | Delete user |
| `triggerSync(token, mode)` | `POST /hhc-proxy/sync-all` | Trigger HHC sync |
| `stopSync()` | `POST /hhc-proxy/sync-stop` | Abort sync |

---

## 8. Authentication

### 8.1 Email / OTP Flow

```
Register:  POST /auth/register → OTP email sent
Verify:    POST /auth/verify-otp → JWT cookie set, user returned
Login:     POST /auth/login → JWT cookie set, user returned
Logout:    POST /auth/logout → Cookie cleared
```

### 8.2 Google Auth

```
1. Firebase SDK opens Google popup
2. Get idToken from Firebase result
3. POST /auth/google { idToken }
4. Backend verifies with Firebase Admin SDK
5. JWT httpOnly cookie set → user returned
```

Firebase app config is read from environment variables set in Vite (`VITE_*`). The Firebase project used for auth is `kifayat--auth-data` (separate project from the Firestore/data project).

### 8.3 Protected Routes

`/_authenticated/` routes check `useAuth()` on render. If `user` is null (after loading resolves), they redirect to `/login`.

Admin panel additionally checks `user.role === "admin"`.

---

## 9. Cart System

The cart is **entirely client-side** (localStorage). There is no server-side cart session.

### 9.1 Cart Item Shape

```ts
{
  product_id: string
  slug: string
  name: string
  brand?: string
  price: number       // price at time of adding
  image: string
  qty: number
}
```

### 9.2 Price Staleness

When the user reaches the checkout page, `refreshCartPrices()` is called automatically. It sends the current cart to `POST /api/cart/validate`, which returns:

```json
{
  "valid": boolean,
  "items": [{ "product_id": "...", "price": 1200, "inStock": true }],
  "changes": [{ "product_id": "...", "oldPrice": 1000, "newPrice": 1200 }]
}
```

If prices have changed, the cart is updated and the user is notified via a toast.

### 9.3 Add to Cart Animation

`flyToCart(imageUrl, anchorElement)` is called when a product is added. It:
1. Creates a temporary `<img>` clone at the product image position
2. Animates it flying to the cart icon in the header using CSS transitions
3. Removes the clone and triggers a cart count bump animation

---

## 10. SEO System

### 10.1 SEO Component (`components/seo/SEO.tsx`)

Every route renders `<SEO ... />` as the first child. It uses `react-helmet-async` to inject:

- `<title>` — `${title} | Kifayat` or full brand title
- `<meta name="description">`
- `<meta name="keywords">` (optional)
- `<link rel="canonical">`
- `<meta name="robots">` — `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` (or `noindex, nofollow` for private pages)
- `<link rel="alternate" hrefLang="en-PK">` and `x-default`
- Full Open Graph set: `og:type`, `og:site_name`, `og:locale`, `og:locale:alternate` (ur_PK), `og:url`, `og:title`, `og:description`, `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width/height/alt`
- Twitter Card: `summary_large_image`, `twitter:site` (@kifayatpk), `twitter:creator`
- Article-specific: `article:published_time`, `article:modified_time`, `article:author`, `article:section`, `article:tag`
- Product-specific (Open Graph commerce): `product:price:amount`, `product:price:currency`, `product:availability`

**Constants:**
```ts
export const SITE_URL = "https://kifayat.com"
export const SITE_NAME = "Kifayat"
export const TWITTER_HANDLE = "@kifayatpk"
```

### 10.2 JSON-LD Schemas (`components/seo/JsonLd.tsx`)

| Schema Component | Used On | Schema Type |
|-----------------|---------|-------------|
| `HomepageGraphSchema` | `/` | `@graph` — WebSite + Organization + WebPage |
| `WebSiteSchema` | Standalone | `WebSite` with `SearchAction` (Sitelinks Searchbox) |
| `OrganizationSchema` | Standalone | `Organization` with logo, address, `sameAs` social links |
| `ProductSchema` | `/products/:id` | `Product` with `Offer`, `AggregateRating`, `shippingDetails`, `hasMerchantReturnPolicy` |
| `BreadcrumbSchema` | Products, category, blog | `BreadcrumbList` |
| `CollectionPageSchema` | `/category/:slug` | `CollectionPage` |
| `ItemListSchema` | Category, search | `ItemList` with embedded `Product` items |
| `SearchResultsPageSchema` | `/search` | `SearchResultsPage` |
| `ArticleSchema` | `/blog/:id` | `Article` with publisher, `isPartOf` |
| `FAQSchema` | `/faq` | `FAQPage` |
| `LocalBusinessSchema` | `/contact` | `OnlineStore` with geo, hours, `areaServed` |
| `WebPageSchema` | About, Contact | `WebPage` / `AboutPage` / `ContactPage` |

**ProductSchema Google Shopping signals:**
```json
{
  "shippingDetails": {
    "@type": "OfferShippingDetails",
    "shippingRate": { "value": 0, "currency": "PKR" },
    "deliveryTime": { "handlingTime": "0–1 day", "transitTime": "2–5 days" }
  },
  "hasMerchantReturnPolicy": {
    "@type": "MerchantReturnPolicy",
    "merchantReturnDays": 7,
    "returnMethod": "ReturnByMail",
    "returnFees": "FreeReturn"
  }
}
```

### 10.3 Sitemaps

All sitemap XML is served by the **backend** (not the frontend). The frontend has a dummy `routes/sitemap[.]xml.ts` to prevent TanStack Router from trying to handle `/sitemap.xml`.

| URL | Description |
|-----|-------------|
| `/sitemap.xml` | Sitemap index |
| `/sitemap-pages.xml` | Static routes (home, products, blog, legal) |
| `/sitemap-products.xml` | All in-stock products (dynamic) |
| `/sitemap-categories.xml` | All categories (dynamic) |
| `/image-sitemap.xml` | Product images with `image:title` and `image:caption` |

### 10.4 Robots

`/public/robots.txt` (static) and `/robots.txt` (backend dynamic, takes precedence) both include:
- Per-bot `Allow`/`Disallow` rules for Googlebot, Googlebot-Image, Bingbot, Yandex
- Block rules for GPTBot, CCBot, anthropic-ai
- All 5 sitemap URLs

### 10.5 `index.html` Performance

- Critical Syne font subset (wght 700/800) preloaded as style (`rel="preload" as="style"`)
- Full font stack loaded non-blocking (`media="print"` → `onload` → `media="all"`)
- `<noscript>` fallbacks for both font loads
- `dns-prefetch` + `preconnect` for Google Fonts
- `og:image:secure_url`, `og:image:type`, `twitter:image:alt` in HTML defaults
- Mobile PWA meta: `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `application-name`

---

## 11. Real-time (Socket.IO)

### 11.1 Client Setup (`lib/socket.ts`)

Single Socket.IO client instance. Connects to the same origin (proxied to backend port 3001 via `/socket.io` Vite proxy rule).

### 11.2 Events

| Event | Direction | Handler |
|-------|-----------|---------|
| `products_updated` | Server → Client | `useRealtimeProducts` hook re-fetches product list |
| `product_deleted` | Server → Client | Removes product from TanStack Query cache |
| `pricing_updated` | Server → Client | `usePricingSync` hook calls `refreshCartPrices()` |
| `products_cleared` | Server → Client | Clears product query cache |
| `hhc_progress` | Server → Client | Admin panel appends to sync log |
| `sync_complete` | Server → Client | Admin panel updates summary, re-enables buttons |

---

## 12. Admin Panel

The admin panel lives at `/_authenticated/admin` (TanStack Router auth-guarded route).

### 12.1 Access

Only users with `role === "admin"` can access. The `ADMIN_EMAILS` env var on the backend auto-promotes listed emails to admin on login.

### 12.2 Sections

| Section | Description |
|---------|-------------|
| **Dashboard** | Stats bar: total products, categories, orders, revenue |
| **Products (Leaderboard)** | All products sorted by sales. Search by name/SKU. Inline edit, visibility toggle, delete |
| **Product Edit Modal** | Name, description, stock, weight, image URL, video URL, wholesale price, retail price |
| **HHC Sync** | Bearer token input, Quick Fetch, Sync All (with page count), Stop button, real-time progress log |
| **Orders** | PreOrder list with filter/status. Finalize → moves to MainOrderCSVData |
| **CSV Download** | Downloads pending orders as HHC-formatted CSV, archives to OrderHistory |
| **Pricing** | Global markup % slider/input applied to all products |
| **CSV Upload** | Bulk import products from CSV file |
| **Monthly Report** | Top sold products, period dates, auto-generates every 30 days |
| **User Management** | List all users, change roles, delete users |
| **Activity Log** | Chronological feed of all admin actions |

### 12.3 Admin Functions

All admin API calls go through `lib/admin.functions.ts`. Key patterns:
- Products: read from `/products/leaderboard` (returns all, including hidden)
- Orders: `/orders` (admin view, all statuses)
- CSV export: `GET /admin/export-csv` (atomic claim + download + archive in one request)
- HHC sync state is managed via Socket.IO events (`hhc_progress`, `sync_complete`)

---

## 13. Page Reference

### Homepage (`/`)

**Components:** Hero, FlashDeals, Products, ValueStrip, Categories, EditStory, Testimonials, Lookbook, PressStrip, Journal, FounderLetter, LiveStats, Newsletter

**SEO:** `HomepageGraphSchema` (`@graph` WebSite + Organization + WebPage), title targeting "Online Shopping in Pakistan"

---

### Product Detail (`/products/:productId`)

**Loader:** `getProductById(productId)` — throws `notFound()` if missing.

**Layout:** 3-column grid on desktop (image gallery | description + specs | sticky buy box)

**Features:**
- Hover-to-zoom image (`ZoomImage`)
- Full-screen lightbox (lazy-loaded `Lightbox`)
- Expandable bullet-parsed description (collapse at 6 bullets)
- Similar products grid (from `getSimilarProducts`)
- Add to cart with fly animation
- Wishlist toggle (localStorage)
- Share via Web Share API or clipboard copy
- Delivery date estimate (business days from now)

**SEO:** `ProductSchema` (with shipping + return policy for Google Shopping), `BreadcrumbSchema`, product price meta

---

### Category Page (`/category/:slug`)

**Features:** Sticky search bar inside category, desktop sidebar with sort + price range slider + other categories, mobile filter panel, product grid

**SEO:** `CollectionPageSchema`, `BreadcrumbSchema`, `ItemListSchema` (with embedded Product types)

---

### Search Page (`/search`)

**Search params validated by TanStack Router:** `q`, `sort`, `brand`, `min_price`, `max_price`, `min_rating`, `page`

**noindex:** if `q` is empty

**SEO:** `SearchResultsPageSchema` when query present

---

### Legal Pages

All four legal pages (`/privacy`, `/terms`, `/return-policy`, `/shipping-policy`) use `<LegalPage>` component with structured `sections` prop. Each section can have an optional `callout` box (highlighted warning/notice) and a `body` that is either a string or string array (rendered as bullet list).

---

### Blog

`/blog` — static list from `lib/shop-data.ts` (hardcoded `blogPosts` array).

`/blog/:postId` — `ArticleSchema` + `BreadcrumbSchema`. Article body is placeholder content.

---

### Account Pages

All `/account/*` routes require authentication. They use a shared account layout with a sidebar navigation.

| Route | Content |
|-------|---------|
| `/account/orders` | Order history from `GET /orders/my` |
| `/account/wishlist` | Saved products from localStorage |
| `/account/addresses` | Saved addresses from localStorage |
| `/account/reviews` | Reviews submitted by this user |
| `/account/payment-methods` | Saved payment methods |

---

### Confirm Order (`/confirm-order`)

Reads `?token=` from query string. Calls `GET /api/orders/confirm/:token`.

States:
- **Loading** — spinner while request is in flight
- **Success** — order confirmed, links to account/orders
- **Expired** — token past 10-min window
- **Error** — unexpected failure

---

## 14. Environment Variables

All `VITE_*` variables are embedded into the client bundle at build time.

| Variable | Used In | Description |
|----------|---------|-------------|
| `VITE_SITE_URL` | `SEO.tsx`, `JsonLd.tsx` | Canonical base URL for meta tags |
| `VITE_SITE_NAME` | SEO defaults | Site name in meta tags |
| `VITE_CONTACT_EMAIL` | Footer, Contact page, JSON-LD | Public support email |
| `VITE_CONTACT_PHONE` | Footer, Contact page, JSON-LD | Public phone number |
| `VITE_STORE_ADDRESS` | JSON-LD LocalBusiness | Physical address string |
| `VITE_STORE_CITY` | JSON-LD LocalBusiness | City (e.g. Karachi) |

**Note:** Firebase config for Google Auth comes from the Firebase SDK initialization (handled by `firebaseAdmin.js` on the backend; the frontend uses popup-based auth, so only the public Firebase config keys are needed, typically embedded directly or via env vars).

---

## 15. Build & Dev Setup

### Dev (Replit)

Two workflows run in parallel:

| Workflow | Command | Port |
|----------|---------|------|
| Backend | `cd kifayat-backend && npm install && PORT=3001 node server.js` | 3001 (internal) |
| Frontend | `cd kifayat-frontend && npm install --include=dev && npm run dev` | 5000 → 80 (external) |

Preview the app at the Replit dev URL (external port 80 = frontend).

### Vite Proxy

```ts
// vite.config.ts
server: {
  host: "0.0.0.0",
  port: 5000,
  strictPort: true,
  allowedHosts: true,
  proxy: {
    "/socket.io": { target: "http://localhost:3001", ws: true },
    "/api": {
      target: "http://localhost:3001",
      configure: (proxy) => {
        // Rewrite Secure + SameSite=None on Set-Cookie so httpOnly
        // cookies work through the HTTP dev proxy
        proxy.on("proxyRes", (proxyRes) => {
          const setCookie = proxyRes.headers["set-cookie"]
          if (setCookie) {
            proxyRes.headers["set-cookie"] = setCookie.map(c =>
              c.replace(/;\s*Secure/gi, "")
               .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
            )
          }
        })
      }
    }
  }
}
```

### Build

```bash
cd kifayat-frontend
npm run build      # outputs to dist/
npm run preview    # preview production build locally
```

TanStack Router auto-generates `src/routeTree.gen.ts` on `vite dev` and `vite build`.

### TypeScript

`tsconfig.json` with `paths` alias: `@/*` → `./src/*` (resolved by `vite-tsconfig-paths` plugin). Strict mode enabled.

---

## Appendix — Key Third-Party Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `react` | 19 | UI framework |
| `vite` | 7 | Build tool + dev server |
| `@tanstack/react-router` | latest | File-based type-safe routing |
| `@tanstack/react-query` | latest | Server state, caching, refetching |
| `react-helmet-async` | latest | Per-route `<head>` management |
| `framer-motion` | latest | Page transitions, scroll animations |
| `lenis` | latest | Smooth scroll |
| `tailwindcss` | 4 | Utility CSS |
| `@tailwindcss/vite` | 4 | Tailwind Vite plugin |
| `@radix-ui/*` | latest | Headless accessible UI primitives |
| `sonner` | latest | Toast notifications |
| `socket.io-client` | latest | Real-time updates |
| `lucide-react` | latest | Icon library |
| `recharts` | 2 | Charts in admin analytics |
| `firebase` | latest | Google Auth popup |
| `axios` | latest | HTTP client |
| `vite-tsconfig-paths` | latest | `@/` path alias in Vite |
