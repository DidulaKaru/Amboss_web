# Amboss Admin CMS (`client/src/features/admin`)

This module provides an air-gapped, zero-DB-overhead administration gateway (`SYS.CTRL`) for Amboss catalog management and inventory stock control.

---

## What This Section Does

1. **Air-Gapped Access Gateway:**
   - Discreet entry point via a muted `SYS / CTRL` link in the About Us colophon (`client/src/pages/AboutUs/aboutUs.tsx`).
   - Private routes:
     - `/admin/login`: Monospace terminal authentication screen.
     - `/admin`: Guarded inventory dashboard.
2. **Session & Security Management:**
   - Communicates with Fastify server via HttpOnly cookie `amboss_admin_token` and `Authorization: Bearer <token>` fallback header.
   - Guarded via `AdminRoute.tsx`, which automatically redirects unauthorized users to `/admin/login`.
3. **Live Inventory Table & Real-Time Sync:**
   - Lists all catalog items with SKU, specifications, category, price (LKR), and stock.
   - Quick inline stock modifiers (`−`, numeric input, `+`) that save immediately to the backend (`PUT /api/v1/products/:id`) with debounce and visual saving indicators.
4. **Product Mutations:**
   - "NEW PRODUCT" modal to register new SKUs (`POST /api/v1/products`).
   - "EDIT" modal to update product names, descriptions, categories, prices, or images (`PUT /api/v1/products/:id`).
   - "DELETE" confirmation modal to safely remove discontinued products (`DELETE /api/v1/products/:id`).

---

## Directory Structure

```
admin/
├── AdminAuthContext.tsx     # Session provider (checks /api/v1/admin/me on mount, login, logout)
├── adminAuthInternal.ts     # Internal createContext instance
├── AdminDashboard.tsx       # Industrial inventory table, inline stock controls, CRUD modals
├── AdminLogin.tsx           # Monospace terminal login interface
├── AdminRoute.tsx           # Route guard component wrapping protected pages
├── types.ts                 # AdminUser and AdminAuthContextType definitions
├── useAdminAuth.ts          # Custom hook to consume AdminAuthContext
└── README.md                # This documentation
```

---

## Single Source of Truth (SSOT) References

- **Authentication Endpoints:**
  Calls Fastify backend:
  - `POST /api/v1/admin/login`
  - `POST /api/v1/admin/logout`
  - `GET /api/v1/admin/me`
- **Product Mutation Endpoints:**
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `PUT /api/v1/products/:id`
  - `DELETE /api/v1/products/:id`
- **Default Operator Credentials:**
  Configured in `server/.env.example` / `server/src/config/env.ts` (`ADMIN_USERNAME=admin`, default password `amboss2026`).

---

## How to Edit

### 1. Modifying the Admin Dashboard Columns
Edit [`client/src/features/admin/AdminDashboard.tsx`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/admin/AdminDashboard.tsx):
- The `<table>` headers and row cells are defined inside the `filteredProducts.map` block.
- Any new product fields must be added to `ProductRecord` interface in `AdminDashboard.tsx` and the Zod schema in `server/src/routes/products.ts`.

### 2. Changing the Admin Login Appearance
Edit [`client/src/features/admin/AdminLogin.tsx`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/admin/AdminLogin.tsx):
- Strictly follows [`client/DESIGN_PHILOSOPHY.md`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/DESIGN_PHILOSOPHY.md) (subtractive minimalism, no emojis, carbon zinc palettes).
