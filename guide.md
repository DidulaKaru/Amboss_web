# Amboss Industries (amboss.lk) — Re-Engineering & Development Guide

This guide outlines the phased re-engineering of the Amboss Industries platform. It covers the transformation from a nested static frontend into a production-grade monorepo featuring a scroll-driven 3D hero animation, client-side STL quotation engine, PostgreSQL database, Fastify API, Maker Shop inventory system, and comprehensive automated test suites.

---

## Architecture Overview

```
amboss-monorepo/
├── client/                     # Vite + React (TypeScript) + TailwindCSS
│   ├── src/
│   │   ├── components/3d/      # Three.js Canvas (performance.now() timer) & GLSL shaders
│   │   ├── features/admin/     # Admin CMS (Catalog Operations + Portfolio Gallery)
│   │   ├── features/quote/     # STL upload, Web Worker, 3D preview, quote form
│   │   ├── features/shop/      # Maker shop catalog, cart, WhatsApp checkout
│   │   ├── pages/Projects/     # Dynamic portfolio masonry grid, lightbox, Pawsthetics case study
│   │   └── workers/            # STL binary volume parser Web Worker
│   ├── tests/                  # Vitest unit & integration tests
│   └── e2e/                    # Playwright E2E test suites (hero, quote, shop, admin, portfolio)
├── server/                     # Fastify + TypeScript + Drizzle ORM
│   ├── src/
│   │   ├── db/                 # PostgreSQL schema (materials, machines, products, quotes, portfolio_items)
│   │   ├── routes/             # Fastify REST endpoints (materials, machines, products, quotes, orders, portfolio, admin)
│   │   ├── middleware/         # Admin JWT & HttpOnly cookie authentication
│   │   └── services/           # Deterministic quote pricing & WhatsApp payload generator
│   ├── drizzle/                # PostgreSQL migration SQL files
│   ├── Dockerfile              # Multi-stage production container build
│   └── tests/                  # Vitest API integration test suites (admin, materials, products, orders, portfolio, quote, health)
├── guide.md                    # Master re-engineering and development architecture guide (this document)
├── PROGRESS.md                 # Live milestone and task progress tracker
└── package.json                # Monorepo root with npm workspace orchestration
```

---

## Phase 1: Repository Restructuring & Monorepo Setup

### Objectives
* Normalize the nested directory structure (`docs/Amboss-main/frontend` $\rightarrow$ `client/`).
* Remove legacy build artifacts and obsolete duplicates.
* Configure root workspaces and centralized execution scripts.

### Step 1.1: Directory Migration
Execute the file restructuring:
```bash
# 1. Create client directory
mkdir -p client

# 2. Move active Vite frontend contents to client/
mv docs/Amboss-main/frontend/* client/
mv docs/Amboss-main/frontend/.* client/ 2>/dev/null || true

# 3. Preserve critical public assets
# Ensure client/public/images/ retains all product, project, and news assets

# 4. Remove redundant nested folders and compiled artifacts
rm -rf docs/Amboss-main/docs
rm -rf docs/Amboss-main/frontend
```

### Step 1.2: Root Workspace Configuration
Create a root `package.json` to orchestrate both `client` and `server`:
```json
{
  "name": "amboss-monorepo",
  "version": "2.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=client",
    "dev:all": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### Step 1.3: Quality Gates & Verification
1. Run `npm install` at the root.
2. Run `npm run dev:client` and verify the existing website boots cleanly at `http://localhost:5173`.
3. Verify all images in `/shop` and `/projects` resolve correctly.
4. Update `PROGRESS.md` upon completion.

---

## Phase 2: Approach B — Scroll-Driven 3D Transformation (Hero Section)

### Objectives
* Implement the "From Concept to Reality" interactive hero experience.
* Single-mesh rendering driven by scroll progress with dynamic GLSL material shading:
  * **$0.0 \le uProgress < 0.33$:** 2D Engineering Blueprint (glowing cyan wireframe edges, blueprint grid background).
  * **$0.33 \le uProgress < 0.66$:** SolidWorks CAD Viewport (matte studio clay/gray PBR with visible parametric topology).
  * **$0.66 \le uProgress \le 1.0$:** Physical 3D Printed Part (procedural FDM layer lines, micro-roughness for PA12-CF/PETG).

