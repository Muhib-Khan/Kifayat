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
F:\kifayat\kifayat-backend\
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
F:\kifayat\kifayat-frontend\src\
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
| `category` | String | `"Uncategorized"` | Product category (from HHC API, stored but NOT shown on UI) |
| `imageUrl` | String | `""` | Image URL (or video URL detected via extension) |
| `videoUrl` | String | `""` | Explicit video URL |
| `weight` | Number (min:0) | `0` | Weight in kg |
| `salesCount` | Number (min:0) | `0` | Total units sold |
| `uploadBatch` | String | `""` | Batch identifier from CSV upload |
| `newProduct` | Boolean | — | `true` during sync, removed after cleanup (never exposed to UI) |
| `hidden` | Boolean | `false` | If `true`, hidden from customer dashboard |
| `rawData` | Mixed | `{}` | Full API response preserved for debugging (never exposed to UI) |
| `createdAt` | Date (auto) | — | Timestamp |
| `updatedAt` | Date (auto) | — | Timestamp |

**Indexes:** `category`, `sku`, `stockOutAt`, `pendingDeleteAt`

**`toCustomerProduct()`** sanitizes the product before sending to customers:
- Adds `inStock` (boolean, `stock > 0`)
- Removes `stock`, `newProduct`, `rawData`, `hidden`, `wholesalePrice`

### 4.2 User (`models/User.js`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | String (required) | Full name |
| `email` | String (unique) | Login email |
| `password` | String | Hashed password (not for Google users) |
| `authProvider` | String | `"email"` or `"google"` |
| `role` | String | `"user"` or `"admin"` |
| `shipmentEmails` | [String] | Verified email addresses used for order confirmations (separate from login email) |
| `phone` | String | Phone number |
| `gender` | String | Gender |
| `createdAt` | Date | Timestamp |

### 4.3 Order (`models/Order.js`)

Created when customer places an order. Holds items snapshot + status.

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId → User | Customer who placed the order |
| `items` | [Object] | Array of `{ product (ObjectId→Product), name, price, quantity, image }` |
| `totalAmount` | Number | Order total |
| `status` | String | `"pending"`, `"confirmed"`, `"cancelled"` |
| `email` | String | Confirmation email used |
| `name`, `address`, `shpType`, etc. | String | Shipping details (denormalized) |

### 4.4 ShippingDetail (`models/ShippingDetail.js`)

Stores shipping info linked to an Order. Includes courier details, pricing, instructions.

### 4.5 PreOrder (`models/PreOrder.js`)

Order that has been confirmed by the customer (after email confirmation). Status set to `"confirmed"`. Used by admin to view pending orders. Has `finalized: Boolean` — once moved to MainOrderCSVData, marked as finalized.

### 4.6 MainOrderCSVData (`models/MainOrderCSVData.js`)

**Purpose:** Holds orders ready for HHC CSV export. Uses `strict: false` to allow dynamic numbered product fields.

| Field | Type | Description |
|-------|------|-------------|
| `orderID` | String (unique) | Original Order ObjectId |
| `name` | String | Customer name |
| `address` | String | Full shipping address |
| `shpType` | String | Shipping type (Regular/Express) |
| `courierCompany` | String | Courier name |
| `courierCity` | String | Delivery city |
| `phoneNumber` | String | Primary phone |
| `phoneNumber2` | String | Secondary phone |
| `sellPrice` | Number | Order total |
| `businessProfiles` | Number | Always 1 |
| `courierInstruction` | String | Delivery instructions |
| `productCount` | Number | Number of products in this order |
| `productSearch` | [String] | Flat array of SKUs/names for search |
| `shipping` | String | `"cod"` or `"paid"` |
| `allowToOpen` | String | `"1"` or `""` |
| `exported` | Boolean | `false` initially, `true` after CSV download |
| `product1`, `variation1`, `qty1` | dynamic | Numbered fields for each product (strict:false allows this) |
| `product2`, `variation2`, `qty2` | dynamic | Second product (if exists) |
| `productN`, `variationN`, `qtyN` | dynamic | Nth product |

When exporting CSV, the system calculates the maximum `productCount` across all orders and generates exactly that many `productN,variationN,qtyN` triplets in the header.

### 4.7 ConfirmationGap (`models/ConfirmationGap.js`)

