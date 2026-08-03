# Kifayat Backend — Complete Documentation

> **Last updated:** July 2026
> **Stack:** Node.js · Express v5 · MongoDB (Mongoose) · Socket.IO · Firebase Admin SDK
> **Auth:** JWT (httpOnly cookie) + Firebase Google Auth
> **Email:** Resend (primary) · Nodemailer/Gmail (fallback)
> **External API:** HHC Dropshipping

---

## Part 1 — Original System Documentation (from GitHub)

> This section reproduces the original `SYSTEM_DOCUMENTATION.md` from the Kifayat repository verbatim.

---

# Kifayat System — Complete Documentation

> **Last updated:** July 2026
> **Stack:** MERN (MongoDB, Express, React, Node.js) with Socket.IO
> **Auth:** JWT + Firebase Google Auth
> **External API:** HHC Dropshipping

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Structure](#2-backend-structure)
3. [Frontend Structure](#3-frontend-structure)
4. [Database Models](#4-database-models)
5. [Authentication Flow](#5-authentication-flow)
6. [Product Sync (HHC API)](#6-product-sync-hhc-api)
7. [Cart & Checkout Flow](#7-cart--checkout-flow)
8. [Order Lifecycle](#8-order-lifecycle)
9. [CSV Export Format](#9-csv-export-format)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Real-time Updates (Socket.IO)](#11-real-time-updates-socketio)
12. [Email System](#12-email-system)
13. [Image/Video Handling](#13-imagevideo-handling)
14. [API Endpoints Reference](#14-api-endpoints-reference)

---

## 1. Architecture Overview

```
┌──────────────────────┐       ┌──────────────────────┐
│   React Frontend     │       │   Express Backend    │
│   (Vite + React)     │◄─────►│   (Node.js)          │
│                      │  HTTP │                      │
│   Port: 5173         │       │   Port: 5000         │
├──────────────────────┤       ├──────────────────────┤
│  - Dashboard         │       │  - Auth (JWT)        │
│  - Product Detail    │       │  - Products CRUD     │
│  - Cart/Checkout     │       │  - Orders            │
│  - Admin Panel       │       │  - HHC Sync          │
│  - Profile           │       │  - CSV Export        │
└──────────────────────┘       │  - Reviews           │
                               │  - Cart              │
        ┌──────────┐           └──────────┬───────────┘
        │ Socket.IO│◄──── real-time ──────┤
        │ Events   │                      │
        └──────────┘                      ▼
                                  ┌──────────────┐
                                  │   MongoDB     │
                                  │  (Mongoose)   │
                                  └──────────────┘

                                  ┌──────────────┐
                                  │  HHC API      │
                                  │ (External)    │
                                  └──────────────┘
```

---

## 2. Backend Structure

```
kifayat-backend/
├── server.js                 # Entry point, MongoDB connect, Socket.IO setup
├── .env                      # Environment variables
│
├── models/                   # Mongoose schemas
│   ├── Product.js
│   ├── User.js
│   ├── Order.js
│   ├── OrderHistory.js
│   ├── PreOrder.js
│   ├── ShippingDetail.js
│   ├── MainOrderCSVData.js
│   ├── ConfirmationGap.js
│   ├── CancelledOrders.js
│   ├── Cart.js
│   ├── Review.js
│   ├── Category.js
│   ├── Settings.js
│   ├── OutOfStockDeletedProduct.js
│   └── PriceDiagnostic.js
│
├── controllers/
│   ├── authController.js     # Login, register, profile, shipment emails
│   ├── productController.js  # CRUD, upload CSV, leaderboard, reports, sort
│   ├── orderController.js    # Place order, finalize, confirm, ConfirmationGap
│   ├── cartController.js     # Add/remove/clear cart items
│   ├── reviewController.js   # Create/read reviews, adminGetByProduct
│   ├── csvExportController.js# Download MainOrderCSVData as HHC CSV
│   ├── hhcApiController.js   # Sync products from HHC external API
│   ├── userController.js     # Admin user management (CRUD)
│   └── diagnosticController.js# Price diagnostic tool
│
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── cartRoutes.js
│   ├── reviewRoutes.js
│   ├── adminRoutes.js        # Export CSV, bulk pricing, clear products
│   ├── hhcApiRoutes.js       # Sync endpoints
│   ├── userRoutes.js
│   └── diagnosticRoutes.js
│
├── middleware/
│   ├── auth.js               # JWT verification
│   └── adminProtect.js       # Admin role check
│
└── utils/
    ├── email.js              # Nodemailer — OTP, confirmation, welcome
    ├── otp.js                # OTP generation, hashing, expiry
    └── outOfStockManager.js  # Schedules & executes out-of-stock deletion
```

---

## 3. Frontend Structure

```
kifayat-frontend/src/
├── main.jsx                  # React entry, HelmetProvider
├── App.jsx                   # Routes, AuthProvider, CartProvider, ToastProvider
│
├── pages/
│   ├── Dashboard.jsx         # Customer product listing, search, sort, pagination
│   ├── ProductDetail.jsx     # Single product view, add to cart, reviews
│   ├── Cart.jsx              # Cart items, checkout, email selection, OTP
│   ├── OrderConfirmation.jsx # "Check your email" page with 10-min countdown
│   ├── ConfirmOrder.jsx      # Email confirmation link handler
│   ├── AdminDashboard.jsx    # Full admin panel (~4400 lines)
│   ├── Profile.jsx           # User profile, email change, password
│   ├── Login.jsx             # Email/password + Google login
│   ├── Signup.jsx            # Registration
│   └── NotFound.jsx          # 404
│
├── components/
│   ├── ProductCard.jsx       # Product card for grid display
│   ├── UserManagement.jsx    # Admin user management sub-component
│   └── StarRating.jsx        # Star rating display
│
├── context/
│   ├── AuthContext.jsx       # Auth state, login/logout, token management
│   ├── CartContext.jsx       # Cart state, add/remove/sync with backend
│   └── ToastContext.jsx      # Toast notification system
│
├── services/
│   ├── api.js                # All API calls (axios-based)
│   └── socket.js             # Socket.IO client
│
├── config/
│   └── firebase.js           # Firebase config for Google Auth
│
├── styles/
│   └── dashboard.css         # Dashboard-specific styles
│
└── seo/
    ├── index.jsx             # SeoHead component
    └── SeoHead.jsx           # Meta tags, JSON-LD structured data
```

---

## 4. Database Models

### 4.1 Product (`models/Product.js`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `productId` | String | `""` | External product ID from HHC |
| `sku` | String | `""` | Stock keeping unit |
| `name` | String (required) | — | Product name |
| `slug` | String | `""` | URL-friendly name |
| `description` | String | `""` | Product description |
| `wholesalePrice` | Number (min:0) | `0` | Cost price (hidden from customers) |
| `retailPrice` | Number (min:0) | `0` | Selling price |
| `stock` | Number (min:0) | `0` | Current stock quantity |
| `originalStock` | Number (min:0) | `0` | Initial stock at import time |
| `category` | String | `"Uncategorized"` | Product category |
| `imageUrl` | String | `""` | Image URL (or video URL detected via extension) |
| `videoUrl` | String | `""` | Explicit video URL |
| `weight` | Number (min:0) | `0` | Weight in kg |
| `salesCount` | Number (min:0) | `0` | Total units sold |
| `uploadBatch` | String | `""` | Batch identifier from CSV upload |
| `newProduct` | Boolean | — | `true` during sync, removed after cleanup |
| `hidden` | Boolean | `false` | If `true`, hidden from customer dashboard |
| `rawData` | Mixed | `{}` | Full API response preserved for debugging |
| `createdAt` | Date (auto) | — | Timestamp |
| `updatedAt` | Date (auto) | — | Timestamp |

**`toCustomerProduct()`** sanitizes before sending to customers:
- Adds `inStock` (`stock > 0`)
- Removes `stock`, `newProduct`, `rawData`, `hidden`, `wholesalePrice`

### 4.2 User (`models/User.js`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (required) | Full name |
| `email` | String (unique) | Login email |
| `password` | String | Hashed password (not for Google users) |
| `authProvider` | String | `"email"` or `"google"` |
| `role` | String | `"user"` or `"admin"` |
| `shipmentEmails` | [String] | Verified emails for order confirmations |
| `phone` | String | Phone number |
| `gender` | String | Gender |
| `createdAt` | Date | Timestamp |

### 4.3 Order (`models/Order.js`)

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId → User | Customer who placed the order |
| `items` | [Object] | `{ product, name, price, quantity, image }` |
| `totalAmount` | Number | Order total |
| `status` | String | `"pending"`, `"confirmed"`, `"cancelled"` |
| `email` | String | Confirmation email used |
| `name`, `address`, `shpType`, etc. | String | Denormalized shipping details |

### 4.4 ShippingDetail (`models/ShippingDetail.js`)

Stores shipping info linked to an Order. Includes courier name, city, phone numbers, COD/paid flag, and special instructions.

### 4.5 PreOrder (`models/PreOrder.js`)

Order confirmed by the customer via email link. `finalized: Boolean` — once moved to MainOrderCSVData, marked finalized.

### 4.6 MainOrderCSVData (`models/MainOrderCSVData.js`)

Holds orders ready for HHC CSV export. Uses `strict: false` to allow dynamic numbered product fields.

| Field | Type | Description |
|-------|------|-------------|
| `orderID` | String (unique) | Original Order ObjectId |
| `name` | String | Customer name |
| `address` | String | Full shipping address |
| `shpType` | String | `Regular` or `Express` |
| `courierCompany` | String | Courier name |
| `courierCity` | String | Delivery city |
| `phoneNumber` | String | Primary phone |
| `phoneNumber2` | String | Secondary phone |
| `sellPrice` | Number | Order total |
| `businessProfiles` | Number | Always 1 |
| `courierInstruction` | String | Delivery instructions |
| `productCount` | Number | Number of products |
| `exported` | Boolean | `false` → `true` after CSV download |
| `product1`, `variation1`, `qty1` | dynamic | Numbered fields per product |

### 4.7 ConfirmationGap (`models/ConfirmationGap.js`)

Temporary holding area for orders awaiting customer email confirmation. 10-minute TTL.

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Customer |
| `order` | ObjectId | Original Order |
| `items` | [Object] | Product snapshot |
| `totalAmount` | Number | Total |
| `confirmationToken` | String | Unique token for confirm link |
| `confirmationExpiresAt` | Date | 10 min from creation |
| `confirmed` | Boolean | `false` until email link clicked |
| All shipping fields | String | Denormalized from checkout |

### 4.8 CancelledOrders (`models/CancelledOrders.js`)

Full denormalized copy of orders that expired (not confirmed within 10 min).

### 4.9 OrderHistory (`models/OrderHistory.js`)

Archive of exported orders. Same structure as MainOrderCSVData (`strict: false`) plus `exportedAt` and customer `email`.

### 4.10 Cart (`models/Cart.js`)

One cart per user. `items: [{ product (ObjectId→Product), quantity }]`.

### 4.11 Review (`models/Review.js`)

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId → User | Reviewer |
| `product` | ObjectId → Product | Reviewed product |
| `order` | ObjectId → Order | Order that included this product |
| `rating` | Number (1–5) | Star rating |
| `comment` | String | Review text |
| `createdAt` | Date | Timestamp |

One review per user per product (unique compound index on `user + product`).

### 4.12 Settings (`models/Settings.js`)

Singleton document:
- `periodStart`, `lastReportGeneratedAt` — monthly report cycle
- `globalPricing` — global markup % for all products
- `salesSnapshot` — counters for report generation

### 4.13 OutOfStockDeletedProduct

Archive of products auto-deleted due to `stock = 0`. Contains full product snapshot + `deletedAt` + `deletedBecause`.

---

## 5. Authentication Flow

### 5.1 Email/Password Auth

```
User → POST /api/auth/register   → User created, JWT returned
User → POST /api/auth/login      → Email + password verified, JWT returned
User → POST /api/auth/update     → Update name/gender/email (OTP for email change)
```

**JWT Token:**
- Contains: `{ userId, role, iat, exp }`
- Expires: 30 days
- Stored: httpOnly cookie (`kifayat_token`)
- Read by: `protect` middleware via `req.cookies`

**Middleware chain:**
1. `protect` — verifies JWT from cookie, attaches `req.user`
2. `requireAdmin` — checks `req.user.role === "admin"`

### 5.2 Google Auth

```
User clicks "Sign in with Google" → Firebase popup → Get idToken
POST /api/auth/google → Server verifies with Firebase Admin SDK
→ Finds or creates user → Returns JWT in httpOnly cookie
```

### 5.3 Shipment Email Management

```
GET  /api/auth/shipment-emails           → Returns login email + all shipmentEmails
POST /api/auth/shipment-emails/send-otp  → Sends OTP to new email
POST /api/auth/shipment-emails/verify-otp → Verifies OTP, adds to shipmentEmails[]
DELETE /api/auth/shipment-emails/:email  → Removes from shipmentEmails[]
```

**OTP System:**
- 6-digit via `crypto.randomInt(100000, 999999)`
- Hashed with SHA-256 before storing in memory Map
- Key: `userId-email`, value: `{ hashedOtp, expiry, name }`
- Expires in 10 minutes; resets on server restart

---

## 6. Product Sync (HHC API)

### 6.1 Sync Flow (syncAll)

**Phase 1 — Discovery:** Call `GET /dropshipper/products?page=1&paginate=40`, extract `total`, calculate `totalPages`.

**Phase 2 — Fetch All Pages:** Loop pages with 5–7s random delay between pages. After each 10-page batch, wait the remainder of a 60s window.

**Phase 3 — Grace Period:** 5 minutes (split into 5s intervals for abort detection).

**Phase 4 — Cleanup:** Delete products not tagged `newProduct: true` in this sync, then remove the flag from all remaining products.

**Phase 5 — Out-of-stock removal:** Archive to `OutOfStockDeletedProduct`, delete from `Product`, emit `product_deleted` per item.

### 6.2 Rate Limits

| Parameter | Value |
|-----------|-------|
| Max pages per batch | 10 |
| Batch window | 60 seconds |
| Delay between pages | 5,000–7,000 ms (random) |
| Max consecutive failures | 3 |
| Grace period | 5 minutes |

### 6.3 Field Mapping

| DB Field | API Sources |
|----------|------------|
| `name` | name, Name, product_name, title |
| `sku` | sku, SKU, sku_code, code, article_no |
| `wholesalePrice` | price, retail_price, wholesale_price, selling_price |
| `stock` | stock, quantity, qty, in_stock |
| `imageUrl` | product_thumbnail.original_url → product_thumbnail → image, image_url |
| `videoUrl` | video, video_url, VideoUrl |

URL cleaning: `url.split(",")[0].split("?")[0].trim()`

---

## 7. Cart & Checkout Flow

### 7.1 Cart

Frontend uses **localStorage cart** (not MongoDB-backed). Only `/api/cart/validate` is called from the frontend to check stock and prices before checkout.

### 7.2 Checkout Flow

```
1. User selects shipment email (login email or verified extra email)
2. User fills shipping form
3. POST /api/orders/place
   ├── Creates Order (status: "pending")
   ├── Creates ShippingDetail
   ├── Creates ConfirmationGap (token, 10-min TTL)
   ├── Sends confirmation email with link
   └── Response → { success, orderId, expiresAt }

4. User redirected to /confirm-order?token=...
   └── "Check your email" + countdown

5. GET /api/orders/confirm/:token
   ├── Verified → processConfirmationGap()
   │   ├── Creates PreOrder (confirmed, finalized: true)
   │   ├── Creates MainOrderCSVData
   │   ├── Deletes Order + ShippingDetail + ConfirmationGap
   └── Expired → CancelledOrders, stock restored
```

---

## 8. Order Lifecycle

```
Cart → POST /api/orders/place
         ↓
  Order (pending) + ConfirmationGap (10-min TTL)
         ↓
   ┌─────────────────┐
   │ Email confirmed  │         │ 10-min timeout    │
   ↓                            ↓
PreOrder (confirmed)    CancelledOrders (stock restored)
finalized: true
   ↓ (auto)
MainOrderCSVData
   ↓ Admin "Download CSV"
CSV file + OrderHistory archive
```

Server restart: `restorePendingConfirmations()` re-schedules timers for all unconfirmed ConfirmationGap records on startup.

---

## 9. CSV Export Format

```
orderID, name, address, shpType, courierCompany, courierCity,
phoneNumber, phoneNumber2, sellPrice, businessProfiles,
courierInstruction, product1, variation1, qty1, ..., productN,
variationN, qtyN, shipping, allowToOpen
```

Column count is dynamic — calculated from max `productCount` across all orders in the export batch.

**Export flow:**
1. `updateMany({ exported: false }, { $set: { exported: true } })` (atomic claim)
2. Fetch claimed orders
3. Generate CSV rows
4. Archive to `OrderHistory`
5. Delete from `MainOrderCSVData`
6. Send file to admin browser

---

## 10. Admin Dashboard

### 10.1 Sections

- **Top Products** — leaderboard by salesCount, search by name/SKU
- **Product Edit Modal** — name, description, stock, weight, image/video URL, wholesale price, retail price
- **Reviews Modal** — per-product review list
- **Orders Modal** — PreOrder, MainOrder, OrderHistory per product
- **Sync Controls** — HHC bearer token, Quick Fetch, Sync All, Stop, real-time log
- **Order Management** — PreOrder list, filter/status, Finalize button
- **Pricing** — global markup %
- **CSV Upload** — bulk product import
- **Monthly Report** — top sold products, 30-day auto-cycle
- **User Management** — CRUD for users

### 10.2 Visibility Toggle

`hidden: true` removes the product from customer listing but keeps it in admin leaderboard.

---

## 11. Real-time Updates (Socket.IO)

| Event | When emitted |
|-------|-------------|
| `products_updated` | After sync, pricing update, or product changes |
| `product_deleted` | Per-product during out-of-stock cleanup |
| `products_cleared` | Admin clears all products |
| `pricing_updated` | After pricing change |
| `hhc_progress` | Real-time sync log messages |
| `sync_complete` | Sync finishes |

---

## 12. Email System

| Function | Trigger | Content |
|----------|---------|---------|
| `sendOTPEmail` | Shipment email verification | 6-digit OTP |
| `sendOrderConfirmationLinkEmail` | Order placed | "Confirm Order" button + order summary |
| `sendEmailChangeOTP` | Profile email change | 6-digit OTP |
| `sendPasswordResetOTP` | Forgot password | 6-digit OTP |

Confirmation link format: `FRONTEND_URL/confirm-order?token=CONFIRMATION_TOKEN`

---

## 13. Image/Video Handling

- `imageUrl` — image (jpg, png, webp) or video URL detected by extension
- `videoUrl` — explicit video URL (preferred)
- No server uploads — all URLs point to external CDNs
- Priority: `videoUrl` → `imageUrl` (video ext) → `imageUrl` (image) → letter fallback

`isVideoUrl()` extensions: `mp4`, `webm`, `mov`, `avi`, `mkv`, `flv`, `wmv`, `3gp`, `m4v`, `ogv`

---

## 14. API Endpoints Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Email/password login |
| POST | `/google` | No | Google OAuth login |
| GET | `/me` | User | Get current user profile |
| PUT | `/profile` | User | Update name, gender, phone |
| PUT | `/password` | User | Change password |
| POST | `/forgot-password` | No | Send password reset OTP |
| POST | `/reset-password` | No | Reset password with OTP |
| GET | `/shipment-emails` | User | List shipment emails |
| POST | `/shipment-emails/send-otp` | User | Send OTP for new email |
| POST | `/shipment-emails/verify-otp` | User | Verify OTP, save email |
| DELETE | `/shipment-emails/:email` | User | Remove shipment email |

### Products (`/api/products`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | List products (paginated, filterable, searchable) |
| GET | `/:id` | Public | Single product |
| GET | `/:id/similar` | Public | Similar products |
| GET | `/categories` | Public | Distinct category list |
| GET | `/stats` | User | Dashboard stats |
| GET | `/leaderboard` | Admin | All products sorted by sales |
| GET | `/out-of-stock` | Admin | Products with stock = 0 |
| GET | `/:id/orders` | Admin | Orders containing this product |
| PUT | `/:id` | Admin | Update product fields |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/upload-csv` | Admin | Bulk import from CSV |
| POST | `/update-pricing-all` | Admin | Global markup % |
| POST | `/clear` | Admin | Delete all products |

### Orders (`/api/orders`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/place` | User | Place order |
| GET | `/my` | User | User's own orders |
| GET | `/confirm/:token` | Public | Confirm via email link |
| GET | `/pending` | Admin | Pending pre-orders |
| PUT | `/:id/status` | Admin | Update order status |
| POST | `/finalize/:id` | Admin | Move to MainOrderCSVData |
| POST | `/shipping-otp` | User | OTP for checkout email |
| POST | `/verify-shipping-otp` | User | Verify checkout email OTP |

### Cart (`/api/cart`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | User | Get cart |
| POST | `/` | User | Save cart |
| POST | `/validate` | User | Validate cart items (stock + price check) |

### Reviews (`/api/reviews`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/product/:productId` | Public | Reviews for a product |
| POST | `/` | User | Submit review |
| GET | `/check-eligibility/:productId` | User | Can this user review? |
| GET | `/admin/product/:productId` | Admin | Admin review list |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/export-csv` | Admin | Download CSV + archive to OrderHistory |
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/role` | Admin | Change user role |
| DELETE | `/users/:id` | Admin | Delete user |

### HHC Sync (`/api/hhc-proxy`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/test-token` | Admin | Validate bearer token |
| POST | `/quick-fetch` | Admin | Single-page sync |
| POST | `/sync-all` | Admin | Full paginated sync |
| GET | `/sync-status` | Admin | Current sync state |
| POST | `/sync-stop` | Admin | Abort sync |

---

---

## Part 2 — Current Backend State (July 2026)

> This section documents the **actual current state** of `kifayat-backend/` as it exists in the repository today. It reflects all additions and changes made since the original documentation was written.

---

## A. File Structure (Current)

```
kifayat-backend/
├── server.js                         # Entry point — Express, Socket.IO, DB connect,
│                                     # sitemap routes, robots.txt, health checks
├── firebase-service-account.json     # Firebase Admin credentials (gitignored in prod)
├── .env                              # Local environment variables
├── .env.example                      # Template for required vars
├── package.json
│
├── config/
│   ├── db.js                         # Mongoose connection helper
│   └── firebaseAdmin.js              # Firebase Admin SDK init
│
├── models/                           # All Mongoose schemas
│   ├── ActivityLog.js                # Admin action audit trail
│   ├── BlockedUser.js                # Users blocked by admin
│   ├── CancelledOrders.js
│   ├── Cart.js
│   ├── Category.js                   # Product categories (slug, name, image)
│   ├── ConfirmationGap.js
│   ├── DeletedUser.js                # Archive of deleted user accounts
│   ├── LoginHistory.js               # Per-user login event log
│   ├── MainOrderCSVData.js
│   ├── Order.js
│   ├── OrderHistory.js
│   ├── OutOfStockDeletedProduct.js
│   ├── PreOrder.js
│   ├── PriceDiagnostic.js
│   ├── Product.js
│   ├── RegisterUserData.js           # Registration metadata
│   ├── Report.js                     # Monthly sales report snapshots
│   ├── Review.js
│   ├── Session.js                    # Active user sessions
│   ├── Settings.js
│   ├── ShippingDetail.js
│   ├── User.js
│   ├── UserFinalData.js              # Aggregated per-user analytics
│   └── WebsiteReview.js             # Storefront testimonials (separate from product reviews)
│
├── controllers/
│   ├── activityLogController.js      # Admin activity feed
│   ├── authController.js
│   ├── cartController.js
│   ├── csvExportController.js
│   ├── diagnosticController.js
│   ├── hhcApiController.js
│   ├── orderController.js
│   ├── productController.js
│   ├── reviewController.js
│   ├── userController.js
│   ├── userFinalDataController.js    # Aggregated user data for admin
│   └── websiteReviewController.js    # Storefront testimonials
│
├── routes/
│   ├── activityLogRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── csvExportRoutes.js
│   ├── diagnosticRoutes.js
│   ├── hhcApiRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   ├── reviewRoutes.js
│   ├── userFinalDataRoutes.js
│   ├── userRoutes.js
│   └── websiteReviewRoutes.js
│
├── middleware/
│   ├── auth.js                       # JWT from httpOnly cookie (kifayat_token)
│   └── adminProtect.js               # role === "admin" check
│
└── utils/
    ├── activeUserMonitor.js          # Tracks online users (2-min interval)
    ├── activityLogger.js             # Logs admin actions to ActivityLog
    ├── categorize.js                 # Auto-categorize products by name/keywords
    ├── cookies.js                    # Cookie helper (set/clear kifayat_token)
    ├── email.js                      # Resend + Nodemailer email sending
    ├── jwt.js                        # JWT sign/verify helpers
    ├── loginLogger.js                # Writes LoginHistory records
    ├── otp.js                        # 6-digit OTP generation + SHA-256 hashing
    └── outOfStockManager.js          # Auto-delete OOS products, restore timers on restart
```

---

## B. New & Changed Models (vs Original Docs)

### B.1 Category (`models/Category.js`)

A dedicated Category collection (no longer just a string field on Product).

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (required, unique) | Display name |
| `slug` | String (unique) | URL-friendly identifier |
| `image` | String | Category cover image URL |
| `updatedAt` | Date | Timestamp |

### B.2 WebsiteReview (`models/WebsiteReview.js`)

Storefront testimonials submitted by customers — separate from product `Review` documents.

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId → User | Reviewer |
| `rating` | Number (1–5) | Star rating |
| `comment` | String | Review body |
| `approved` | Boolean | Admin moderation flag |
| `createdAt` | Date | Timestamp |

### B.3 ActivityLog (`models/ActivityLog.js`)

Audit trail for all admin actions.

| Field | Type | Description |
|-------|------|-------------|
| `admin` | ObjectId → User | Admin who performed the action |
| `action` | String (enum) | e.g. `"product_edit"`, `"order_status"`, `"user_delete"` |
| `description` | String | Human-readable summary |
| `ipAddress` | String | Request IP |
| `metadata` | Mixed | Extra context (product ID, before/after values, etc.) |
| `createdAt` | Date | Timestamp |

### B.4 BlockedUser (`models/BlockedUser.js`)

Records users that an admin has blocked from placing orders or logging in.

### B.5 DeletedUser (`models/DeletedUser.js`)

Archive of deleted user accounts (soft-delete trail for compliance/audit).

### B.6 LoginHistory (`models/LoginHistory.js`)

Per-user login event log: IP address, user agent, timestamp, success/failure flag.

### B.7 Session (`models/Session.js`)

Active session tracking used by `activeUserMonitor.js` to count online users.

### B.8 RegisterUserData (`models/RegisterUserData.js`)

Registration metadata snapshot stored at signup time.

### B.9 UserFinalData (`models/UserFinalData.js`)

Aggregated per-user analytics: total spend, order count, last activity, lifetime value.

### B.10 Report (`models/Report.js`)

Monthly sales report snapshots generated automatically every 30 days via the Settings `periodStart` cycle.

---

## C. New Routes & Endpoints (Current)

### C.1 Website Reviews (`/api/website-reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | User | Submit a storefront testimonial |
| GET | `/` | Public | List approved testimonials |
| PATCH | `/:id/approve` | Admin | Approve/reject a testimonial |
| DELETE | `/:id` | Admin | Delete testimonial |

### C.2 Activity Log (`/api/admin/activity-logs`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin | List all admin activity (paginated) |
| GET | `/stats` | Admin | Activity summary counts by action type |

### C.3 User Final Data (`/api/admin/users-final-data`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin | Aggregated analytics for all users |

### C.4 Diagnostic (`/api/admin/diagnostic`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/run` | Admin | Run price diagnostic scan |
| POST | `/confirm` | Admin | Confirm and apply diagnostic results |
| GET | `/latest` | Admin | Get last diagnostic report |

### C.5 Cart (`/api/cart`) — Current Behaviour

The backend cart endpoints (`GET /`, `POST /save`) exist but the **frontend does not use them**. Only `POST /api/cart/validate` is called — it checks stock availability and current pricing against MongoDB before checkout. The cart itself lives in `localStorage`.

### C.6 SEO Routes (served directly from `server.js`)

| Method | Path | Cache | Description |
|--------|------|-------|-------------|
| GET | `/sitemap.xml` | 1 hr | Sitemap index listing all sub-sitemaps |
| GET | `/sitemap-pages.xml` | 1 hr | Static routes (home, products, blog, legal, etc.) |
| GET | `/sitemap-products.xml` | 1 hr | All in-stock products from MongoDB |
| GET | `/sitemap-categories.xml` | 1 hr | All category slugs from MongoDB |
| GET | `/image-sitemap.xml` | 2 hr | Product image sitemap with `image:title` and `image:caption` |
| GET | `/robots.txt` | 24 hr | Crawler rules with per-bot directives |
| GET | `/api/health` | — | `{ success, message }` liveness check |
| GET | `/api/health/firebase` | — | Firebase Admin SDK status check |

---

## D. Middleware (Current)

| Middleware | Scope | Config |
|------------|-------|--------|
| `helmet()` | Global | COOP set to `same-origin-allow-popups` for Firebase popup support |
| `cors()` | Global | `allowedOrigins` list + Replit dev domain regex |
| `express.json({ limit: "1mb" })` | Global | Request body limit |
| `cookieParser()` | Global | Reads `kifayat_token` cookie |
| `compression()` | Global | gzip/brotli response compression |
| `globalLimiter` | All routes | 200 req / 15 min |
| `authLimiter` | `/api/auth/*` | 15 req / 15 min |
| `otpLimiter` | OTP endpoints | 6 req / 15 min |
| `protect` | Protected routes | Reads JWT from `req.cookies.kifayat_token` |
| `requireAdmin` | Admin routes | `req.user.role === "admin"` |

---

## E. Authentication (Current — Cookie-based)

The original documentation describes `localStorage` + `Authorization: Bearer` header. **The current implementation uses httpOnly cookies instead:**

- JWT is set as `httpOnly; Secure; SameSite=None` cookie named `kifayat_token`
- `protect` middleware reads from `req.cookies.kifayat_token` (not from `Authorization` header)
- Vite dev proxy rewrites `Secure` and `SameSite=None` → `SameSite=Lax` on Set-Cookie responses so cookies work over HTTP in dev
- Logout: `POST /api/auth/logout` clears the cookie

**Admin role assignment:** Any email listed in `ADMIN_EMAILS` (comma-separated env var) is automatically set to `role: "admin"` on registration or login.

---

## F. Scheduled Tasks & Background Jobs

| Job | Interval | Description |
|-----|----------|-------------|
| Price Diagnostic Monitor | Every 10 min | Auto-scans for pricing anomalies |
| Active User Monitor | Every 2 min | Updates online user count via Session model |
| OOS Product Cleanup | On startup | Restores `pendingDeleteAt` timers for out-of-stock products |
| Confirmation Gap Restore | On startup | Reschedules 10-min timers for any unconfirmed ConfirmationGap records left over from a crash/restart |

---

## G. Email (Current)

**Primary:** Resend SDK (`RESEND_API_KEY`)
**Fallback:** Nodemailer with Gmail SMTP (`EMAIL_USER`, `EMAIL_PASS`)
**From address:** Configured via `RESEND_FROM_EMAIL` env var

---

## H. Environment Variables (Complete)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 64 chars recommended) |
| `JWT_EXPIRE` | — | Token expiry (default `30d`) |
| `PORT` | — | Server port (default `5000`; set to `3001` in Replit dev via workflow command) |
| `NODE_ENV` | — | `production` or `development` |
| `FRONTEND_URL` | ✅ | Base URL for email confirmation links |
| `RESEND_API_KEY` | ✅ | Resend email API key |
| `RESEND_FROM_EMAIL` | — | Sender address for Resend emails |
| `EMAIL_USER` | — | Gmail address (fallback SMTP) |
| `EMAIL_PASS` | — | Gmail app password (fallback SMTP) |
| `ADMIN_EMAILS` | — | Comma-separated list of emails auto-promoted to admin |
| `FIREBASE_PROJECT_ID` | — | Firebase project ID (used in health check) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | — | Path to service account JSON |
| `SESSION_SECRET` | — | Express session secret (Replit Secret) |
| `HHC_API_URL` | — | HHC Dropshipping API base URL |
| `HHC_REFERER` | — | Referer header for HHC requests |
| `HHC_ORIGIN` | — | Origin header for HHC requests |

---

## I. Replit-Specific Notes

- **Port:** Backend runs on `3001` in Replit (set via `PORT=3001` prefix in the workflow command). The `.env` file still says `5000` but the workflow command takes precedence because dotenv does not override already-set env vars.
- **Workflows:** Backend workflow = `cd kifayat-backend && npm install && PORT=3001 node server.js`
- **CORS:** Includes a regex allowing all `*.replit.dev` and `*.sisko.replit.dev` origins in development.
- **Cookies in dev:** Vite proxy rewrites `Secure; SameSite=None` → `SameSite=Lax` on Set-Cookie so httpOnly cookies are accepted by the browser through the proxy.