### Step 2.1: Dependencies Installation
In `client/`:
```bash
npm install three @types/three gsap @studio-freight/lenis
```

### Step 2.2: Hero Canvas & GSAP Scroll Setup
Create `client/src/components/3d/HeroCanvas.tsx`:
1. Use an HTML5 `<canvas id="hero-webgl">` pinned inside a `300vh` scroll track container.
2. Integrate `lenis` for smooth mouse-wheel damping.
3. Configure `gsap.timeline({ scrollTrigger: { trigger: "#hero-scroll-track", start: "top top", end: "bottom bottom", scrub: 1, pin: true } })`.
4. Bind model rotation and custom shader uniform `uProgress` to the timeline.

### Step 2.3: Custom GLSL Shader Implementation
Create `client/src/components/3d/shaders/MorphShader.ts`:
* **Vertex Shader:**
  * Pass normalized object height:
    $$vHeight = \frac{\text{position.y} - \text{min.y}}{\text{max.y} - \text{min.y}}$$
  * Compute screen-space view vectors and normals.
* **Fragment Shader:**
  * Define three states interpolated by $uProgress \in [0.0, 1.0]$:
    1. *Blueprint Stage:* Calculate edge intensity using screen-space derivatives:
       $$\text{edge} = \text{fwidth}(\text{vNormal.z})$$
       Mix `#0B1D3A` deep blueprint blue with `#00D2FF` electric cyan line highlights.
    2. *CAD Viewport Stage:* Studio matte neutral gray (`#8A9099`) with Blinn-Phong specular roughness ($0.35$) and simulated CAD edge lines.
    3. *3D Print Stage:* Procedural layer-line displacement:
       $$\text{layerPattern} = \sin\left(\frac{vHeight}{\text{uLayerPitch}}\right)$$
       Surface roughness modulated with high-frequency noise simulating carbon-fiber texture (PA12-CF).

### Step 2.4: Verification & Performance Target
* 60 FPS minimum on modern desktop and mobile browsers.
* Smooth scrub response with zero geometry thrashing or memory leaks on scroll.
* Update `PROGRESS.md`.

---

## Phase 3: Client-Side STL Instant Quotation Engine

### Objectives
* Allow instant upload and rendering of `.stl` (binary and ASCII) files without overloading the server.
* Compute mesh volume, bounding box, surface area, and mass estimation on the client using a Web Worker.
* Output an itemized instant quotation in Sri Lankan Rupees (LKR).

### Step 3.1: Mathematical Formulation
* **Mesh Volume via Divergence Theorem:**
  For each triangle with vertices $\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3$, the signed tetrahedral volume is:
  $$V_{\text{tet}} = \frac{1}{6} \left( \mathbf{v}_1 \cdot (\mathbf{v}_2 \times \mathbf{v}_3) \right)$$
  Total volume:
  $$V_{\text{model}} = \sum_{i=1}^{N} V_{\text{tet}, i}$$
* **Mass Estimation:**
  Given shell thickness $t_s$ ($1.2\,\text{mm}$) and internal infill ratio $\rho_{\text{infill}} \in [0.1, 1.0]$:
  $$V_{\text{shell}} \approx A_{\text{surface}} \times t_s$$
  $$V_{\text{core}} = \max(0, V_{\text{model}} - V_{\text{shell}})$$
  $$M_{\text{effective}} = \left( V_{\text{shell}} + (V_{\text{core}} \times \rho_{\text{infill}}) \right) \times \rho_{\text{material}}$$

### Step 3.2: Web Worker Implementation
Create `client/src/workers/stlVolumeWorker.ts`:
1. Receive raw `ArrayBuffer` from the file dropzone.
2. Parse header (Binary vs. ASCII STL).
3. Compute bounding box $(X, Y, Z)\,\text{mm}$, total surface area $A_{\text{surface}}\,\text{mm}^2$, and closed mesh volume $V_{\text{model}}\,\text{cm}^3$.
4. Check for unclosed (non-manifold) meshes and post results or warnings back to the main thread.