**Purpose:** Temporary holding area for orders awaiting customer email confirmation. Has a 10-minute TTL.

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId | Customer |
| `order` | ObjectId | Original Order |
| `items` | [Object] | Product snapshot |
| `totalAmount` | Number | Total |
| `confirmationToken` | String | Unique token for confirm link |
| `confirmationExpiresAt` | Date | 10 min from creation |
| `confirmed` | Boolean | `false` until email link clicked |
| `confirmedAt` | Date | When confirmed |
| All shipping fields | String | Denormalized from checkout |

### 4.8 CancelledOrders (`models/CancelledOrders.js`)

**Purpose:** Stores orders that expired (not confirmed within 10 min). Full denormalized copy with cancellation reason.

### 4.9 OrderHistory (`models/OrderHistory.js`)

**Purpose:** Archive of exported orders. Same structure as MainOrderCSVData (`strict: false` for numbered fields) plus `exportedAt` timestamp and `email` of customer.

### 4.10 Cart (`models/Cart.js`)

One cart per user. Contains `items: [{ product (ObjectId→Product), quantity }]`.

### 4.11 Review (`models/Review.js`)

| Field | Type | Description |
|-------|------|-------------|
| `user` | ObjectId → User | Reviewer |
| `product` | ObjectId → Product | Reviewed product |
| `order` | ObjectId → Order | Order that included this product |
| `rating` | Number (1-5) | Star rating |
| `comment` | String | Review text |
| `createdAt` | Date | Timestamp |

Enforces: one review per user per product (unique compound index on `user + product`).

### 4.12 Settings (`models/Settings.js`)

Singleton document storing:
- `periodStart`, `lastReportGeneratedAt` — for monthly report cycle
- `categoryPricing` — Map of category → markup % (legacy, no longer used in UI)
- `globalPricing` — Global markup % for all products
- `salesSnapshot` — Sales counters for report generation

### 4.13 OutOfStockDeletedProduct

Archive of products automatically deleted due to stock = 0. Contains full product snapshot + `deletedAt` + `deletedBecause`.

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
- Expires: 7 days
- Stored: `localStorage` as `token`
- Sent: `Authorization: Bearer <token>` header

**Middleware chain:**
1. `protect` — verifies JWT, attaches `req.user`
2. `requireAdmin` — checks `req.user.role === "admin"`

### 5.2 Google Auth

```
User clicks "Sign in with Google" → Firebase popup → Get idToken
Send idToken to POST /api/auth/google → Server verifies with Firebase
→ Finds or creates user → Returns JWT
```

### 5.3 Shipment Email Management

Separate from the login email. Users can have multiple verified shipment emails:

```
1. GET  /api/auth/shipment-emails        → Returns login email + all shipmentEmails
2. POST /api/auth/shipment-emails/send-otp  → Sends OTP to new email
3. POST /api/auth/shipment-emails/verify-otp → Verifies OTP, adds to shipmentEmails[]
4. DELETE /api/auth/shipment-emails/:email   → Removes from shipmentEmails[]
```

**OTP System:**
- 6-digit OTP generated via `crypto.randomInt(100000, 999999)`
- Hashed with SHA-256 before storing in memory (`shippingOTPStore` Map)
- Key: `userId-email`, value: `{ hashedOtp, expiry, name }`
- Expires: 10 minutes
- In-memory store resets on server restart

---

## 6. Product Sync (HHC API)

### 6.1 Overview

```
┌──────────┐   POST /api/hhc/sync-all    ┌──────────────┐
│  Admin   │◄──── (or quick-fetch) ──────►│  Backend     │
│  Button  │                              │              │
└──────────┘                              │  1. Discover  │
                                          │     pages     │
                                          │  2. Fetch     │
                                          │     batches   │
                                          │  3. Save to   │
                                          │     MongoDB   │
                                          │  4. Grace     │
                                          │     period    │
                                          │  5. Cleanup   │
                                          │     old       │
                                          │  6. Remove    │
                                          │     OOS       │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │  HHC API     │
                                          │  (External)  │
                                          └──────────────┘
```

### 6.2 Rate Limiting

| Parameter | Value |
|-----------|-------|
| Max pages per batch | 10 |
| Batch window | 60 seconds |
| Delay between pages | 5,000 – 7,000 ms (random) |
| Max consecutive failures | 3 |
| Grace period after fetch | 5 minutes |

