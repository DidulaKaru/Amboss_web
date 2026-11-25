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

**Current suite:** 165 Vitest tests. 163 pass; 2 are expected-fail markers for open defects BUG-01 and BUG-03. (After the TDD exercise in 5.2, BUG-03's marker is removed and 8 tests are added.)

## 5.2 TDD: Red → Green → Refactor (team exercise)

> **[YOU]** Do these three steps yourselves as **three separate commits**, so the git history shows real TDD. Screenshot the terminal after steps 1 and 2.

**Task:** fix **BUG-03** (REQ-Q-06): an open-surface STL is reported as a valid solid. This is a real defect we found, not a new feature, so it needs no business decision. `isManifoldEstimate` is not read by the UI today, so the fix changes no prices and does not reject any customer upload.

**Rule to implement:** a mesh is a closed solid only if **every edge is shared by exactly two triangles**.

### Step 1: RED (the test is already written; it must fail)
The test file [client/tests/watertight.test.ts](../../client/tests/watertight.test.ts) is in the repo. It builds a cube in ASCII and binary STL and checks:

| Case | Expected `isManifoldEstimate` | Today |
|---|---|---|
| Closed cube (ASCII, binary) | `true` | passes |
| Cube missing one face (ASCII, binary) | `false` | **fails** |
| Cube missing one triangle | `false` | **fails** |
| One lone triangle | `false` | **fails** |
| Reversed (inside-out) closed cube | `true` | passes |
| Empty file | `false` | passes |

Run in `client/`:

```bash
npx vitest run tests/watertight.test.ts
```

Expected: **4 failed, 4 passed**. The old check only asks `volume > 0`, so open surfaces pass. 📸 screenshot.

Commit: `test: add failing watertight-mesh tests for BUG-03 (RED)`

> The RED commit makes CI fail on purpose. Push all three commits together, or screenshot the red run as evidence of TDD.

### Step 2: GREEN (the simplest code that passes)
In `client/src/features/quote/utils/stlParser.ts`, change **both** `isManifoldEstimate` lines (binary and ASCII parser) to:

```ts
isManifoldEstimate: absVolumeMm3 > 0.001 && isWatertight(positions),
```

and add this function at the bottom of the file:

```ts
/** True when every edge is shared by exactly two triangles (a closed surface). */
function isWatertight(positions: Float32Array): boolean {
  const triangleCount = positions.length / 9
  if (triangleCount === 0) return false

  const vertexIds = new Map<string, number>()
  const idOf = (o: number): number => {
    const key = positions[o] + ',' + positions[o + 1] + ',' + positions[o + 2]
    let id = vertexIds.get(key)
    if (id === undefined) {
      id = vertexIds.size
      vertexIds.set(key, id)
    }
    return id
  }

  const edgeUses = new Map<string, number>()
  const addEdge = (a: number, b: number) => {
    const key = a < b ? a + '_' + b : b + '_' + a
    edgeUses.set(key, (edgeUses.get(key) ?? 0) + 1)
  }

  for (let t = 0; t < triangleCount; t++) {
    const a = idOf(t * 9)
    const b = idOf(t * 9 + 3)
    const c = idOf(t * 9 + 6)
    addEdge(a, b)
    addEdge(b, c)
    addEdge(c, a)
  }

  for (const uses of edgeUses.values()) if (uses !== 2) return false
  return true
}
```

Also in `client/tests/blackbox.test.ts`, change `it.fails('TC-BB-23 …` to `it('TC-BB-23 …`. The bug is fixed, so the expected-failure marker must go (that is exactly what `it.fails` is for). Tests that pass: `npm test --workspace=client`. 📸 screenshot.

Commit: `fix: detect open STL surfaces via edge check (GREEN, fixes BUG-03)`

### Step 3: REFACTOR (improve the design; tests stay green)
Move the check into its own module, name the pieces, and use a numeric edge key instead of a string per edge (about 225 ms for a 200 000-triangle mesh).

Create `client/src/features/quote/utils/meshTopology.ts`:

```ts
/** Identifies a vertex by value: STL repeats each shared corner in every triangle that uses it. */
const vertexKey = (p: Float32Array, o: number): string => `${p[o]},${p[o + 1]},${p[o + 2]}`

/**
 * A solid is "closed" (watertight) when every edge is shared by exactly two triangles.
 * An open surface has edges used once (the boundary); a broken mesh may have edges used 3+ times.
 *
 * @param positions flat [x, y, z, x, y, z, ...] array, 9 numbers per triangle
 */
export function isClosedSurface(positions: Float32Array): boolean {
  const triangleCount = positions.length / 9
  if (triangleCount === 0) return false

  const vertexIds = new Map<string, number>()
  const idOf = (offset: number): number => {
    const key = vertexKey(positions, offset)
    let id = vertexIds.get(key)
    if (id === undefined) {
      id = vertexIds.size
      vertexIds.set(key, id)
    }
    return id
  }

  // Edge (a, b) with a < b is packed into one safe integer, avoiding a string allocation per edge.
  const edgeUses = new Map<number, number>()
  const countEdge = (a: number, b: number): void => {
    const key = a < b ? a * 2 ** 26 + b : b * 2 ** 26 + a
    edgeUses.set(key, (edgeUses.get(key) ?? 0) + 1)
  }

  for (let t = 0; t < triangleCount; t++) {
    const a = idOf(t * 9)
    const b = idOf(t * 9 + 3)
    const c = idOf(t * 9 + 6)
    countEdge(a, b)
    countEdge(b, c)
    countEdge(c, a)
  }

  for (const uses of edgeUses.values()) {
    if (uses !== 2) return false
  }
  return true
}
```

In `stlParser.ts`: delete `isWatertight`, add `import { isClosedSurface } from './meshTopology'` at the top, and use `isClosedSurface(positions)` in both `isManifoldEstimate` lines. Do **not** name helpers `useXxx`: the React hooks lint rule flags them.

Run `npm test --workspace=client` and `npm run lint --workspace=client`: still green.

Commit: `refactor: extract closed-surface check into meshTopology`

**Result:** BUG-03's expected-fail marker is gone (1 left: BUG-01), and the suite gains 8 passing tests. Update the defect log: BUG-03 → Fixed (note in [08-defects.md](08-defects.md)).

> **Scope note:** this fixes the *detection*. Whether the quote page should warn or block the customer when `isManifoldEstimate` is false is a product decision for the shop owner. Do not add that without their approval.

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
