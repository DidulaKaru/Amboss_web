# Client Unit & Integration Tests (`client/tests`)

This directory houses the headless Vitest test suites for the Amboss client frontend application.

---

## Test Suites Overview

| File | Tested Unit | Key Assertions |
| :--- | :--- | :--- |
| `adminAuth.test.ts` | Admin CMS State & Filters | Inventory metric counts (total, in stock, low stock <10, depleted), search and category filtering, non-negative stock guards, and localStorage session token handling. |
| `cart.test.ts` | Maker Store Cart & Logistics | Cart additions, subtotal calculation, free campus/shop pickup, Galle local threshold (free >3,000 LKR), and courier rates (500 LKR flat for electronics). |
| `groupProducts.test.ts` | Variant Grouping Algorithm | Grouping separate SKUs into unified cards (Red/Green LEDs; M-M, M-F, F-F Jumper Cables), variant label extraction, and un-grouped pass-through. |
| `pricing.test.ts` | 3D Print Pricing & Mass Engine | Effective mass estimation via shell + infill, deterministic LKR pricing, enforcement of the **250 LKR** minimum print threshold, and dynamic courier weight tiers (500 1st kg, +150/kg thereafter). |
| `stlParser.test.ts` | STL Binary Geometry Parsing | Signed tetrahedron volume computation using the divergence theorem, unit cube verification ($20\times 20\times 20\,\text{mm} = 8.00\,\text{cm}^3$). |

---

## Execution Instructions

```bash
# Run all client tests once
npm test --workspace=client

# Run client tests in watch mode
npm run test:watch --workspace=client
```

---

## Testing Guidelines & Conventions

1. **Isolation from Playwright:**
   - In `client/vite.config.ts`, `test.include` is explicitly constrained to `tests/**/*.{test,spec}.{ts,tsx}` and excludes `e2e/**`.
   - Never import Playwright or test browser DOM elements inside these unit tests.
2. **Headless Node Environment:**
   - The test environment is configured for fast Node.js execution.
   - For components or utilities using browser globals like `localStorage`, provide an in-memory mock (see `adminAuth.test.ts`).
3. **Single Source of Truth Verification:**
   - Always verify that test assertions import constants from `client/src/config/logistics.ts` and `client/src/config/site.ts` rather than hardcoding values.