### Step 3.3: Interactive Quotation UI
Create `client/src/features/quote/`:
* `STLDropzone.tsx`: Drag-and-drop zone with drag-over visual feedback and file validation ($\le 50\,\text{MB}$).
* `PartViewer.tsx`: OrbitControls 3D preview using Three.js with automatic mesh centering and ground-plane grid display.
* `QuoteCalculator.tsx`:
  * Material selector: PLA, PETG, ABS, TPU, PA12-CF, Standard Resin, Tough Resin.
  * Infill density slider ($10\%$ to $100\%$).
  * Layer height options ($0.12\,\text{mm}$, $0.16\,\text{mm}$, $0.20\,\text{mm}$, $0.28\,\text{mm}$).
  * Target printer indicator (e.g. alerts if part exceeds Bambu A1 $256^3\,\text{mm}$ and auto-routes to Creality K2 Plus $350^3\,\text{mm}$).
  * Dynamic price breakdown:
    $$\text{Total Price} = \text{Material Cost} + \text{Machine Time Cost} + \text{Handling Fee}$$
  * WhatsApp direct order forwarding button populated with dimensions, volume, material, and price breakdown.

---

## Phase 4: Backend API & PostgreSQL Database

### Objectives
* Establish a robust, high-performance backend using Fastify, TypeScript, and Drizzle ORM.
* Implement structured relational storage for maker store products, 3D printing materials, machine operational rates, and quotes.

### Step 4.1: Server Setup
Inside `server/`:
```bash
npm init -y
npm install fastify @fastify/cors @fastify/helmet drizzle-orm postgres dotenv zod
npm install -D typescript @types/node tsx drizzle-kit vitest
```

### Step 4.2: Database Schema (`server/src/db/schema.ts`)
Define relational schemas:
1. `materials`:
   * `id`: UUID (Primary Key)
   * `name`: string (e.g., "PA12 Carbon Fiber", "PLA+", "SLA Tough Resin")
   * `type`: enum (`fdm`, `sla`)
   * `density_g_cm3`: decimal (e.g., $1.24$ for PLA, $1.02$ for PA12-CF)
   * `cost_per_gram_lkr`: decimal
   * `is_active`: boolean
2. `machines`:
   * `id`: UUID
   * `name`: string ("Creality K2 Plus", "Bambu Lab A1", "Elegoo Saturn 4 Ultra")
   * `type`: enum (`fdm`, `sla`)
   * `build_x_mm`, `build_y_mm`, `build_z_mm`: integer
   * `hourly_rate_lkr`: decimal
   * `is_online`: boolean
3. `products` (Maker Electronics Catalog):
   * `id`: UUID
   * `sku`: string (unique)
   * `name`: string (e.g., "ESP32-WROOM-32D Development Board", "SG90 Micro Servo")
   * `category`: enum (`microcontrollers`, `sensors`, `actuators`, `prototyping`, `tools`)
   * `description`: text
   * `price_lkr`: decimal
   * `stock_quantity`: integer
   * `image_url`: string
4. `quotes`:
   * `id`: UUID
   * `bounding_x`, `bounding_y`, `bounding_z`: decimal
   * `volume_cm3`: decimal
   * `material_id`: foreign key $\rightarrow$ `materials.id`
   * `machine_id`: foreign key $\rightarrow$ `machines.id`
   * `infill_percentage`: integer
   * `estimated_weight_g`: decimal
   * `total_price_lkr`: decimal
   * `customer_phone`: string
   * `status`: enum (`pending`, `confirmed`, `in_production`, `dispatched`, `completed`)

### Step 4.3: API Endpoints
* `GET /api/v1/materials` — Retrieve active filaments, resins, densities, and pricing.
* `GET /api/v1/products` — Retrieve electronics catalog with live inventory counters.
* `POST /api/v1/quote/calculate` — Validate geometric parameters and return official price quotation.
* `POST /api/v1/orders/whatsapp-payload` — Generate validated cart summary and reference code for WhatsApp checkout.

---

## Phase 5: Maker Shop Migration & State Management

