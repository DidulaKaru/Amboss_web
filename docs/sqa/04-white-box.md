# 4. White-Box Testing

## 4.1 Cyclomatic complexity: worked example

**Function:** `calculateCourierFee(weightGrams)` in [client/src/config/logistics.ts](../../client/src/config/logistics.ts)

```ts
export function calculateCourierFee(weightGrams: number): number {
  if (weightGrams <= 0) return 500                 // D1
  const weightKg = weightGrams / 1000
  if (weightKg <= 1.0) return 500                  // D2
  const extraKg = Math.ceil(weightKg - 1.0)
  return 500 + extraKg * 150
}
```

**Control-flow graph**

```
      (1) entry
       │
      [D1] weightGrams <= 0 ?
     T/   \F
   (2)     (3) weightKg = g/1000
 return     │
  500      [D2] weightKg <= 1 ?
     \    T/    \F
      \ (4)      (5) extraKg = ceil(..)
       \return    │
        \ 500    (6) return 500 + extra*150
         \  |    /
          (7) exit
```

**V(G) computed three ways:**
- Decision points: P = 2, so V(G) = P + 1 = **3**
- Edges and nodes: E = 8, N = 7, so V(G) = E − N + 2 = 8 − 7 + 2 = **3**
- Regions in the planar graph = **3**

**Basis paths, and the tests that cover them:**

| Path | Route | Input | Expected | Test |
|---|---|---|---|---|
| B1 | 1 → D1(T) → 2 → 7 | 0 g | 500 | TC-BB-02 |
| B2 | 1 → D1(F) → 3 → D2(T) → 4 → 7 | 500 g | 500 | TC-BB-04 |
| B3 | 1 → D1(F) → 3 → D2(F) → 5 → 6 → 7 | 2500 g | 800 | TC-BB-09 (2001 g) |

## 4.2 Core module: `calculateQuote()`

**File:** [client/src/features/quote/utils/pricing.ts](../../client/src/features/quote/utils/pricing.ts)

**Decision points:**

| # | Decision | Type |
|---|---|---|
| 1–3 | `material.type === 'SLA' ? …` for deposition rate, machine rate and handling fee | ternary × 3 |
| 4 | `if (material.type === 'SLA')` | if |
| 5–6 | `partDims[0] <= vat[0] && partDims[1] <= … && partDims[2] <= …` | 2 short-circuit `&&` |
| 7 | `if (fitsSla)` | if |
| 8–9 | `material.requiresEnclosure \|\| id === 'abs' \|\| id === 'petg-cf'` | 2 short-circuit `\|\|` |
| 10 | `if (requiresEnclosure)` | if |
| 11–12 | `if (maxDim <= 256) … else if (maxDim <= 350)` (enclosed) | if / else-if |
| 13–15 | `if (maxDim <= 180) … else if (<= 256) … else if (<= 350)` (open) | if / else-if × 3 |

- **V(G) = 15 + 1 = 16** when short-circuit operators count as decisions (McCabe extended / ESLint).
- **V(G) = 11 + 1 = 12** when only `if` and `?:` count (classic McCabe on statements).

**Tool confirmation:** `npm run lint:complexity --workspace=client` (config in [client/eslint.complexity.config.mjs](../../client/eslint.complexity.config.mjs)) reports:

| Function | V(G) | Risk band (SEI) |
|---|---|---|
| `calculateCourierFee` | 3 | low |
| `calculateShopDeliveryFee` | 6 | low |
| `calculateQuote` | **16** | moderate (11–20) |
| `parseBinarySTL` | **22** | high (21–50) |
| `parseAsciiSTL` | **22** | high (21–50) |
| `computeSafeBoundingBox` | 8 | low |

📸 *Evidence: screenshot of the `lint:complexity` output → `evidence/complexity.png`*

**Interpretation:** V(G) = 16 means at least 16 tests are needed for basis-path coverage. `calculateQuote` mixes three concerns: mass estimation, pricing and machine routing. Extracting `routeMachine()` would cut its complexity roughly in half (see improvement 1 in [09](09-metrics-sonarqube.md)).

## 4.3 Statement & branch coverage test design

Tests: [client/tests/pricing.branches.test.ts](../../client/tests/pricing.branches.test.ts). Machine-routing decision tree:

```
material.type === 'SLA'?
├─ Y → fitsSla?            ── Y: P1 Saturn 4 Ultra      ── N: P2 oversized
└─ N → requiresEnclosure?
       ├─ Y → maxDim ≤ 256: P3 · ≤ 350: P4 · else P5 oversized
       └─ N → maxDim ≤ 180: P6 · ≤ 256: P7 · ≤ 350: P8 · else P9 oversized
```

| Path | Input (material, dims mm) | Expected machine | Covers |
|---|---|---|---|
| P1 | lite-resin, 210 × 100 × 200 | Saturn 4 Ultra | SLA true, fitsSla true (rotation), SLA ternaries true |
| P2 | lite-resin, 230 × 50 × 50 | Exceeds SLA | fitsSla false |
| P3 | abs, 256³ | Centauri Carbon / K2 Plus | enclosure true, ≤ 256 boundary, SLA ternaries false |
| P4 | petg-cf, 300³ | K2 Plus Enclosed Large-Format | ≤ 350 |
| P5 | abs, 351³ | Exceeds enclosed chamber | > 350 |
| P6 | pla-plus, 180³ | A1 Mini | ≤ 180 boundary |
| P7 | petg, 181³ | A1 / Centauri | ≤ 256 |
| P8 | tpu, 350³ | K2 Plus Large-Format | ≤ 350 boundary |
| P9 | pla-plus, 400³ | Exceeds standard envelope | > 350 |
| X1 | abs with `requiresEnclosure: undefined` | Enclosed | `\|\|` falls through to `id === 'abs'` |
| X2 | layer 0.05 mm | slower print | `Math.max(0.5, …)` floor |
| X3 | thin part, area ≫ volume | ≥ 6 g | `Math.min` shell cap and 6 g minimum |

**Result** (`npx vitest run --coverage` in `client/`):

| File | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `features/quote/utils/pricing.ts` | **100%** | **100%** | 100% | 100% |
| `config/logistics.ts` | **100%** | **100%** | 100% | 100% |

📸 *Evidence: open `client/coverage/index.html` and screenshot the `pricing.ts` row and its annotated source view → `evidence/coverage-pricing.png`*

**Key lesson:** 100% statement and branch coverage did **not** reveal BUG-01. The `Math.max(250, raw)` clamp is a single statement with no branch, and it executes every time. Coverage tells you code *ran*, not that it is *correct*. Boundary analysis of the output domain found the defect.
