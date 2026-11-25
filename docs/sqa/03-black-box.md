# 3. Black-Box Testing

All cases below are automated:
- [client/tests/blackbox.test.ts](../../client/tests/blackbox.test.ts) (TC-BB-*)
- [server/tests/quote.bva.test.ts](../../server/tests/quote.bva.test.ts) (TC-API-*)
- [server/tests/admin.decision-table.test.ts](../../server/tests/admin.decision-table.test.ts)

## 3.1 Equivalence Partitioning

### EP-1: `materialSlug` (POST /api/v1/quote/calculate)

| Partition | Class | Representative | Expected | Test |
|---|---|---|---|---|
| E1 | Valid: existing material | `petg` | 200 | TC-API-20 |
| E2 | Invalid: well-formed but unknown | `unobtainium` | 404 | TC-API-21 |
| E3 | Invalid: empty | `""` | 400 | TC-API-22 |
| E4 | Invalid: over 50 chars | 51 × "a" | 400 | (schema `max(50)`) |

### EP-2: Delivery method (`calculateShopDeliveryFee`)

| Partition | Class | Representative | Expected fee | Test |
|---|---|---|---|---|
| E1 | Valid: free pickup | `ruhuna_pickup`, `hapugala_pickup` | 0 | TC-BB-14/15 |
| E2 | Valid: local delivery | `galle_local` | 0 or 200 (see BVA) | TC-BB-10–13 |
| E3 | Valid: courier | `courier` | 500 | TC-BB-16 |
| E4 | Invalid: unknown method | `unknown_method` | 0 (default branch) | TC-BB-17 |

> Observation: E4 silently returns 0 (free delivery). The server rejects it via `z.enum`, so it isn't exploitable, but the client could fail more explicitly.

### EP-3: STL geometry (`parseSTL` and quote geometry)

| Partition | Class | Representative | Expected | Actual | Test |
|---|---|---|---|---|---|
| E1 | Valid closed mesh (binary/ASCII) | 20 mm cube | Correct volume | ✔ | existing `stlParser.test.ts` |
| E2 | Invalid: zero triangles / empty | empty file | Safe zero bbox, error banner | ✔ | existing (GEO-01) |
| E3 | Invalid: **open surface** | one square at z = 20 | Flagged non-manifold | ✘ 2.67 cm³, "manifold" | TC-BB-23/24 → **BUG-03** |
| E4 | Invalid: zero or negative volume to API | `volumeCm3: 0` | 400 | ✔ | TC-API-23 |
| E5 | Invalid: negative dimension | `x: -1` | 400 | ✔ | TC-API-24 |
| E6 | Invalid type | `volumeCm3: "eight"` | 400 | ✔ | TC-API-25 |

## 3.2 Boundary Value Analysis

Approach: for each range [min, max], test min−δ, min, min+δ, max−δ, max, max+δ.

### BVA-1: `infillPct`, valid [10, 100], δ = 1

| Value | 9 | **10** | 11 | 99 | **100** | 101 |
|---|---|---|---|---|---|---|
| Expected | 400 | 200 | 200 | 200 | 200 | 400 |
| Actual | 400 | 200 | 200 | 200 | 200 | 400 |
| Test | TC-API-01 | 02 | 03 | 04 | 05 | 06 |

### BVA-2: `layerHeightMm`, valid [0.05, 0.40], δ = 0.01

| Value | 0.04 | **0.05** | 0.06 | 0.39 | **0.40** | 0.41 |
|---|---|---|---|---|---|---|
| Expected | 400 | 200 | 200 | 200 | 200 | 400 |
| Actual | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

### BVA-3: `quantity`, valid integer [1, 100]

| Value | 0 | **1** | 2 | 99 | **100** | 101 | 1.5 |
|---|---|---|---|---|---|---|---|
| Expected | 400 | 200 | 200 | 200 | 200 | 400 | 400 |
| Actual | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

### BVA-4: Courier fee by weight (step boundary at every 1000 g)

| Weight (g) | −1 | 0 | 1 | 999 | **1000** | 1001 | 1999 | **2000** | 2001 |
|---|---|---|---|---|---|---|---|---|---|
| Expected (LKR) | 500 | 500 | 500 | 500 | 500 | 650 | 650 | 650 | 800 |
| Actual | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

### BVA-5: Galle local free-delivery threshold (3000 LKR)

| Subtotal | 0 | 2999 | **3000** | 3001 |
|---|---|---|---|---|
| Expected fee | 200 | 200 | 0 | 0 |
| Actual | ✔ | ✔ | ✔ | ✔ |

### BVA-6: Minimum print price (250 LKR)

| Input | Expected | Actual | Result |
|---|---|---|---|
| Tiny part (0.01 cm³) | 250 | **450** | **Fail → BUG-01** |
| Large part (100 cm³) | > 250 | > 250 | Pass |

**Analysis:** the lower boundary of the price output domain can never be reached. The handling fee alone is 250 LKR, plus at least 80 LKR of machine time and 120 LKR of material. This defect was **missed by 100% branch coverage** and found only by BVA, which is a good argument for combining both techniques.

## 3.3 Decision Tables

### DT-1: Admin login (`server/src/routes/admin.ts`)

**Conditions**
- C1: source IP currently locked out?
- C2: request body valid (non-empty username and password)?
- C3: username correct?
- C4: password correct?
- C5: is this the 5th consecutive failure?

**Actions**
- A1: 429 + Retry-After
- A2: 400 Validation failed
- A3: 200 + HttpOnly cookie, counter reset
- A4: 401 "Invalid username or password"
- A5: 401 "Access locked for 15 minutes", and start the lockout

| | R1 | R2 | R3 | R4 | R5 | R6 |
|---|---|---|---|---|---|---|
| C1 locked | Y | N | N | N | N | N |
| C2 valid body | – | N | Y | Y | Y | Y |
| C3 username ok | – | – | Y | N | Y | – |
| C4 password ok | – | – | Y | – | N | – (C3∧C4 false) |
| C5 5th failure | – | – | – | N | N | Y |
| **Action** | A1 | A2 | A3 | A4 | A4 | A5 |
| **Result** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

`–` = don't care. A full table would have 2⁵ = 32 columns. Collapsing the don't-care entries reduces it to 6 rules, plus one extra test: a successful login resets the counter.

### DT-2: Shop delivery fee (`calculateShopDeliveryFee`)

| | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Method = pickup (ruhuna/hapugala) | Y | N | N | N | N |
| Method = galle_local | – | Y | Y | N | N |
| Method = courier | – | – | – | Y | N |
| Subtotal ≥ 3000 | – | Y | N | – | – |
| **Fee (LKR)** | 0 | 0 | 200 | 500 | 0 (default) |
| Test | TC-BB-14/15 | TC-BB-11/12 | TC-BB-10/13 | TC-BB-16 | TC-BB-17 |