```javascript
// randomDelay() implementation:
const ms = Math.floor(Math.random() * 2001) + 5000;  // 5000-7000ms
return new Promise((resolve) => setTimeout(resolve, ms));
```

After every 10 pages, the code checks elapsed time and waits the remainder of the 60s window before proceeding.

### 6.3 Sync Flow (syncAll)

**Phase 1 — Discovery:**
1. Call `GET /dropshipper/products?page=1&paginate=40`
2. Extract `total` from response
3. Calculate `totalPages = Math.ceil(total / 40)`
4. If detection fails, default to 211 pages

**Phase 2 — Fetch All Pages:**
- Loop `page = 1` to `totalPages`
- Each page: `GET /dropshipper/products?page=N&paginate=40&search=&field=&price=&category=&sort=&sortBy=&weight=&attribute=`
- Between pages: 5-7s random delay
- After each batch of 10: wait remaining time in 60s window
- Each product saved with `newProduct: true`

**Phase 3 — Grace Period:**
- Waits 5 minutes (split into 5s intervals for abort detection)
- Admin can still stop the sync during this window
- If aborted, newly created products are deleted

**Phase 4 — Cleanup (delete old products):**
```javascript
Product.deleteMany({
  $or: [
    { newProduct: { $ne: true } },  // not tagged in this sync
    { newProduct: { $exists: false } },  // never tagged
  ],
});
// Then remove newProduct flag from remaining:
Product.updateMany(
  { newProduct: true },
  { $unset: { newProduct: "" } },
);
```

**Phase 5 — Remove out-of-stock:**
- All products with `stock <= 0` are archived to `OutOfStockDeletedProduct` and deleted
- Socket event `product_deleted` emitted for each
- Bulk `products_updated` event emitted

### 6.4 Quick Fetch

Same core logic but without pagination (single page request). Used for smaller, faster syncs. Includes out-of-stock cleanup at the end.

### 6.5 Product Mapping (mapHHCProduct)

The `extractImageUrl()` function checks these sources in order:
1. `product_thumbnail` as nested object → `original_url`, `url`, or `source`
2. `product_thumbnail` as direct string
3. Case-insensitive match on: `image`, `Image`, `image_url`, `ImageUrl`, `images`, `Images`, `img`, `photo`, `thumbnail`, `image_link`

The `extractVideoUrl()` function checks: `video`, `video_url`, `VideoUrl`, `video_link`, `videos` (case-insensitive fallback)

Both URLs are cleaned: `url.split(",")[0].split("?")[0].trim()` — takes first URL from comma-separated list, strips query params.

**Fields mapped from API:**
| DB Field | API Sources (searched in order) |
|----------|--------------------------------|
| `name` | name, Name, product_name, ProductName, title, Title |
| `sku` | sku, SKU, sku_code, SkuCode, code, article_no |
| `wholesalePrice` | price, Price, retail_price, wholesale_price, selling_price, mrp |
| `stock` | stock, Stock, quantity, Quantity, qty, in_stock |
| `category` | category, Category, categories, type, department, group |
| `imageUrl` | (see extractImageUrl above) |
| `videoUrl` | (see extractVideoUrl above) |
| `weight` | weight, Weight, weight_kg, wt |
| `productId` | id, ID, _id, product_id, pid, productId |

---

## 7. Cart & Checkout Flow

### 7.1 Cart Operations

```
Add to cart:   POST /api/cart/add      { productId, quantity }
Remove:        POST /api/cart/remove   { productId }
Get cart:      GET  /api/cart
Clear:         POST /api/cart/clear
```

Cart is stored in MongoDB per user. The frontend `CartContext` provides:
- `addToCart(product)` — optimistic update + API sync
- `removeFromCart(productId)`
- `isInCart(productId)`
- `totalItems` — total quantity across all items
- `cartItems` — array of cart items with populated product data

### 7.2 Checkout Flow