### Objectives
* Transition `/shop` from static hardcoded arrays to the live PostgreSQL backend.
* Maintain stock validation to prevent ordering out-of-stock microcontrollers.
* Preserve local Galle and University of Ruhuna free pickup logistics banners.

### Step 5.1: Catalog Store Refactoring
* Create `client/src/features/shop/useProducts.ts` with SWR or TanStack Query for cache invalidation.
* Update cart state in `client/src/features/shop/cartContext.tsx` to validate quantities against real-time server inventory.
* Preserve customer-friendly WhatsApp checkout format directing orders to Amboss management (`+94779902796`).

---

## Phase 6: Automated Testing & Validation Framework

### Objectives
* Maintain test coverage across mathematical calculations, UI flows, and API logic.
* Ensure zero regressions during continuous development.

### Step 6.1: Client Testing (Vitest + React Testing Library)
In `client/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### Test Suites to Implement:
1. `stlVolumeWorker.test.ts`:
   * Verify volume computation against a standard calibration cube ($20\times 20\times 20\,\text{mm} = 8.00\,\text{cm}^3$).
   * Verify handling of inverted normals and non-manifold facets.
2. `QuoteCalculator.test.tsx`:
   * Test recalculation of prices when shifting from PLA to PA12-CF.
   * Verify warning alerts triggered when model bounds exceed printer dimensions.
3. `CartContext.test.tsx`:
   * Test adding, updating, and preventing over-stock cart additions.

### Step 6.2: Server Testing (Vitest + Supertest)
In `server/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

#### Test Suites to Implement:
1. `pricingEngine.test.ts`:
   * Test deterministic quotation calculation given fixed volume, infill, and material parameters.
   * Test edge cases (zero volume, negative bounds, missing materials).
2. `productsApi.test.ts`:
   * Test `GET /api/v1/products` returns valid schema with active items.
   * Test stock validation checks.

### Step 6.3: End-to-End Testing (Playwright)
Install Playwright in `client/`:
```bash
npx playwright install --with-deps chromium
```
* `hero-scroll.spec.ts`: Validates 3D canvas viewport rendering, navbar links, and initial scroll-triggered states.
* `quote-flow.spec.ts`: Simulates navigating to the instant quote page, verifying STL dropzone upload, selecting material parameters, minimum print threshold validation (250 LKR), and WhatsApp quotation formatting.
* `shop-checkout.spec.ts`: Tests browsing maker hardware, selecting variant dropdowns (LED colors, Jumper Cable pinouts), verifying discrete "In stock" indicators without raw stock exposure, adding items to cart, and confirming free pickup and courier fee logic.
* `admin-cms.spec.ts`: Tests the discreet colophon `SYS / CTRL` link from About Us, authentication rejection on invalid credentials, successful login to Admin Dashboard, table display of real-time inventory, and secure logout.
* `portfolio.spec.ts`: Validates dynamic photo grid rendering without rigid aspect ratios, lightbox modal inspection with ESC listeners, `/news` demolition and graceful redirect to `/projects`, and the Admin CMS portfolio management tab.

#### Test Execution & Verification Status:
* **Vitest Suite:** **42/42 passing tests** (21 Client tests + 21 Server tests across 12 test suites).
* **Playwright Suite:** **7/7 passing tests** across desktop and mobile viewports.
* **Build & Quality:** `npm run build` and `npm run lint` execute with 0 errors.

---

## Phase 7: Single-Owner Admin CMS & Catalog Operations

### Objectives
* Provide an air-gapped, zero-DB-overhead administrative control panel for Amboss catalog and portfolio management.
* Implement environment-driven bcrypt password verification (`ADMIN_PASSWORD_HASH`) and secure HttpOnly JWT session cookies (`amboss_admin_token`).
* Provide discreet public discovery via a low-contrast `SYS / CTRL` link in the About Us colophon.
* Implement high-speed inline stock adjustments and full product mutation capabilities (create, edit, delete).

