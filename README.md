# Amboss Industries (amboss.lk)

Official web platform and engineering portal for **Amboss Industries** — additive manufacturing, precision rapid prototyping, 3D printing bureau, and STEM maker supplies based in Galle, Sri Lanka.

Originated at the Faculty of Engineering, University of Ruhuna (Hapugala, Galle).

---

## System Architecture

Amboss is structured as an air-gapped, zero-DB-overhead, highly modular monorepo:

```
Amboss_web/
├── client/                          # Vite + React 19 (TypeScript) + TailwindCSS
│   ├── e2e/                         # Playwright End-to-End browser test suites
│   ├── src/
│   │   ├── config/                  # Single source of truth (logistics, site, SEO)
│   │   ├── features/
│   │   │   ├── admin/               # SYS.CTRL administrative terminal & inventory CMS
│   │   │   ├── quote/               # 3D STL volumetric quotation engine & Three.js viewer
│   │   │   └── shop/                # Maker hardware store, variant grouping & cart
│   │   ├── pages/                   # Public landing, projects, news, about, store
│   │   └── workers/                 # Web Worker for divergence-theorem STL mass calculation
│   └── tests/                       # Vitest unit & integration test suites
├── server/                          # Fastify 5 + TypeScript + Drizzle ORM
│   ├── src/
│   │   ├── config/                  # Server environment & logistics SSOT
│   │   ├── db/                      # Schema, PostgreSQL connection, seeds, migrations
│   │   ├── middleware/              # Fastify JWT & HttpOnly cookie auth guards
│   │   ├── routes/                  # REST API v1 (health, materials, products, quote, orders, portfolio, admin)
│   │   └── services/                # Pure business logic (pricing engine, logistics)
│   ├── drizzle/                     # Versioned PostgreSQL migration SQL files
│   ├── Dockerfile                   # Multi-stage production container build
│   └── tests/                       # Fastify integration test suites via .inject()
├── .github/workflows/ci.yml         # GitHub Actions CI (Lint, Vitest, Build, Playwright)
├── guide.md                         # Master engineering roadmap & technical architecture
├── PROGRESS.md                      # Live development milestone tracker
└── package.json                     # Monorepo root workspace orchestration
```

---

## Key Platform Capabilities

1. **Deterministic 3D Print Quotation Engine (`/quote`):**
   - Instant client-side STL analysis via signed tetrahedron divergence theorem inside a Web Worker.
   - Interactive Three.js CAD viewport with auto-centering, wireframe toggles, and dimension bounding boxes.
   - Material parameter presets (PLA+, PETG, ABS, TPU, PETG-CF, Nylon PA12, SLA Standard Resin).
   - Enforces a minimum manufacturing charge of **250 LKR**.

2. **Maker Hardware Catalog & Smart Cart (`/shop`):**
   - Microcontrollers, sensors, actuators, and prototyping components with real-time stock validation.
   - Variant consolidation: Dropdown selectors for LEDs (Red, Green; 500 stock each) and Jumper Cables (M-M, M-F, F-F).
   - Strict Anti-Vibe-Coded Design: Status indicators show `In stock` / `Out of stock` without exposing raw stock numbers to users.
   - Single-click WhatsApp order generation targeting Amboss management (`+94779902796`).

3. **Logistics & Delivery Policy (Single Source of Truth):**
   - **Free Pickup Locations:** Faculty of Engineering, University of Ruhuna (Hapugala) AND Amboss Shop (Elhenage Watta, Hapugala).
   - **Galle Local Delivery:** 200 LKR (free on orders over 3,000 LKR).
   - **Islandwide Courier:** 500 LKR for the first 1kg, +150 LKR for each additional 1kg. Flat 500 LKR for electronics maker cart.

4. **Single-Owner Admin CMS (`/admin`):**
   - Discreet access via low-contrast `SYS / CTRL` link in the About Us colophon.
   - Environment-driven bcrypt authentication (`ADMIN_PASSWORD_HASH`) with HttpOnly JWT session cookies (`amboss_admin_token`) and Bearer header fallback.
   - Dual-tab industrial control center:
     - `[ Products & Stock ]`: Real-time catalog manager with inline stock controls (`−`, input, `+`) synchronized with PostgreSQL.
     - `[ Portfolio Gallery ]`: Project gallery manager with live visibility toggle, material specification, and CRUD modals.
   - Full CRUD product and portfolio mutation capabilities protected by `verifyAdmin` middleware.