```
1. Cart page (Cart.jsx)
   ├── User selects shipment email from dropdown
   │   ├── Login email is always listed first (labeled "(Login)")
   │   ├── Verified shipment emails listed below
   │   └── "+ Use another email" → opens OTP verification modal
   │
   ├── User fills shipping form (name, address, phone, courier, etc.)
   │
   └── User clicks "Order Now"

2. POST /api/orders/place
   ├── Validates cart, shipping info, email
   ├── Creates Order document (status: "pending")
   ├── Creates ShippingDetail document
   ├── Creates ConfirmationGap document
   │   ├── confirmationToken = crypto.randomBytes(32).toString("hex")
   │   ├── confirmationExpiresAt = now + 10 min
   │   └── confirmed = false
   ├── Sends confirmation email with link
   ├── Schedules 10-min timeout timer
   ├── Clears the cart
   └── Response → { success, orderId, expiresAt }

3. User redirected to /order-confirmation?orderId=...&expiresAt=
   └── Shows "Check your email" + 10-min countdown timer

4. User clicks "Confirm Order" in email
   └── GET /api/orders/confirm/:token  (public, no auth)
       ├── Finds ConfirmationGap by token
       ├── If confirmed already → return success
       ├── If expired → return "link expired"
       ├── Sets confirmed = true, confirmedAt = now
       ├── Cancel the 10-min timer
       ├── Calls processConfirmationGap()
       └── Returns success page frontend

5. processConfirmationGap(gapId)
   ├── Case A: Confirmed
   │   ├── Create PreOrder (status: "confirmed", finalized: true)
   │   ├── Populate items to get SKU/name
   │   ├── Create MainOrderCSVData entry
   │   │   └── Products stored as numbered fields: product1, variation1, qty1...
   │   ├── Delete original Order + ShippingDetail
   │   └── Delete ConfirmationGap
   │
   └── Case B: Not confirmed (10-min timeout)
       ├── Restore stock for each item (+stock, -salesCount)
       ├── Create CancelledOrders entry
       ├── Delete ConfirmationGap
       └── (Original Order + ShippingDetail remain for admin review)
```

### 7.3 Order Email OTP Verification (for new shipment emails)

```
1. User selects "+ Use another email"
2. Types email address
3. POST /api/orders/shipping-otp { email, name }
   ├── Generates 6-digit OTP
   ├── Stores hash in shippingOTPStore (Map, key: userId-email)
   ├── Sends OTP via email
   └── Response: { success }

4. User enters OTP
5. POST /api/orders/verify-shipping-otp { email, otp }
   ├── Verifies hash
   ├── Adds email to user.shipmentEmails (separate from login email)
   └── Response: { success }
```

Note: This is distinct from the auth shipment email management (`/api/auth/shipment-emails/*`). The order flow uses `/api/orders/shipping-otp` and `/api/orders/verify-shipping-otp`.

---

## 8. Order Lifecycle

```
┌──────────┐
│  Cart    │
└────┬─────┘
     │ Place Order
     ▼
┌──────────┐     ┌──────────────────┐
│  Order   │────►│ ConfirmationGap  │
│ (pending)│     │ (10-min TTL)     │
└──────────┘     └────────┬─────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
        Email Click              10-min Timeout
              │                       │
              ▼                       ▼
     ┌────────────────┐     ┌──────────────────┐
     │ PreOrder       │     │ CancelledOrders  │
     │ (confirmed)    │     │ (stock restored)  │
     │ finalized:true │     └──────────────────┘
     └───────┬────────┘
             │ (auto via processConfirmationGap)
             ▼
     ┌──────────────────┐
     │ MainOrderCSVData │
     │ (ready for CSV)  │
     └────────┬─────────┘
              │ Admin clicks "Download CSV"
              ▼
     ┌──────────────────┐     ┌──────────────┐
     │ CSV file sent    │────►│ OrderHistory │
     │ + marked exported│     │ (archive)    │
     └──────────────────┘     └──────────────┘
```

**Server restart handling:** On startup, `restorePendingConfirmations()` finds all `ConfirmationGap` entries where `confirmed=false` and their `confirmationExpiresAt` has passed → processes them immediately. For those still within the window, reschedules 10-min timers.

---

## 9. CSV Export Format

### 9.1 Header Structure

```
orderID,name,address,shpType,courierCompany,courierCity,phoneNumber,phoneNumber2,
sellPrice,businessProfiles,courierInstruction,
product1,variation1,qty1,product2,variation2,qty2,...,productN,variationN,qtyN,
shipping,allowToOpen
```

**Column count is dynamic.** The system calculates the maximum `productCount` across all orders in the export batch and generates that many triplets. For example:
- If one order has 5 items and another has 2 → CSV has `product1..product5` triplets
- The 2-item order has blank `product3`-`product5`, `variation3`-`variation5`, `qty3`-`qty5`

