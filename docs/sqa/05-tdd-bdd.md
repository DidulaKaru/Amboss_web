# 5. TDD & BDD

## 5.1 Unit-testing framework choice
The project is TypeScript, so we use **Vitest**, the TypeScript/Vite counterpart of JUnit, NUnit or PyTest. The concepts map one to one:

| JUnit 5 | Vitest |
|---|---|
| `@Test` | `it()` / `test()` |
| `@ParameterizedTest` + `@CsvSource` | `it.each([...])` |
| `@BeforeAll` / `@AfterAll` | `beforeAll()` / `afterAll()` |
| `assertEquals(a, b)` | `expect(b).toBe(a)` |
| `@Disabled("known bug")` | `it.fails()` (stronger: it fails the build once the bug is fixed and the marker is forgotten) |
| JaCoCo | `@vitest/coverage-v8` |

**Commands**
- `npm test`: all unit and integration tests
- `npm run test:coverage`: the same, plus coverage reports in `client/coverage`, `server/coverage`

**Current suite:** 156 Vitest tests. 154 pass; 2 are expected-fail markers for open defects BUG-01 and BUG-03.

## 5.2 TDD: Red → Green → Refactor (team exercise)

> **[YOU]** Do these three steps yourselves as **three separate commits**, so the git history shows real TDD. Screenshot the terminal after steps 1 and 2.

**Feature (new requirement REQ-Q-07):** bulk discount on 3D-print quotes.
- quantity 1–9 → 0%
- 10–49 → 5%
- 50–100 → 10%

### Step 1: RED (write the test first; it must fail)
Create `client/tests/bulkDiscount.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { bulkDiscountRate } from '../src/features/quote/utils/bulkDiscount'

describe('REQ-Q-07 bulk discount', () => {
  it.each([
    [1, 0], [9, 0],        // partition 1, upper boundary
    [10, 0.05], [49, 0.05], // partition 2, both boundaries
    [50, 0.1], [100, 0.1],  // partition 3, both boundaries
  ])('quantity %i → %d', (qty, rate) => {
    expect(bulkDiscountRate(qty)).toBe(rate)
  })

  it('rejects quantities outside 1–100', () => {
    expect(() => bulkDiscountRate(0)).toThrow(RangeError)
    expect(() => bulkDiscountRate(101)).toThrow(RangeError)
  })
})
```

Run `npx vitest run tests/bulkDiscount.test.ts` in `client/`. It fails because the module doesn't exist. 📸 screenshot.
Commit: `test: add failing tests for bulk discount (RED)`

### Step 2: GREEN (the simplest code that passes)
Create `client/src/features/quote/utils/bulkDiscount.ts`:

```ts
export function bulkDiscountRate(quantity: number): number {
  if (quantity < 1 || quantity > 100) throw new RangeError('quantity must be 1–100')
  if (quantity >= 50) return 0.1
  if (quantity >= 10) return 0.05
  return 0
}
```

Run again: all tests pass. 📸 screenshot.
Commit: `feat: implement bulk discount rate (GREEN)`

### Step 3: REFACTOR (improve the design; tests stay green)
Replace the magic numbers with a data table:

```ts
const TIERS = [
  { minQty: 50, rate: 0.1 },
  { minQty: 10, rate: 0.05 },
] as const

export function bulkDiscountRate(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new RangeError('quantity must be an integer 1–100')
  }
  return TIERS.find((t) => quantity >= t.minQty)?.rate ?? 0
}
```

Run again: still green.
Commit: `refactor: table-driven discount tiers`

## 5.3 BDD with Gherkin + Cucumber

**Files**

| File | Purpose |
|---|---|
| [server/features/quote.feature](../../server/features/quote.feature) | Instant quote: happy path, Scenario Outline of BVA rows, unknown material |
| [server/features/admin-login.feature](../../server/features/admin-login.feature) | Valid login; lockout after 5 failures |
| [server/features/steps/*.ts](../../server/features/steps/) | Step definitions |
| [server/features/support/world.ts](../../server/features/support/world.ts) | Cucumber World: builds a fresh Fastify app per scenario and calls it in-process with `app.inject()` (no network, no DB) |
| [server/cucumber.mjs](../../server/cucumber.mjs) | Config: progress bar, summary, HTML report → `server/reports/cucumber-report.html` |

**Example scenario**

```gherkin
Scenario: Account locks after 5 failed logins
  When I fail to log in 5 times
  Then the response status should be 401
  And the error message should contain "Access locked for 15 minutes"
  When I log in as "Dory" with password "poplintu7577"
  Then the response status should be 429
  And the response should include a Retry-After header
```

**Run:** `npm run test:bdd --workspace=server` → **9 scenarios (9 passed), 70 steps (70 passed)**

📸 *Evidence: terminal output and `server/reports/cucumber-report.html` → `evidence/cucumber.png`*

**Why BDD here:** the Gherkin files are readable by the shop owner, who isn't a developer. That makes them *validation* artefacts: the owner can confirm "yes, that's how lockout should work" before it's coded.