5. **Dynamic Portfolio Gallery (`/projects`):**
   - Fluid responsive CSS column masonry gallery adjusting naturally to photo aspect ratios without rigid cropping.
   - Full-viewport modal lightbox for inspecting print layer details, materials, and functional engineering applications with keyboard `Escape` dismissal.
   - Offline fallback guarantees uninterrupted display if backend or database is suspended.

6. **Visual Discipline & Design Philosophy:**
   - Strict compliance with `client/DESIGN_PHILOSOPHY.md`.
   - **Zero Emojis Policy:** Emojis are forbidden across all interfaces, buttons, banners, and payloads.
   - Industrial aesthetics inspired by Dieter Rams, Teenage Engineering, and Linear (deep zinc carbon palettes, monochrome SVG icons, monospace numbers).

---

## Zero-Cost Production Deployment Architecture

```
[ Cloudflare Pages ] (Frontend: amboss.lk)
         │  Free Edge Hosting, Unlimited Bandwidth & CDN
         ▼
[ Koyeb ] (Backend: Fastify API on Singapore region)
         │  Free Eco Nano Container (512 MB RAM, Auto HTTPS)
         ▼
[ Neon Serverless Postgres ] (Database on Singapore region)
         │  Free 0.5 GB Storage, Autoscaling Compute
         ▼
[ Cloudflare Pages public/images/ + Cloudflare R2 ] (Photos)
            Zero Egress Fee Asset Delivery
```

- **Frontend on Cloudflare Pages:**
  - Build command: `npm run build`
  - Output directory: `dist`
  - SPA routing guaranteed via `client/public/_redirects` (`/* /index.html 200`).
  - Set `VITE_API_URL` to your backend URL (e.g. `https://api.amboss.lk` or `https://<app>.koyeb.app`).
- **Backend on Koyeb:**
  - Build with `server/Dockerfile` or native buildpack.
  - Set `DATABASE_URL` to your Neon pooled connection string (`?sslmode=require`).
  - Set `CORS_ORIGIN=https://amboss.lk,https://www.amboss.lk`.
- **Database on Neon:**
  - Run initial migrations: `npx drizzle-kit migrate`
  - Seed initial catalog: `npm run db:seed`

---

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/DidulaKaru/Amboss_web.git
cd Amboss_web

# Install monorepo dependencies across all workspaces
npm install
```

### Running Locally
```bash
# Start client development server (Vite on http://localhost:5173)
npm run dev

# Start Fastify backend server (on http://localhost:4000)
npm run dev:server

# Start both concurrently
npm run dev:all
```

---

## Testing & Quality Assurance

All suites run locally and via GitHub Actions CI (`.github/workflows/ci.yml`):

```bash
# 1. Run ESLint across all workspaces
npm run lint

# 2. Run Vitest Unit & Integration Suites (43 tests)
npm test

# 3. Run Playwright End-to-End Tests (7 specs across Chromium)
npm run test:e2e

# 4. Compile Production Builds (Client Vite bundle + Server tsc)
npm run build
```

---

## Documentation Index

- [Master Engineering Roadmap (`guide.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/guide.md)
- [Live Progress Milestone Tracker (`PROGRESS.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/PROGRESS.md)
- [Amboss Design Philosophy (`client/DESIGN_PHILOSOPHY.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/DESIGN_PHILOSOPHY.md)
- [Client Application Guide (`client/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/README.md)
- [Client Quote Feature (`client/src/features/quote/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/quote/README.md)
- [Client Shop Feature (`client/src/features/shop/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/shop/README.md)
- [Client Admin Feature (`client/src/features/admin/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/features/admin/README.md)
- [Client Pages Architecture (`client/src/pages/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/src/pages/README.md)
- [Client Unit Tests (`client/tests/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/tests/README.md)
- [Client Playwright E2E Tests (`client/e2e/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/e2e/README.md)
- [Server Architecture Guide (`server/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/README.md)
- [Server API Routes (`server/src/routes/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/routes/README.md)
- [Server Services & Pricing (`server/src/services/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/src/services/README.md)
- [Server Integration Tests (`server/tests/README.md`)](file:///c:/Users/didul/Documents/GitHub/Amboss_web/server/tests/README.md)
