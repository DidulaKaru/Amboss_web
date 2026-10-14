# Amboss Industries (amboss.lk) — Re-Engineering & Development Guide

This guide outlines the phased re-engineering of the Amboss Industries platform. It covers the transformation from a nested static frontend into a production-grade monorepo featuring a scroll-driven 3D hero animation, client-side STL quotation engine, PostgreSQL database, Fastify API, Maker Shop inventory system, and comprehensive automated test suites.

---

## Architecture Overview

```
amboss-monorepo/
├── client/                     # Vite + React (TypeScript) + TailwindCSS
│   ├── src/
│   │   ├── components/3d/      # Three.js / R3F Canvas & GLSL shaders
│   │   ├── features/quote/     # STL upload, Web Worker, 3D preview, quote form
│   │   ├── features/shop/      # Maker shop catalog, cart, WhatsApp checkout
│   │   ├── features/projects/  # Showcase (Pawsthetics, Rextro, etc.)
│   │   └── workers/            # STL binary volume parser Web Worker
│   └── tests/                  # Vitest + React Testing Library + Playwright E2E
├── server/                     # Fastify + TypeScript + Drizzle ORM
│   ├── src/
│   │   ├── db/                 # PostgreSQL schema, relations, migrations
│   │   ├── modules/materials/  # Filament & resin pricing formulas
│   │   ├── modules/products/   # Electronics catalog, categories, stock tracking
│   │   └── modules/quotes/     # Deterministic pricing engine & validation
│   └── tests/                  # Vitest API unit & integration tests
├── GUIDE.md                    # Master execution roadmap (this document)
├── PROGRESS.md                 # Live progress tracking file
└── package.json                # Monorepo root with npm/pnpm workspace scripts
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
npx playwright install
```
* `quote-flow.spec.ts`: Simulates a user landing on the home page, scrolling through the 3D hero, uploading a calibration STL, selecting PETG at $20\%$ infill, and verifying the instant LKR price is computed.
* `shop-checkout.spec.ts`: Simulates browsing an ESP32 board, adding it to cart, and confirming the generated WhatsApp order message contains correct item details and pricing.

---

## Execution Protocol for Antigravity

When executing tasks:
1. Always consult `PROGRESS.md` before starting a task to determine current status.
2. Execute one atomic task at a time.
3. Run corresponding automated tests to verify the task is complete.
4. Mark the task as `[x]` in `PROGRESS.md`, add notes or verification logs, and halt for user confirmation before proceeding to the next step.