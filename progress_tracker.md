# Amboss Platform Development — Progress Tracker

This document tracks execution status across all development phases. Update this file as each task is implemented and tested.

**Status Legend:**
- `[ ]` Not Started
- `[/]` In Progress
- `[x]` Completed & Verified
- `[-]` Blocked / Awaiting Input

---

## Phase 1: Repository Restructuring & Monorepo Setup
- [x] **Task 1.1:** Move `docs/Amboss-main/frontend` to `client/` and preserve `public/images/`.
- [x] **Task 1.2:** Clean up obsolete `docs/Amboss-main/docs` build directory and duplicate CNAME/README files.
- [x] **Task 1.3:** Create root `package.json` with workspace configuration (`client`, `server`) and concurrent scripts.
- [x] **Task 1.4:** Verify `npm run dev:client` boots the existing application without broken links or missing assets.

*Verification Notes:*
> Monorepo structure successfully established. `docs/Amboss-main/frontend` migrated to `client/` with all 36 public images intact. Root `package.json` created with npm workspaces (`client`, `server`). Obsolete `docs/Amboss-main/docs/dist` removed. Both `npm run dev:client` (browser verified with zero console errors or missing assets) and `npm run build` (clean Vite production compilation + 404.html generation) execute cleanly.

---

## Phase 2: Scroll-Driven 3D Transformation (Hero Section)
- [x] **Task 2.1:** Install Three.js, GSAP, and smooth scrolling dependencies in `client/`.
- [x] **Task 2.2:** Build pinned 3D Canvas component (`HeroCanvas.tsx`) tied to scroll position via GSAP ScrollTrigger.
- [x] **Task 2.3:** Implement custom GLSL shader (`MorphShader.ts`) with Blueprint $\rightarrow$ CAD Viewport $\rightarrow$ 3D Print material transitions.
- [x] **Task 2.4:** Benchmark and ensure 60 FPS performance during full scroll scrubbing on desktop and mobile viewports.

*Verification Notes:*
> Three.js, GSAP, and Lenis integrated with full single-draw-call performance. Custom GLSL `MorphShader` successfully morphs across all three phases: 2D Blueprint (`#00D2FF` electric cyan wireframe with grid) $\rightarrow$ SolidWorks CAD Viewport (matte studio clay with parametric edge topology) $\rightarrow$ Industrial 3D Print (procedural FDM layer lines and PA12-CF carbon fiber texture). Verified via live browser automated scrubbing and clean production build with 0 TypeScript/WebGL errors.

---

## Phase 3: Instant STL Quotation Engine
- [x] **Task 3.1:** Implement STL parsing and tetrahedral volume algorithm in `stlVolumeWorker.ts`.
- [x] **Task 3.2:** Write unit tests for volume and bounding box calculation with a standard $20\text{mm}$ calibration cube.
- [x] **Task 3.3:** Build drag-and-drop file upload zone with interactive Three.js 3D part preview.
- [x] **Task 3.4:** Build material, infill, and layer height quotation form with dynamic LKR price computation.
- [x] **Task 3.5:** Connect quotation summary to direct WhatsApp checkout payload generation with prominent disclaimer.

*Verification Notes:*
> Client-side STL parser implemented using Divergence Theorem for signed tetrahedral volume and cross products for surface area. Verified with automated Vitest unit tests against a standard 20mm calibration cube ($8000\,\text{mm}^3 / 8.0\,\text{cm}^3$, $2400\,\text{mm}^2 / 24.0\,\text{cm}^2$, $20\times 20\times 20\,\text{mm}$). Built Three.js `PartViewer` with OrbitControls, grid, wireframe, and dynamic material coloring. Integrated `QuoteForm` with materials matrix (PLA, PLA+, PETG, ABS, TPU, PA12-CF, Standard/Tough Resin), infill density slider, layer quality options, build envelope printer routing, and WhatsApp checkout payload generation with prominent estimation disclaimer. Clean production build verified.

---

## Phase 4: Backend API & PostgreSQL Database
- [x] **Task 4.1:** Initialize Fastify TypeScript project in `server/` with linting and scripts.
- [x] **Task 4.2:** Configure Drizzle ORM and design schemas for `materials`, `machines`, `products`, and `quotes`.
- [x] **Task 4.3:** Create database seed scripts with Amboss machine specs (K2 Plus, Elegoo Centauri Carbon, Bambu A1, Saturn 4 Ultra) and material rates.
- [x] **Task 4.4:** Implement API routes (`/materials`, `/machines`, `/products`, `/quote/calculate`, `/orders/whatsapp-payload`, `/health`) with Zod schema validation.
- [x] **Task 4.5:** Write integration test suite verifying backend calculation, printer routing, and API responses.

