# Server API Routes (`server/src/routes`)

This directory houses the Fastify REST route plugins organized by business domain.

---

## Endpoint Specification

### 1. Health (`health.ts`)
- `GET /health`
  - Returns service status, uptime, and database connection state.
  - Public endpoint used by orchestrators and load balancers.

### 2. Materials (`materials.ts`)
- `GET /api/v1/materials`
  - Returns the list of active additive manufacturing materials (PLA+, PETG, ABS, TPU, PETG-CF, Nylon PA12, SLA Standard Resin) with their density ($\text{g/cm}^3$) and base pricing.

### 3. Products & Catalog (`products.ts`)
- `GET /api/v1/products`
  - Returns the active maker store products catalog. Supports optional `?category=` filtering.
- `GET /api/v1/products/:sku`
  - Returns a single product specification by SKU.
- `POST /api/v1/products` *(Admin Guarded)*
  - Creates a new product in the database.
- `PUT /api/v1/products/:id` *(Admin Guarded)*
  - Updates product properties or stock quantities.
- `DELETE /api/v1/products/:id` *(Admin Guarded)*
  - Deletes a product by SKU or database ID.

### 4. Quotes (`quote.ts`)
- `POST /api/v1/quote/calculate`
  - Validates model metrics (volume, surface area, bounding box), selected material, and infill parameters.
  - Returns itemized pricing in LKR enforcing the **250 LKR** minimum print threshold.

### 5. Orders (`orders.ts`)
- `POST /api/v1/orders/validate-cart`
  - Validates requested cart quantities against active stock in real-time.
- `POST /api/v1/orders/whatsapp-payload`
  - Generates itemized order text and delivery calculations for customer dispatch via WhatsApp.

### 6. Admin Authentication (`admin.ts`)
- `POST /api/v1/admin/login`
  - Validates credentials against `ADMIN_PASSWORD_HASH` using bcrypt.
  - Sets an `HttpOnly` cookie `amboss_admin_token` and returns a 24-hour JWT token.
- `POST /api/v1/admin/logout`
  - Clears the session cookie.
- `GET /api/v1/admin/me` *(Admin Guarded)*
  - Returns the verified operator identity.

### 7. Portfolio Gallery (`portfolioRoutes.ts`)
- `GET /api/v1/portfolio`
  - Returns active portfolio items ordered by display order with offline dataset fallback.
- `GET /api/v1/portfolio/:id`
  - Returns a single portfolio record by UUID.
- `POST /api/v1/portfolio` *(Admin Guarded)*
  - Creates a new portfolio item.
- `PUT /api/v1/portfolio/:id` *(Admin Guarded)*
  - Updates portfolio record properties (title, material, imageUrl, description, active status).
- `DELETE /api/v1/portfolio/:id` *(Admin Guarded)*
  - Deletes a portfolio record by UUID.

---

## Route Protection & Middleware

Protected routes apply the `verifyAdmin` preHandler hook:
```ts
import { verifyAdmin } from '../middleware/auth.js'

fastify.post('/api/v1/products', { preHandler: [verifyAdmin] }, async (request, reply) => {
  // Only authenticated admins can reach this block
})
```

`verifyAdmin` inspects:
1. `request.cookies.amboss_admin_token` (HttpOnly browser cookie).
2. `request.headers.authorization` (`Bearer <token>`).

---

## How to Add a New Route Plugin

1. Create a new TypeScript file `server/src/routes/<feature>.ts`.
2. Export a Fastify plugin async function:
   ```ts
   import type { FastifyPluginAsync } from 'fastify'

   export const featureRoutes: FastifyPluginAsync = async (fastify) => {
     fastify.get('/api/v1/feature', async (request, reply) => {
       return { success: true }
     })
   }
   ```
3. Register it inside [`server/src/app.ts`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/app.ts):
   ```ts
   await app.register(featureRoutes)
   ```
