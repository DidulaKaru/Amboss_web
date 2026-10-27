# Amboss Client Application (`client/`)

This directory contains the production React 19 Single Page Application (SPA) for Amboss Industries, built with TypeScript, Vite, TailwindCSS, and Three.js.

---

## Architecture Overview

```
client/
├── public/
│   ├── _redirects           # Cloudflare Pages SPA rewrite rule (/* /index.html 200)
│   ├── images/              # Static product, project, and brand assets
│   ├── robots.txt           # Production search crawler instructions
│   └── sitemap.xml          # XML sitemap for SEO indexation
├── src/
│   ├── components/
│   │   ├── 3d/              # Three.js Hero Canvas (performance.now() timer) & GLSL shaders
│   │   ├── navbar.tsx       # Industrial sticky header navigation
│   │   └── seo.tsx          # Dynamic meta tags & JSON-LD structured schema
│   ├── config/              # Single Source of Truth (SSOT: logistics, site, SEO)
│   ├── features/
│   │   ├── admin/           # SYS.CTRL administrative terminal & inventory CMS
│   │   ├── quote/           # 3D STL volumetric quotation engine & Three.js viewer
│   │   └── shop/            # Maker hardware store, variant grouping, stock & cart
│   ├── pages/
│   │   ├── landing/         # Homepage with hero 3D scroll scrubbing & capabilities
│   │   ├── Projects/        # Dynamic portfolio masonry grid, lightbox, Pawsthetics case study
│   │   ├── AboutUs/         # Team engineering colophon & discreet SYS.CTRL link
│   │   └── shop/            # Store layout and product catalog grid
│   ├── utils/               # Asset path resolution and string helpers
│   ├── workers/             # Web Worker for client-side STL divergence theorem parsing
│   ├── App.tsx              # React Router v7 routes & global SEO metadata
│   └── main.tsx             # React DOM root entry point
├── tests/                   # Vitest unit & integration test suites
├── e2e/                     # Playwright browser end-to-end test suites
├── .env.example             # Documented client environment template
├── index.html               # Main HTML shell with Google Fonts & critical styles
└── vite.config.ts           # Vite bundler, proxy, and test runner configuration
```

---

## Core Features

1. **3D Morph Hero Section (`client/src/components/3d/`):**
   - Three.js WebGL canvas pinned during scroll scrubbing via GSAP ScrollTrigger.
   - Custom GLSL shader (`MorphShader.ts`) smoothly transitions between 2D Blueprint, SolidWorks CAD viewport, and procedural 3D print layer lines.
   - High-resolution frame timing driven by `performance.now()`.

2. **Deterministic 3D STL Quotation Engine (`client/src/features/quote/`):**
   - Client-side STL file parsing in a Web Worker using the Divergence Theorem for signed tetrahedral volume.
   - Interactive Three.js OrbitControls part viewer with wireframe toggle and dimension bounding boxes.
   - Instant LKR pricing with material densities, infill sliders, and WhatsApp dispatch payload formatting.
   - Minimum manufacturing order threshold enforced at **250 LKR**.

3. **Maker Electronics Store (`client/src/features/shop/`):**
   - Live catalog fetching with automatic offline fallback to local dataset.
   - Dynamic variant consolidation (e.g. Red/Green LEDs, M-M/M-F/F-F Jumper Cables).
   - Real-time stock validation preventing cart additions beyond live inventory.
   - Direct WhatsApp order payload generator targeting Amboss operations (`+94779902796`).

4. **Dynamic Projects & Portfolio Gallery (`client/src/pages/Projects/`):**
   - CSS column masonry adjusting fluidly to intrinsic image dimensions without rigid cropping.
   - Full-viewport Lightbox modal for examining print layer lines, material specifications, and functional applications.
   - Keyboard `Escape` listener for instant modal dismissal.

5. **Single-Owner Admin CMS (`client/src/features/admin/`):**
   - Monospace terminal authentication screen (`/admin/login`).
   - Dual-view management dashboard:
     - `[ Products & Stock ]`: Inline stock modifier buttons with debounced backend synchronization.
     - `[ Portfolio Gallery ]`: Live project catalog with visibility toggling, editing, and deletion.
   - Header-aware delete requests (`getAuthHeaders(false)`) preventing `FST_ERR_CTP_EMPTY_JSON_BODY` errors.

---

## Design Standards

All visual elements strictly follow [`client/DESIGN_PHILOSOPHY.md`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/DESIGN_PHILOSOPHY.md):
- **Zero Emojis:** Prohibited in all UI elements, notification toasts, buttons, and WhatsApp payloads.
- **Subtractive Minimalism:** Deep carbon zinc backgrounds (`bg-zinc-950`), subtle borders (`border-zinc-800`), monospace typography for technical data, and monochrome 1.5px SVG icons.

---

## Deployment to Cloudflare Pages

1. **SPA Routing Configuration:**
   - The file [`client/public/_redirects`](file:///c:/Users/didul/Documents/GitHub/Amboss_web/client/public/_redirects) (`/* /index.html 200`) ensures all routes (`/shop`, `/projects`, `/quote`, `/about-us`, `/admin`) return HTTP 200 OK on direct page refreshes.
2. **Build Settings:**
   - **Framework:** `Vite`
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
3. **Environment Variables:**
   - `VITE_API_URL`: Your backend API URL (e.g. `https://api.amboss.lk` or `https://amboss-api.koyeb.app`).
   - *(If proxying `/api/*` through Cloudflare Workers/Transform Rules, leave `VITE_API_URL` empty to use relative paths).*

---

## Local Development & Testing

```bash
# Start local development server
npm run dev

# Run Vitest unit & integration test suites
npm test

# Run Playwright E2E browser tests
npm run test:e2e

# Compile production build & generate SPA 404 fallback
npm run build
```