### 9.2 Field Descriptions

| Field | Source | Description |
|-------|--------|-------------|
| `orderID` | Order._id | MongoDB ObjectId as string |
| `name` | ShippingDetail.name | Customer full name |
| `address` | ShippingDetail.address | Full shipping address (comma-separated) |
| `shpType` | ShippingDetail.shpType | `Regular` or `Express` |
| `courierCompany` | ShippingDetail.courierCompany | Courier name (Leopard, etc.) |
| `courierCity` | ShippingDetail.courierCity | Delivery city |
| `phoneNumber` | ShippingDetail.phoneNumber | Customer phone |
| `phoneNumber2` | ShippingDetail.phoneNumber2 | Alternative phone |
| `sellPrice` | ShippingDetail.sellPrice or Order.totalAmount | Total order value |
| `businessProfiles` | ShippingDetail.businessProfiles | Always `1` |
| `courierInstruction` | ShippingDetail.courierInstruction | Special delivery notes |
| `productN` | Item SKU or name | Product identifier for Nth item |
| `variationN` | Item variation | Variation/size for Nth item |
| `qtyN` | Item quantity | Quantity for Nth item |
| `shipping` | ShippingDetail.shipping | Payment method (`cod` or `paid`) |
| `allowToOpen` | ShippingDetail.allowToOpen | `1` if customer allows opening before payment |

### 9.3 CSV Export Flow (downloadMainCSV)

```
1. Admin clicks "Download CSV"
2. Backend atomically claims unexported orders:
   MainOrderCSVData.updateMany({ exported: false }, { $set: { exported: true } })
   └── Prevents double-export from concurrent requests
3. Fetches claimed orders
4. Determines maxProducts across all orders
5. Generates CSV rows (each value properly escaped for commas/quotes)
6. Archives to OrderHistory (copies all fields + email from PreOrder)
7. Deletes from MainOrderCSVData
8. Sends CSV as downloadable file
```

---

## 10. Admin Dashboard

### 10.1 Layout

The admin dashboard (`AdminDashboard.jsx`) is a single-page app (~4400 lines) with sections:

```
┌─────────────────────────────────────────────┐
│  Header: Stats bar (total, categories, etc.)│
├─────────────────────────────────────────────┤
│  Top Products (leaderboard by sales)         │
│  ├── Search box (by name/SKU/productId)     │
│  └── ProductRow per product                  │
│      ├── Rank badge                         │
│      ├── Name + SKU                         │
│      ├── Price                              │
│      ├── Stock (color-coded)                │
│      ├── Sales count                        │
│      ├── ⭐ Reviews button                  │
│      ├── 📦 Orders button                   │
│      ├── ✏️ Edit button                      │
│      └── 👁️/👁️‍🗨️ Show/Hide toggle button    │
├─────────────────────────────────────────────┤
│  Product Edit Modal                         │
│  ├── Name, Description, Stock, Weight       │
│  ├── Image URL, Video URL                   │
│  ├── Wholesale Price, Custom Price          │
│  └── Markup % display                       │
├─────────────────────────────────────────────┤
│  ⭐ Reviews Modal (per product)             │
├─────────────────────────────────────────────┤
│  📦 Orders Modal (per product)              │
│  ├── PreOrder, MainOrder, OrderHistory     │
│  └── Color-coded stages                     │
├─────────────────────────────────────────────┤
│  Sync Controls (HHC API)                    │
│  ├── Bearer token input                     │
│  ├── "Quick Fetch" button                   │
│  ├── Total pages input + "Sync All" button  │
│  ├── Stop button                            │
│  └── Real-time progress log                 │
├─────────────────────────────────────────────┤
│  Order Management                           │
│  ├── PreOrder list with filter/status       │
│  └── Finalize buttons                       │
├─────────────────────────────────────────────┤
│  💰 Set Up Pricing                          │
│  └── Global markup % for all products       │
├─────────────────────────────────────────────┤
│  CSV Upload                                 │
│  └── Upload CSV to bulk-import products     │
├─────────────────────────────────────────────┤
│  Monthly Report                             │
│  ├── Top sold products                      │
│  ├── Period date range                      │
│  └── Auto-generates every 30 days           │
├─────────────────────────────────────────────┤
│  User Management                            │
│  └── CRUD for users (admin only)            │
└─────────────────────────────────────────────┘
```