### 7.1 Server Authentication & Fastify JWT
* Middleware: `server/src/middleware/auth.ts` verifies incoming JWT tokens from either the `amboss_admin_token` HttpOnly cookie or the `Authorization: Bearer <token>` header.
* Endpoints:
  - `POST /api/v1/admin/login`: Compares bcrypt hash and issues a 24-hour JWT token.
  - `POST /api/v1/admin/logout`: Clears the HttpOnly cookie.
  - `GET /api/v1/admin/me`: Returns the verified operator identity.
  - `POST /api/v1/products`, `PUT /api/v1/products/:id`, `DELETE /api/v1/products/:id`: Protected mutation endpoints.

### 7.2 Client Admin Interface
* `AdminRoute.tsx`: Guarded route protecting `/admin`, redirecting unauthenticated traffic to `/admin/login`.
* `AdminLogin.tsx`: Monospace industrial terminal login.
* `AdminDashboard.tsx`:
  - Dual-view switcher tabs: `[ Products & Stock ]` and `[ Portfolio Gallery ]`.
  - Real-time catalog metrics: Total SKUs, In Stock, Low Stock (<10), Depleted.
  - Fast inline stock adjusters (`−`, numerical input, `+`) with live API synchronization.
  - Modal workflows for creating and editing catalog products.
  - Deletion dialog with safety confirmation.

---

## Phase 8: News Subsystem Demolition & Dynamic Portfolio Grid (`/projects`)

### Objectives
* Demolish the obsolete News page (`/news`), homepage news carousel, and all related navigation links.
* Transform the `/projects` page into a dynamic, responsive showcase gallery powered by backend persistence while preserving the Pawsthetics hero case study.
* Add database backing and management endpoints for portfolio items.

### 8.1 News Subsystem Demolition
* Header navigation (`navbar.tsx`): Removed "News" link.
* Footer navigation (`footer.tsx`): Removed "News" link.
* Router (`App.tsx`): Demolished `/news` route and removed obsolete component imports (`News.tsx`, `NewsCarousel.tsx`, `news/data.ts`). Added clean redirect from `/news` to `/projects`.
* Sitemap (`sitemap.xml`): Removed `/news` entry.

### 8.2 Relational Portfolio Schema & Fastify Endpoints
* Table `portfolio_items` (`server/src/db/schema.ts`):
  * `id`: UUID (Primary Key)
  * `title`: string (not null)
  * `category`: string (optional, defaults to `'general'`)
  * `material`: string (optional, material specification)
  * `imageUrl`: string (not null, asset path or remote URL)
  * `aspectRatio`: string (optional, defaults to `'auto'`)
  * `description`: text (optional)
  * `displayOrder`: integer (optional, defaults to 0)
  * `isActive`: boolean (defaults to `true`)
  * `createdAt`: timestamp
* REST Endpoints (`server/src/routes/portfolioRoutes.ts`):
  * `GET /api/v1/portfolio`: Public endpoint returning active portfolio items with in-memory fallback.
  * `GET /api/v1/portfolio/:id`: Public single item retrieval.
  * `POST /api/v1/portfolio`: Admin only (`verifyAdmin`), Zod-validated creation.
  * `PUT /api/v1/portfolio/:id`: Admin only (`verifyAdmin`), partial item update.
  * `DELETE /api/v1/portfolio/:id`: Admin only (`verifyAdmin`), item removal.

