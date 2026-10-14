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
- [ ] **Task 5.1:** Seed PostgreSQL with existing electronics catalog (Arduino, ESP32, sensors, accessories).
- [ ] **Task 5.2:** Refactor `client/src/features/shop` to fetch catalog items from Fastify API.
- [ ] **Task 5.3:** Connect cart checkout to live backend inventory validation.
- [ ] **Task 5.4:** Verify Galle & University of Ruhuna local delivery/pickup logistical alerts work seamlessly.

*Verification Notes:*
> _Pending execution._

---

## Phase 6: Automated Testing & End-to-End Validation
- [ ] **Task 6.1:** Set up Vitest test runner across both `client` and `server` workspaces.
- [ ] **Task 6.2:** Achieve unit test coverage for math utilities, quote calculators, and store cart logic.
- [ ] **Task 6.3:** Implement Playwright E2E tests for the 3D scroll hero, quotation engine, and maker store checkout.
- [ ] **Task 6.4:** Configure GitHub Actions CI workflow to run linting, tests, and builds on push and pull requests.

*Verification Notes:*
> _Pending execution._