### 10.2 Visibility Toggle

Each ProductRow has an 👁️ (visible) or 👁️‍🗨️ (hidden) button:
- Calls `productAPI.update(id, { hidden: !current })`
- Hidden products disappear from the customer `GET /api/products` response
- Hidden products still appear in admin leaderboard (with muted icon)
- Useful for hiding out-of-stock or seasonal products without deleting them

### 10.3 Product Edit Modal

Fields available:
- **Name** (text)
- **Description** (textarea)
- **Stock** (number)
- **Weight (kg)** (number)
- **Image URL** (text) — Can be image or video URL
- **Video URL** (text) — Explicit video URL, preferred over Image URL
- **Wholesale Price** (PKR) — Hidden from customers
- **Custom Price (retailPrice)** (PKR) — What customers see

On save, sends `PUT /api/products/:id` with all fields. The backend validates allowed fields.

---

## 11. Real-time Updates (Socket.IO)

### 11.1 Events Emitted by Backend

| Event | Payload | When |
|-------|---------|------|
| `products_updated` | `{ source, created, updated, deleted }` | After sync, pricing update, or product changes |
| `product_deleted` | `{ productId }` | When a single product is deleted (out-of-stock cleanup) |
| `products_cleared` | `{}` | When admin clears all products |
| `pricing_updated` | `{ source }` | When pricing is updated |
| `hhc_progress` | `{ type, message, ... }` | Real-time HHC sync logs |
| `sync_complete` | `{ summary }` | When sync finishes |

### 11.2 Frontend Listeners

Dashboard.jsx listens for:
- `products_updated` → `refreshProducts()` (re-fetches product list)
- `product_deleted` → removes product from state without full refresh
- `pricing_updated` → `refreshProducts()`
- `products_cleared` → clears local state

AdminDashboard.jsx listens for:
- `hhc_progress` → appends to sync log display
- `sync_complete` → updates summary, re-enables buttons

---

## 12. Email System

### 12.1 Email Types

| Function | Trigger | Recipient | Content |
|----------|---------|-----------|---------|
| `sendOTPEmail` | Shipment email verification | New email address | 6-digit OTP |
| `sendOrderConfirmationEmail` | Order placed (legacy) | Customer | Order summary |
| `sendOrderConfirmationLinkEmail` | Order placed (current) | Customer shipment email | "Confirm Order" button link |
| `sendEmailChangeOTP` | Profile email change | New email | 6-digit OTP |
| `sendPasswordResetOTP` | Forgot password | User email | 6-digit OTP |

### 12.2 Confirmation Link Email

When a customer places an order, an email is sent with:
- Order summary (products, quantities, prices)
- A "✅ Confirm Order" button linking to: `FRONTEND_URL/confirm-order?token=CONFIRMATION_TOKEN`
- Note that the order is pending and will expire in 10 minutes

### 12.3 Email Configuration

Uses Nodemailer with SMTP. Configured via environment variables:
- `EMAIL_USER` — SMTP username
- `EMAIL_PASS` — SMTP password
- `FRONTEND_URL` — Base URL for confirmation links

---

## 13. Image/Video Handling

### 13.1 Storage

Products have two URL fields:
- `imageUrl` — Can contain an image URL (jpg, png, webp) OR a video URL (mp4, webm, mov etc.)
- `videoUrl` — Explicitly for video URLs

Both URLs are stored as strings in MongoDB. No files are uploaded to the server — URLs point to external resources (HHC CDN or other providers).

### 13.2 Extraction from HHC API

```javascript
// Image: checks these fields in order
product_thumbnail.original_url → product_thumbnail.url → product_thumbnail.source
→ product_thumbnail (string) → "image" → "Image" → "image_url" → ... → "image_link"

// Video: checks these fields
"video" → "video_url" → "VideoUrl" → "video_link" → "videos" (case-insensitive)
```

Both are cleaned: `url.split(",")[0].split("?")[0].trim()`
- Takes the first URL if comma-separated
- Strips query parameters

### 13.3 Frontend Display

Priority: `videoUrl` → `imageUrl` (if video) → `imageUrl` (if image)

