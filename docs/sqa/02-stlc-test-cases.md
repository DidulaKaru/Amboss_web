# 2. STLC & Test Cases

## 2.1 STLC mapping

| STLC phase | What we did on Amboss | Output |
|---|---|---|
| **1. Requirement analysis** | Read `guide.md` (pricing formula), the feature READMEs, the Zod schemas (`server/src/routes/*.ts`, `config/validation.ts`) and `config/logistics.ts`. Derived testable requirements (below). | Requirement list REQ-* |
| **2. Test planning** | Scope, approach, tools, schedule, risks, entry/exit criteria | [01-test-plan.md](01-test-plan.md) |
| **3. Test case design** | EP, BVA, decision tables (black-box); CFG and path analysis (white-box); Gherkin scenarios | This file, [03](03-black-box.md), [04](04-white-box.md), `server/features/*.feature` |
| **4. Test environment setup** | Local and CI environments, seed data, DB-isolated server modes | §2.4 below |
| **5. Test execution** | Vitest, Cucumber, Newman, Selenium, Playwright, JMeter; also in GitHub Actions | CI runs, reports in `docs/sqa/reports/`, screenshots in `evidence/` |
| **6. Test closure** | Metrics, defect summary, lessons learned | [08](08-defects.md), [09](09-metrics-sonarqube.md), [10](10-reflection.md) |

## 2.2 Requirements (derived)

| ID | Requirement | Source |
|---|---|---|
| REQ-Q-01 | Quote total = material + machine time + handling | `guide.md`, `pricing.ts` |
| REQ-Q-02 | Infill accepted 10–100%; layer height 0.05–0.40 mm; quantity integer 1–100 | `quote.ts` Zod schema |
| REQ-Q-03 | Unknown material → 404; malformed input → 400 | `quote.ts` |
| REQ-Q-04 | Parts route to the smallest printer whose build volume fits; SLA fit is orientation-independent | `pricing.ts`, GEO-02 |
| REQ-Q-05 | Minimum print price 250 LKR | `logistics.ts`, UI label |
| REQ-Q-06 | Non-watertight or corrupt STL files must not be priced as valid parts | `stlParser.ts`, GEO-01 |
| REQ-S-01 | Courier: 500 LKR first kg, +150 LKR per started extra kg | `logistics.ts` |
| REQ-S-02 | Galle local delivery free at a subtotal of 3000 LKR or more, else 200 LKR | `logistics.ts` |
| REQ-S-03 | Orders exceeding stock are rejected with a readable message | `orders.ts` |
| REQ-A-01 | Valid credentials → HttpOnly JWT cookie | `admin.ts` |
| REQ-A-02 | 5 consecutive failures → 15-minute lockout (429 + Retry-After) | `admin.ts` |
| REQ-A-03 | Identical error for wrong username and wrong password | `admin.ts` |
| REQ-A-04 | All admin mutations require a valid JWT | `middleware/auth.ts` |

## 2.3 Test cases

Status values: **Pass** / **Fail** (defect logged).
Full automated sets: `TC-BB-*` in `client/tests/blackbox.test.ts`, `TC-API-*` in `server/tests/quote.bva.test.ts`, `TC-PM-*` in the Postman collection, and `SEL-*` in `client/selenium`.