*Verification Notes:*
> Fastify v5 application architecture implemented in `server/` with Drizzle ORM schemas (`materials`, `machines`, `products`, `quotes`), security plugins (`@fastify/helmet`, `@fastify/cors`), and Zod validation. Seed dataset built with all 7 active materials (PLA+ Rs 20/g, PETG Rs 22/g, ABS Rs 25/g, TPU Rs 35/g, PETG-CF Rs 35/g, Lite Resin Rs 35/g, Clear Resin Rs 40/g), 5 machines with build volume and enclosure constraints, and the maker electronics catalog. Integration test suite passing 11/11 tests across 5 test suites covering geometry pricing, printer routing (ABS/PETG-CF to enclosed Elegoo Centauri Carbon / Creality K2 Plus, SLA to Saturn 4 Ultra), catalog filtering, and WhatsApp order payload generation. Monorepo-wide test and build pass cleanly.

---

## Phase 5: Maker Shop Migration
- [x] **Task 5.1:** Seed PostgreSQL with existing electronics catalog (Arduino, ESP32, sensors, accessories).
- [x] **Task 5.2:** Refactor `client/src/features/shop` to fetch catalog items from Fastify API.
- [x] **Task 5.3:** Connect cart checkout to live backend inventory validation.
- [x] **Task 5.4:** Verify Galle & University of Ruhuna local delivery/pickup logistical alerts work seamlessly.

*Verification Notes:*
> Maker store architecture migrated to live Fastify and PostgreSQL backend with robust client fallback. Seed dataset expanded in `server/src/db/seedData.ts` with all 18 electronic catalog items across 5 categories (`microcontrollers`, `sensors`, `actuators`, `prototyping`, `accessories`) with verified images and inventory counts. Created modular `client/src/features/shop` architecture including `useProducts` hook, `cartContext` state management, `LogisticsBanner`, `ProductCard`, and `Cart` drawer. Implemented `POST /api/v1/orders/validate-cart` live inventory verification preventing over-stock additions and out-of-stock orders.
> **Business Logic & Logistics Upgrades:**
> - Minimum 3D print quote order enforced at 250 LKR across client and server.
> - Free local pickup points: Faculty of Engineering, University of Ruhuna AND Amboss Shop in Hapugala.
> - Courier fees: Islandwide courier computed dynamically at 500 LKR for the first 1kg, +150 LKR for each additional 1kg; flat 500 LKR for electronics maker cart.
> - **Design Philosophy & Visual Discipline:** Created `client/DESIGN_PHILOSOPHY.md` establishing strict anti-vibe-coded standards (subtractive minimalism, technical clarity, zero emojis anywhere on the platform, Dieter Rams / Teenage Engineering / Linear inspired industrial aesthetic).
> - All 22 tests pass across monorepo test suites (client: 8/8, server: 14/14) and production build compiles cleanly.

---

## Phase 6: Automated Testing & End-to-End Validation
- [x] **Task 6.1:** Set up Vitest test runner across both `client` and `server` workspaces.
- [x] **Task 6.2:** Achieve unit test coverage for math utilities, quote calculators, and store cart logic.
- [x] **Task 6.3:** Implement Playwright E2E tests for the 3D scroll hero, quotation engine, and maker store checkout.
- [x] **Task 6.4:** Configure GitHub Actions CI workflow to run linting, tests, and builds on push and pull requests.

*Verification Notes:*
> Automated testing and validation framework successfully established:
> 1. **Vitest Unit & Integration Suites:** 31 tests passing across 9 test files (`client`: 17 tests across `stlParser.test.ts`, `cart.test.ts`, `pricing.test.ts`, `groupProducts.test.ts`; `server`: 14 tests across `health.test.ts`, `materials.test.ts`, `products.test.ts`, `quote.test.ts`, `orders.test.ts`).
> 2. **Shop Architecture & Business Logic:**
>    - Simplified shop card and cart design with zero emojis and no exposed stock counts (displays clean `In stock` / `Out of stock` status dots).
>    - Added Red and Green 3mm LEDs with 500 stock each to database seeds and fallback data.
>    - Unified product cards for LEDs (Color dropdown for Red/Green) and Jumper Cables (Termination dropdown for M-M, M-F, F-F) via `groupProducts.ts`.
>    - Enforced 250 LKR minimum 3D print pricing, free University of Ruhuna & Hapugala shop pickups, and dynamic courier fee calculations (500 for 1st kg, +150 per extra kg; flat 500 for electronics).
> 3. **Playwright End-to-End Suite:** 3 complete specs passing in under 5 seconds (`hero-scroll.spec.ts`, `quote-flow.spec.ts`, `shop-checkout.spec.ts`) testing navigation, 3D STL upload & configurator, variant selection, and cart checkout.
> 4. **GitHub Actions CI:** Configured `.github/workflows/ci.yml` running linter, all Vitest test suites, production build compilation, and Playwright Chromium E2E testing on push and pull requests.
> 5. **Clean Builds & Linting:** `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build` all pass with 0 errors.

## Phase 7: Single-Owner Admin CMS & Catalog Operations

### Architectural Objective
Provide an air-gapped, zero-DB-overhead administrative control panel for Amboss store inventory management using environment-based bcrypt authentication and HttpOnly JWT cookies.

