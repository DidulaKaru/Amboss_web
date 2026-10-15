# Client End-to-End Test Suite (`client/e2e`)

This directory houses the Playwright automated browser test suite, validating end-to-end user workflows, accessibility, interactions, and system gateway navigation on real Chromium instances.

---

## Test Specifications

| Spec File | Flow Tested | Verification Details |
| :--- | :--- | :--- |
| `hero-scroll.spec.ts` | Landing Page & 3D Hero | Page render, 3D WebGL canvas initialization, navbar link destinations, capabilities grid visibility, and responsive layout. |
| `quote-flow.spec.ts` | 3D CAD Upload & Quote | Navigation to `/quote`, dropzone presence, material selection, minimum print threshold validation (250 LKR), fulfillment option selection (Ruhuna faculty, Hapugala shop, courier), and WhatsApp quotation CTA. |
| `shop-checkout.spec.ts` | Maker Store & Cart | Catalog loading, variant selection dropdowns (LED colors, Jumper Cable terminations), discrete "In stock" indicators without raw stock count exposure, adding items to cart, slide-over cart drawer opening, and fulfillment options. |
| `admin-cms.spec.ts` | Discreet Gateway & Admin CMS | Navigation via discreet `SYS / CTRL` link in About Us colophon, 401 error rejection on invalid credentials, successful authentication to `/admin`, metric cards and inventory table rendering, and secure logout. |

---

## Execution Instructions

```bash
# Run all Playwright tests across workers
npm run test:e2e

# Run tests in headed UI mode (interactive debugger)
npx playwright test --ui --config=client/playwright.config.ts

# Run a specific spec
npx playwright test client/e2e/admin-cms.spec.ts --config=client/playwright.config.ts
```

---

## Architecture & Mocking Protocol

1. **Stateful Route Interception:**
   - E2E tests mock backend endpoints (`**/api/v1/**`) via Playwright's `page.route()`.
   - This ensures tests run deterministically in CI environments without requiring live SQLite/PostgreSQL instances or live background servers.
   - For authenticated flows (e.g. `admin-cms.spec.ts`), tests use stateful in-memory flags to test both unauthenticated and authenticated transitions cleanly.
2. **Web Server Auto-Start:**
   - `client/playwright.config.ts` automatically boots the Vite dev server on `http://localhost:5173` if not already running.