### 8.3 Dynamic Portfolio Grid & Inspection Lightbox (`client/src/pages/Projects/`)
* Preserved "Featured Case Study: Pawsthetics by AMBOSS" hero section intact.
* Built `PortfolioGrid.tsx` with resilient API fetching and static fallback.
* Rendered items in responsive CSS column masonry (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4`).
* Built full-viewport Lightbox modal for inspecting print layer details, material specs, and functional applications with `[ESC]` key listeners.

---

## Phase 8.6: Dynamic Photo Grid Simplification & Performance/CLS Optimization

### Objectives
* Simplify the portfolio subsystem by removing category and display order constraints.
* Enable fluid natural photo sizing without forced aspect-ratio crops.
* Resolve browser inspection warnings regarding deprecated Three.js modules and lazy-loaded image layout shifts.

### 8.6.1 Subsystem Simplification
* **Public Gallery ([PortfolioGrid.tsx](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/pages/Projects/components/PortfolioGrid.tsx)):**
  * Removed category filter pills (`All`, `FDM & CF`, `Resin SLA`, `Prosthetics`, `Molding & CAD`).
  * Removed category badge overlays on cards.
  * Removed category header tags in the inspection lightbox.
* **Admin CMS ([AdminDashboard.tsx](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/admin/AdminDashboard.tsx)):**
  * **Add/Edit Modal:** Removed `Category`, `Aspect Ratio`, and `Display Order` inputs. Streamlined to: Project Title, Material Specification, Image Asset URL, Description, and Visibility toggle.
  * **Table & Toolbar:** Removed category filter buttons; removed `Order`, `Category`, and `Ratio` columns. Retained: `Artifact / Visual`, `Material Specification`, `Status` (Active toggle), and `Actions` (Edit, Delete).
  * **Metrics:** Simplified to `Total Projects`, `Active in Gallery`, `With Material Specs`, and `Hidden / Inactive`.
* **Dynamic Natural Sizing:**
  * Removed rigid aspect-ratio locks (`aspect-[3/4]`, `aspect-square`, `aspect-[16/10]`).
  * Applied `w-full h-auto block object-cover` within CSS column masonry, allowing photos to scale to their natural proportions.

### 8.6.2 Browser Inspection Warnings Resolution
* **THREE.Clock Deprecation Fix:**
  * In `client/src/components/3d/HeroCanvas.tsx`, replaced deprecated `THREE.Clock` with high-resolution `performance.now()`, eliminating `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead` console warnings.
* **Cumulative Layout Shift (CLS) Elimination:**
  * Added explicit `width` and `height` attributes and aspect-ratio styling across all images in the application to prevent 0x0 initial bounding boxes before image load:
    * `navbar.tsx`: `width={140} height={28}` (removed lazy-loading on sticky header logo).
    * `heroSection.tsx`: `width={1920} height={1080}`.
    * `footer.tsx`: `width={140} height={28}`.
    * `capabilities.tsx`: `width={600} height={400}`.
    * `products.tsx`: `width={640} height={360}`.
    * `projects.tsx`: `width={1920} height={1080}` for hero, `width={200} height={48}` for logo.
    * `PortfolioGrid.tsx`: `width={800} height={600}` on cards, `width={1200} height={900}` on lightbox.
    * `ProductCard.tsx`: `width={400} height={400}`.
    * `Cart.tsx`: `width={56} height={56}`.
    * `AdminDashboard.tsx`: `width={32} height={32}` for products, `width={48} height={48}` for portfolio.

---

## Phase 8.7: Admin Deletion Bug Resolution & Login UX Streamlining

### Objectives
* Diagnose and resolve `400 Bad Request` errors during product and portfolio item deletions in the Admin CMS.
* Eliminate empty body parsing failures in Fastify without sacrificing schema validation.
* Streamline user-facing inputs on the administrative login screen.

### 8.7.1 Deletion 400 Bad Request Root Cause Resolution
* **Client Request Headers ([AdminDashboard.tsx](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/admin/AdminDashboard.tsx)):**
  * Updated `getAuthHeaders(includeContentType = true)` helper.
  * In `handleDeleteConfirm` and `handleDeletePortfolioConfirm`, pass `getAuthHeaders(false)` so body-less `DELETE` calls do not send `Content-Type: application/json`.
* **Fastify Content-Type Parser ([app.ts](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/app.ts)):**
  * Registered custom `application/json` content-type parser treating empty or whitespace-only bodies as `undefined` instead of throwing `FST_ERR_CTP_EMPTY_JSON_BODY` (400 Bad Request).
* **Automated Regression Tests:**
  * Added regression test cases in `client/tests/adminAuth.test.ts`, `server/tests/admin.test.ts`, and `server/tests/portfolio.test.ts` verifying that `DELETE` requests succeed with or without `Content-Type` headers.

### 8.7.2 Admin Login UX Streamlining
* In `client/src/features/admin/AdminLogin.tsx`, removed decorative badges and simplified field labels to:
  * Username (`#admin-username`)
  * Password (`#admin-password`)
  * Submit button ("ENTER")

---

## Phase 9: Production Deployment Architecture & Zero-Cost Cloud Infrastructure

### Objectives
* Configure the monorepo for production deployment across a $0 budget architecture.
* Guarantee 100% SPA routing reliability on edge hosting.
* Generate versioned SQL migrations for Neon PostgreSQL.
* Containerize the Fastify backend for Koyeb or Fly.io.

### 9.1 Zero-Cost Target Architecture
* **Frontend:** **Cloudflare Pages** (unlimited bandwidth, 500 builds/month, custom domain `amboss.lk`, global edge CDN).
* **Backend:** **Koyeb** (1 Nano Web Service with 512 MB RAM, Singapore `sin` region, native Docker support, auto HTTPS).
* **Database:** **Neon Serverless Postgres** (0.5 GB storage, autoscaling compute, Singapore `ap-southeast-1` region, pooled connection).
* **Media Assets:** **Cloudflare Pages `public/images/`** with **Cloudflare R2** (10 GB free, zero egress fees) for dynamic uploads.

### 9.2 Cloudflare Pages SPA Routing
* Created `client/public/_redirects`:
  ```
  /*    /index.html   200
  ```
* Ensures that client-side routes (`/shop`, `/projects`, `/quote`, `/about-us`, `/admin`) return HTTP 200 OK on page refreshes rather than 404 errors.

### 9.3 Neon PostgreSQL Schema Migrations
* Updated `server/drizzle.config.ts` to use `dotenv/config` and `process.env.DATABASE_URL`.
* Generated initial PostgreSQL migration `server/drizzle/0000_little_greymalkin.sql` containing all 5 database tables (`materials`, `machines`, `products`, `quotes`, `portfolio_items`).
* Executable via:
  ```bash
  npx drizzle-kit migrate
  npm run db:seed
  ```

### 9.4 Backend Containerization
* Created production multi-stage `server/Dockerfile`:
  * **Stage 1 (Builder):** Compiles TypeScript source to `dist/` using `node:20-alpine`.
  * **Stage 2 (Runner):** Installs production dependencies only (`npm ci --omit=dev`), runs as unprivileged `node` user, and listens on `0.0.0.0:4000`. Image size ~150 MB.
* Created `server/.dockerignore` to keep builds minimal.
* Created `client/.env.example` and `server/.env.example` documenting all production environment variables.

---

## Architectural Principles: Modularity & Single Source of Truth (SSOT)

To prevent code duplication, configuration drift, and business logic divergence across the monorepo, every shared business value must have exactly one source of truth:

1. **Logistics & Delivery Policies:**
   - **Client:** `client/src/config/logistics.ts` defines `MINIMUM_PRINT_PRICE_LKR` (250), `LOGISTICS_CONFIG` (pickup locations, courier rates, Galle local delivery rules), `calculateCourierFee()`, and `calculateShopDeliveryFee()`.
   - **Server:** `server/src/config/logistics.ts` mirrors these exact rules for order validation and WhatsApp payload generation.
2. **Contact & Company Identity:**
   - `client/src/config/site.ts` defines official WhatsApp phone (`+94779902796`), email, social media links, and physical workshop coordinates in Galle.
3. **Materials Master Catalog:**
   - Client definitions in `client/src/features/quote/types.ts` and server seed data in `server/src/db/seedData.ts` define identical material densities and base manufacturing rates.
4. **Design Philosophy:**
   - `client/DESIGN_PHILOSOPHY.md` serves as the absolute authority on visual style: zero emojis anywhere on the platform, Dieter Rams / Teenage Engineering / Linear inspired subtractive minimalism, high-contrast dark neutrals, and 1.5px monochrome SVG icons.

---

## Execution Protocol

When updating the codebase:
1. Always consult `PROGRESS.md` to confirm milestone status.
2. Ensure any new business constant is placed in the designated config module (SSOT).
3. Run all automated test suites (`npm test`, `npm run test:e2e`) and linters (`npm run lint`) before committing.
4. Maintain documentation integrity across all folder-level README files.