### 7.1 Server Authentication & Route Protection
- [x] Install `@fastify/cookie`, `@fastify/jwt`, and `bcryptjs` in `server/`.
- [x] Add `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET` to `server/.env.example`.
- [x] Implement `server/src/middleware/auth.ts` with `verifyAdmin` hook checking the `amboss_admin_token` cookie and Bearer header.
- [x] Register `POST /api/v1/admin/login`, `POST /api/v1/admin/logout`, and `GET /api/v1/admin/me`.
- [x] Apply `verifyAdmin` to mutations on products (`POST /api/v1/products`, `PUT /api/v1/products/:id`, `DELETE /api/v1/products/:id`).

### 7.2 Discreet Client Access & Guarded Routing
- [x] Place low-contrast `SYS / CTRL` link in `AboutUs/aboutUs.tsx` colophon pointing to `/admin/login`.
- [x] Build `client/src/features/admin/AdminLogin.tsx` with minimalist dark theme and monospace terminal aesthetics.
- [x] Build `client/src/features/admin/AdminDashboard.tsx` featuring an industrial inventory table, inline stock adjusters, search/filter controls, and product mutation modals.
- [x] Implement `client/src/features/admin/AdminRoute.tsx` guarded router and `AdminAuthContext.tsx`.

### 7.3 Testing & Verification
- [x] Integration test: Verify unauthenticated requests to `POST/PUT/DELETE /api/v1/products` receive 401 Unauthorized.
- [x] Integration test: Verify valid credentials set HttpOnly cookie and allow CRUD operations.
- [x] Integration test: Verify invalid credentials return 401 with generic error message.
- [x] Unit test: Client-side inventory metrics, search/category filtering, and token lifecycle tested in `adminAuth.test.ts`.
- [x] End-to-End test: Playwright automated test `admin-cms.spec.ts` validating colophon gateway, credential authentication, dashboard metrics, and session logout.

*Verification Notes:*
> Phase 7 Single-Owner Admin CMS & Catalog Operations completed and verified:
> 1. **Zero-DB-Overhead Auth Architecture:** Configured Fastify JWT signing, HttpOnly cookie generation (`amboss_admin_token`), and bcrypt verification against `ADMIN_PASSWORD_HASH`.
> 2. **Guarded Product Mutations:** Protected `POST /api/v1/products`, `PUT /api/v1/products/:id`, and `DELETE /api/v1/products/:id` with `verifyAdmin` preHandler.
> 3. **Industrial Terminal UI:** Built `AdminLogin.tsx` and `AdminDashboard.tsx` adhering to `client/DESIGN_PHILOSOPHY.md` (zero emojis, subtractive minimalism, monospace metrics, inline stock modifiers with instant debounced backend sync, and product creation/editing modals).
> 4. **Monorepo Test Pass Rate:**
>    - Vitest: **38/38 passing** (21 Client tests + 17 Server tests across 11 test suites).
>    - Playwright: **4/4 passing** (`hero-scroll.spec.ts`, `quote-flow.spec.ts`, `shop-checkout.spec.ts`, `admin-cms.spec.ts`).
>    - Production Build & Linter: `npm run lint` and `npm run build` pass with 0 errors.

---

## Post-Phase 7: Full Repo Audit & Single Source of Truth (SSOT) Consolidation
- [x] **Full Codebase Audit:** Audited all modules across `client/` and `server/` to eliminate hardcoded constants and duplicate business logic.
- [x] **Client SSOT Consolidation (`client/src/config/logistics.ts`):** Centralized `MINIMUM_PRINT_PRICE_LKR` (250), courier fee calculations (500 LKR 1st kg, +150 LKR/kg thereafter), electronics flat rate (500 LKR), free pickup points (Faculty of Engineering University of Ruhuna & Hapugala Shop), and Galle local delivery (200 LKR, free over 3,000 LKR).
- [x] **Server SSOT Consolidation (`server/src/config/logistics.ts`):** Centralized backend courier and fulfillment calculations, ensuring 100% mathematical consistency with client calculations.
- [x] **WhatsApp Order Phone SSOT:** Connected all WhatsApp ordering links in `cartContext.tsx`, `QuoteForm.tsx`, `heroSection.tsx`, and `footer.tsx` to `SITE.phone` (`+94779902796`) in `client/src/config/site.ts`.
- [x] **Documentation Updates:**
  - Updated root `README.md` with complete monorepo guide and feature index.
  - Updated `guide.md` with Phase 7 architecture and SSOT rules.
  - Updated `client/DESIGN_PHILOSOPHY.md` with administrative terminal design standards.
  - Added folder-level architecture and edit guides across all major directories:
    - `client/src/features/quote/README.md`
    - `client/src/features/shop/README.md`
    - `client/src/features/admin/README.md`
    - `client/src/pages/README.md`
    - `client/tests/README.md`
    - `client/e2e/README.md`
    - `server/README.md`
    - `server/src/routes/README.md`
    - `server/src/services/README.md`
    - `server/tests/README.md`