```javascript
// In ProductCard.jsx:
const mainVideo = getImageUrl(videoUrl);
const mainImage = getImageUrl(imageUrl);

// Rendering logic:
if (mainVideo) → <video src={mainVideo}>
else if (mainImage && isVideoUrl(mainImage)) → <video src={mainImage}>
else if (mainImage) → <img src={mainImage}>
else → gradient fallback with first letter
```

`isVideoUrl()` checks file extension: `mp4`, `webm`, `mov`, `avi`, `mkv`, `flv`, `wmv`, `3gp`, `m4v`, `ogv`

### 13.4 Admin Edit

Admins can edit both `Image URL` and `Video URL` fields in the product edit modal. Both fields are text inputs accepting any URL.

---

## 14. API Endpoints Reference

### 14.1 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | Login with email/password |
| POST | `/google` | No | Login/signup with Google |
| GET | `/me` | User | Get current user profile |
| POST | `/update` | User | Update profile (name, gender, email) |
| POST | `/update-password` | User | Change password |
| POST | `/forgot-password` | No | Send password reset OTP |
| POST | `/reset-password` | No | Reset password with OTP |
| GET | `/shipment-emails` | User | List shipment emails |
| POST | `/shipment-emails/send-otp` | User | Send OTP for new shipment email |
| POST | `/shipment-emails/verify-otp` | User | Verify OTP, add shipment email |
| DELETE | `/shipment-emails/:email` | User | Remove a shipment email |

### 14.2 Products (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | User | List products (paginated, sortable, searchable, excludes hidden) |
| GET | `/leaderboard` | Admin | All products sorted by sales (includes hidden) |
| GET | `/report` | User | Monthly sales report |
| GET | `/stats` | User | Dashboard stats |
| GET | `/categories` | User | List distinct categories |
| GET | `/out-of-stock` | Admin | Products with stock = 0 |
| GET | `/category-pricing` | Admin | Get category pricing map |
| GET | `/:id` | User | Get single product |
| GET | `/:id/similar` | User | Get similar products |
| GET | `/:id/orders` | Admin | Get orders containing this product |
| POST | `/upload-csv` | Admin | Bulk import products from CSV |
| PUT | `/:id` | Admin | Update product fields |
| PATCH | `/:id/stock` | User | Update stock (cart add/remove) |
| DELETE | `/:id` | Admin | Delete product |
| POST | `/update-pricing-category` | Admin | Set markup % by category |
| POST | `/update-pricing-all` | Admin | Set global markup % |
| POST | `/clear` | Admin | Delete all products |

### 14.3 Orders (`/api/orders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/place` | User | Place order (creates ConfirmationGap) |
| GET | `/my` | User | Get user's orders |
| GET | `/confirm/:token` | No | Confirm order via email link |
| GET | `/pending` | Admin | Get pending pre-orders |
| PUT | `/:id/status` | Admin | Update order status |
| POST | `/finalize/:id` | Admin | Finalize order → MainOrderCSVData |
| POST | `/shipping-otp` | User | Send OTP for checkout email |
| POST | `/verify-shipping-otp` | User | Verify OTP for checkout email |

### 14.4 Cart (`/api/cart`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | User | Get cart items |
| POST | `/add` | User | Add item to cart |
| POST | `/remove` | User | Remove item from cart |
| POST | `/clear` | User | Clear cart |

### 14.5 Reviews (`/api/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/product/:productId` | User | Get reviews for product |
| POST | `/` | User | Create review |
| GET | `/check-eligibility/:productId` | User | Check if user can review |
| GET | `/admin/product/:productId` | Admin | Get all reviews (admin view) |

### 14.6 Admin (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/export-csv` | Admin | Download MainOrderCSVData as CSV |
| GET | `/users` | Admin | List all users |
| PUT | `/users/:id/role` | Admin | Change user role |
| DELETE | `/users/:id` | Admin | Delete user |

### 14.7 HHC Sync (`/api/hhc`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/quick-fetch` | Admin | Single-page fetch + save |
| POST | `/sync-all` | Admin | Multi-page sync with rate limiting |
| POST | `/test-token` | Admin | Test if bearer token is valid |
| GET | `/status` | Admin | Get current sync state |
| POST | `/stop` | Admin | Abort running sync |

### 14.8 Users (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Admin | List all users |
| GET | `/:id` | Admin | Get user details |
| PUT | `/:id` | Admin | Update user |
| DELETE | `/:id` | Admin | Delete user |