| ID | Req | Description | Preconditions | Steps | Test data | Expected | Actual | Status |
|---|---|---|---|---|---|---|---|---|
| TC-01 | REQ-Q-01 | Valid PLA+ quote is itemised correctly | API running | POST `/api/v1/quote/calculate` | 20 mm cube, 8 cm³, 24 cm², pla-plus, 20%, 0.2 mm | 200; total = material + machine + handling; handling = 250 | As expected | Pass |
| TC-02 | REQ-Q-02 | Infill upper boundary accepted | API running | POST quote with infill 100 | infillPct = 100 | 200 | 200 | Pass |
| TC-03 | REQ-Q-02 | Infill just above max rejected | API running | POST quote | infillPct = 101 | 400 "Validation failed" | 400 | Pass |
| TC-04 | REQ-Q-02 | Infill just below min rejected | API running | POST quote | infillPct = 9 | 400 | 400 | Pass |
| TC-05 | REQ-Q-02 | Layer height above max rejected | API running | POST quote | layerHeightMm = 0.41 | 400 | 400 | Pass |
| TC-06 | REQ-Q-02 | Non-integer quantity rejected | API running | POST quote | quantity = 1.5 | 400 | 400 | Pass |
| TC-07 | REQ-Q-03 | Unknown material | API running | POST quote | materialSlug = "unobtainium" | 404 "not found" | 404 | Pass |
| TC-08 | REQ-Q-04 | Rotated SLA part fits the vat | — | `calculateQuote` | 210 × 100 × 200 mm, lite-resin | Saturn 4 Ultra, not oversized | As expected | Pass |
| TC-09 | REQ-Q-04 | Open-material part over 350 mm | — | `calculateQuote` | 400 mm cube, PLA+ | isOversized = true | As expected | Pass |
| TC-10 | REQ-Q-05 | Tiny part clamped to minimum price | — | `calculateQuote` | 0.01 cm³, PLA+ | 250 LKR | **450 LKR** | **Fail → BUG-01** |
| TC-11 | REQ-Q-06 | Open surface STL flagged as invalid | — | `parseSTL` | One 20 × 20 mm square at z = 20 | isManifoldEstimate = false | **true, 2.67 cm³** | **Fail → BUG-03** |
| TC-12 | REQ-S-01 | Courier fee at exactly 1 kg | — | `calculateCourierFee` | 1000 g | 500 | 500 | Pass |
| TC-13 | REQ-S-01 | Courier fee just over 1 kg | — | `calculateCourierFee` | 1001 g | 650 | 650 | Pass |
| TC-14 | REQ-S-02 | Galle free-delivery threshold | — | `calculateShopDeliveryFee` | galle_local, 3000 | 0 | 0 | Pass |
| TC-15 | REQ-S-02 | Just below threshold | — | `calculateShopDeliveryFee` | galle_local, 2999 | 200 | 200 | Pass |
| TC-16 | REQ-S-03 | Cart exceeds stock | API running | POST `/orders/validate-cart` | Arduino Uno ×100 (stock 49) | valid = false, "only has 49" | As expected | Pass |
| TC-17 | REQ-A-01 | Admin login success | API running | POST `/admin/login` | Valid credentials | 200 + HttpOnly cookie | As expected | Pass |
| TC-18 | REQ-A-02 | 5th failure locks the account | Fresh IP | 5 × wrong login | — | 5th → 401 "locked"; 6th → 429 + Retry-After | As expected | Pass |
| TC-19 | REQ-A-03 | No username enumeration | API running | Login with wrong user / wrong password | ghost/wrong, Dory/wrong | Identical 401 message | Identical | Pass |
| TC-20 | REQ-A-04 | Tampered JWT rejected | API running | GET `/admin/me` with a modified token | Bad signature | 401 | 401 | Pass |
| TC-21 | REQ-A-04 | Forged JWT with the default secret rejected | Server without a custom secret | GET `/admin/me` with a token signed by the default secret | — | 401 | **200** | **Fail → BUG-04** |
| TC-22 | REQ-A-04 | Mutation without auth | API running | POST `/api/v1/products` | `{}` | 401 | 401 | Pass |
| TC-23 | F2 (UI) | Add a product to the cart | Client + API running | `/shop` → Add to Cart → open cart | — | Cart dialog with "Order via WhatsApp" | As expected | Pass (SEL-01) |
| TC-24 | F1 (UI) | Upload STL and see specification | Client + API running | `/quote` → upload STL | ASCII STL | Specification panel and materials shown | As expected | Pass (SEL-02) |
| TC-25 | Reliability | Health reflects DB outage | DB unreachable | GET `/health` | — | `database: fallback` | **`available`** | **Fail → BUG-02** |

## 2.4 Test environment

| Item | Local | CI (GitHub Actions) |
|---|---|---|
| OS | Windows 11 Home (26200) | ubuntu-latest |
| Runtime | Node 24 (local) / Node 22 (CI) | Node 22 |
| Browser | Google Chrome (Selenium), Playwright Chromium | Chrome (preinstalled), Playwright Chromium |
| Java | JDK 27 (for JMeter 5.6.3) | — |
| Database | **Disabled for tests** (`NODE_ENV=test` → `getDb()` returns null) or unreachable URL → seed-data fallback | Same |
| Test data | `server/src/db/seedData.ts` (7 materials, product catalogue with stock); inline STL fixtures; `docs/sqa/postman/local.postman_environment.json` | Same |
| Ports | API :4000, Vite :5173 | Same |

**Server modes used:**

| Purpose | Command | DB | Rate limits |
|---|---|---|---|
| Unit / BDD | `npm test`, `npm run test:bdd` | none | off |
| API / Selenium / JMeter run B | `DATABASE_URL=postgresql://qa:qa@127.0.0.1:1/none npm run dev:server` | fallback | on |
| JMeter capacity (runs A/A2) | `PORT=4001 NODE_ENV=test npx tsx src/index.ts` (in `server/`) | none | off |
