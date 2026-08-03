# Kifayat — Pakistan's Editorial Marketplace

A full-stack e-commerce platform with an editorial storefront, a complete admin suite, and an AI-driven catalog pipeline. The frontend is a React 19 + Vite single-page app with TanStack Router and React Query; the backend is an Express 5 + MongoDB (Mongoose) API with real-time Socket.IO updates and a production admin console.

---

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  kifayat-frontend       │  HTTP  │  kifayat-backend         │
│  React 19 · Vite ·      │ ─────► │  Express 5 · Mongoose ·  │
│  TanStack Router ·      │  /api  │  Socket.IO · Firebase ·  │
│  React Query · Tailwind │ ◄───── │  Resend · Cloudinary     │
└─────────────────────────┘  :5000 └──────────┬───────────────┘
                                              │
                                    MongoDB Atlas (Mongoose)
```

- **Frontend** — `kifayat-frontend/` (port **5000** in dev, Vite dev server)
- **Backend** — `kifayat-backend/` (port **3001** in dev, `nodemon`)
- Dev proxy: Vite forwards `/api`, `/uploads` and `/socket.io` (WebSocket) to `http://localhost:3001`.

---

## Features

### Storefront
- Editorial landing page (hero, curated picks, flash deals, lookbook, founder letter, newsletter)
- Full catalogue with category pages, search, and natural-language product detail pages
- Product detail: image gallery + lightbox, video support, HHC variation selector, similar products
- **Wishlist** (localStorage-backed, login-aware) with wishlist page and quick add-to-bag
- **Cart** with backend price + stock re-validation on every open, self-healing product ids, and stock warnings
- **Checkout** — Cash on Delivery (Pakistan-wide), address autocomplete, order confirmation flow
- Accounts: register/login (email OTP + JWT sessions), order history, addresses, payment methods, vouchers, reviews
- Reviews & Q&A per product, SEO (sitemap, JSON-LD, per-route meta)

### Stock & Catalog Intelligence
- **Variation-aware availability** — when HHC variations exist they are the single source of truth for stock; every customer endpoint (`products`, `product detail`, `similar`, `featured`) reports the same `inStock` flag
- Out-of-stock products are surfaced consistently everywhere (cards, cart, search, wishlist, product page)
- HHC product dynamic-data sync, slug API (`GET /api/products/:slug-or-id`), resumable variation backfill script
- AI copy optimization for the catalog with a **key-pool router** (Groq + Gemini multi-key pools, Gemini-first fast path with Groq fallback, batch splitting)

### Admin Suite (`/admin`)
- Dashboard with live stats, orders (CSV export, pre-orders, cancellations), product management (CSV upload, pricing, categories, out-of-stock management)
- Users, vouchers/compensation, reviews moderation, defective-product reports, website reviews, activity logs
- **AI Studio** — pool status monitor, live health of all Gemini/Groq keys
- Realtime socket events (e.g. `product_out_of_stock`) pushed to the UI

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, TypeScript, TanStack Router, TanStack Query, Tailwind CSS 4, Framer Motion, Lenis smooth scroll, Lucide icons, shadcn/ui-style Radix components, Recharts, Leaflet, Sonner, Socket.IO client |
| Backend | Node.js, Express 5, Mongoose 9 (MongoDB Atlas), Socket.IO, JSON Web Tokens, bcrypt, Firebase Admin, Resend/Nodemailer, Groq SDK, `csv-parser`/`xlsx`/`json2csv`, `node-cron`, Multer, Cloudinary, rate limiting, helmet |
| Dev tooling | Vite dev proxy, nodemon, ESLint, Prettier, TypeScript strict |

---

## Getting Started

Prerequisites: **Node.js 18+** and **npm**. MongoDB is expected at the connection string in the backend env (Atlas works — no local mongod needed).

### 1. Backend

```bash
cd kifayat-backend
npm install
cp .env.example .env   # fill in the values (see Env Variables)
npm run dev            # nodemon → http://localhost:3001
```

### 2. Frontend

```bash
cd kifayat-frontend
npm install
cp .env.example .env.local   # fill in VITE_* values
npm run dev                  # Vite → http://localhost:5000
```

Open `http://localhost:5000`.

> Note: the repository deliberately commits the live `.env` and `firebase-service-account.json` (only `node_modules/` is ignored). Rotate credentials before any public fork.

### Production

```bash
cd kifayat-frontend && npm run build   # outputs dist/
cd kifayat-backend  && npm start       # serves API (and can serve dist/)
```

---

## Env Variables

### Backend (`kifayat-backend/.env`)
| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 3001) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Token signing secret |
| `FIREBASE_*` | Firebase admin credentials (or via `firebase-service-account.json`) |
| `RESEND_API_KEY` / SMTP | Transactional email |
| `GROQ_API_KEY` / `GEMINI_API_KEY` | AI copy pipeline (multi-key pools read additional keys from env; see `utils/groqKeyPool.js`, `utils/geminiPool.js`) |
| `CLOUDINARY_*` | Image CDN |
| `CORS_ORIGIN` | Allowed frontend origin |

### Frontend (`kifayat-frontend/.env.local`)
| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE` | API base URL (default `/api` via dev proxy) |
| `VITE_FIREBASE_*` | Firebase web config |
| `VITE_GOOGLE_MAPS_API_KEY` | Address autocomplete |

See `.env.example` in each folder for the full list.

---

## Project Layout

```
├── kifayat-backend/
│   ├── controllers/        # Express route handlers (auth, product, cart, order, admin, AI…)
│   ├── routes/             # API route definitions
│   ├── models/             # Mongoose models (User, Product, Order, PreOrder, Cart, Review…)
│   ├── middleware/         # auth (protect), optionalAuth, adminProtect, rate limiters
│   ├── utils/              # JWT, email, OTP, key pools, out-of-stock manager, categorize…
│   ├── config/             # DB, Firebase admin, tiers
│   ├── scripts/            # backfill + maintenance scripts (backfill_variations, bulk_fetch_dynamic…)
│   └── server.js           # app entry (Express + Socket.IO)
└── kifayat-frontend/
    ├── src/
    │   ├── routes/         # TanStack Router file routes (pages + admin panels)
    │   ├── components/     # UI components (landing, shop, motion, ui, seo)
    │   ├── lib/            # API clients, stores (cart, wishlist, auth), helpers
    │   ├── hooks/          # realtime sync, pricing sync, active time
    │   └── styles/         # CSS (index.css, auth.css, dashboard.css)
    └── vite.config.ts      # dev proxy, Tailwind, TanStack plugin
```

---

## Useful Scripts

```bash
# Backend (run from kifayat-backend/)
node scripts/backfill_variations.js          # resumable HHC variation backfill (--limit, --concurrency)
node scripts/bulk_fetch_dynamic.js           # bulk HHC dynamic-data refresh
node scripts/refresh_all_dynamic.js          # refresh all dynamic data
node scripts/benchmark_groq_pool.js          # AI pool benchmark
```

---

## License

ISC — see `kifayat-backend/package.json`.
