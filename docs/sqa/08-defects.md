# 8. Defect Tracking

**Tool:** GitHub Issues + GitHub Projects board.
**Template:** [.github/ISSUE_TEMPLATE/bug_report.md](../../.github/ISSUE_TEMPLATE/bug_report.md)

## 8.1 Workflow setup

**Labels**
- `bug`
- `severity:critical`, `severity:major`, `severity:minor`
- `priority:P1`, `priority:P2`, `priority:P3`
- `status:new`, `status:assigned`, `status:fixed`, `status:verified`

**Projects board columns:** New → Assigned → Fixed → Verified → Closed

| State | Entry condition | Who |
|---|---|---|
| New | Issue filed from the template, with steps to reproduce and evidence | Tester |
| Assigned | Triaged; severity and priority set; developer assigned | Test lead |
| Fixed | PR merged with "Fixes #N" and a regression test that failed before the fix | Developer |
| Verified | Tester re-runs the original test case and the CI pipeline; both green | Tester |
| Closed | Verification comment added, issue closed | Tester |

## 8.2 Defect log

Every defect below was found during this SQA exercise and is backed by an automated test or a reproducible command.

| ID | Title | Found by | Severity | Priority | Status |
|---|---|---|---|---|---|
| BUG-01 | Minimum print price (250 LKR) can never apply; cheapest quote is 450 LKR | BVA: TC-BB-18 | Minor | P3 | New |
| BUG-02 | `/health` reports `database: available` when the DB is unreachable | Exploratory API testing | Major | P2 | New |
| BUG-03 | Open or non-watertight STL gets a non-zero volume and is priced as valid | Selenium SEL-02 screenshot, then EP TC-BB-23 | Major | P2 | **Fixed** in `d3f36e9` commit |
| BUG-04 | Public default JWT secret and admin password hash are used, with no fail-fast | OWASP A02/A07 manual check | **Critical** | **P1** | **Fixed** in `df4d5b6` (production start guard in `env.ts`); secrets rotated in production |
| BUG-05 | Stale E2E assertion (hero heading) made CI red on `dev` | CI run #44356632231, then a local Playwright run | Minor (test defect) | P1 (blocks pipeline) | **Fixed**: `client/e2e/hero-scroll.spec.ts` updated |
| OBS-01 | No fast-fail when Postgres is down; requests hang up to 15 s | Newman timings, JMeter run B | Major | P2 | New |

### BUG-01: Minimum print price is unreachable
- **Steps:** call `calculateQuote()` with a tiny part (0.01 cm³, PLA+, 20% infill, 0.2 mm). Or upload any tiny STL on `/quote`.
- **Expected:** total = 250 LKR (the UI shows "Min print Rs 250").
- **Actual:** total = 450 LKR.
- **Why:**
  - The handling fee alone is 250 LKR.
  - Machine time is at least 0.5 h × 160 = 80 LKR.
  - Material is at least 6 g × 20 = 120 LKR.
  - So `Math.max(250, raw)` never chooses 250.
- **Evidence:** `client/tests/blackbox.test.ts` TC-BB-18 (`it.fails`).
- **Note:** statement and branch coverage on `pricing.ts` is 100%, yet coverage did not reveal this. Only BVA did, because `Math.max` is not counted as a branch.

### BUG-02: Health check misreports database status
- **Steps:** start the server with `DATABASE_URL=postgresql://qa:qa@127.0.0.1:1/none`, then `GET /health`.
- **Expected:** `"database": "fallback"` or `"unavailable"`.
- **Actual:** `"database": "available"`.
- **Root cause:** `postgres()` connects lazily, so `getDb()` returns a client object even when no connection is possible. `health.ts` only checks `db ? 'available' : 'fallback'` and never runs a query such as `SELECT 1`.

### BUG-03: Open-surface STL priced as a valid part
- **Steps:** upload an STL with a single 20 × 20 mm square at z = 20 (2 triangles).
- **Expected:** a warning that the mesh is not watertight, or rejection.
- **Actual:** reported as 2.67 cm³ (= ⅓ × 400 mm² × 20 mm), bounding box 20 × 20 × **0** mm, and priced normally.
- **Root cause:**
  - The divergence-theorem volume is only valid for closed meshes. For an open surface it depends on the distance from the origin.
  - `isManifoldEstimate` is just `volume > 0.001`, not an edge-manifold check.
- **Evidence:** `client/tests/blackbox.test.ts` TC-BB-23/24, `evidence/selenium/SEL-02_*.png`.

### BUG-04: Known default secrets (Critical)
- **Steps:**
  1. Start the server without `JWT_SECRET` set (or with the value from `.env.example` / the default in `env.ts`).
  2. Sign a JWT `{username:'Dory', role:'admin'}` with HS256 and the default secret from `server/src/config/env.ts`.
  3. Send it as the `amboss_admin_token` cookie to `/api/v1/admin/me`.
- **Expected:** 401.
- **Actual:** 200, with full admin access.
- **Additional findings:**
  - The local `.env` uses exactly the public default `JWT_SECRET` and `ADMIN_PASSWORD_HASH`.
  - The plaintext admin password appears in `server/tests/helpers.ts` and the e2e specs, in a **public** repository.
- **Fix (done):** commit `df4d5b6` + production secrets rotated. Original proposal:
  - In `env.ts`, refuse to start when `NODE_ENV=production` and `JWT_SECRET` or `ADMIN_PASSWORD_HASH` is missing or equals the default.
  - Rotate both secrets in the hosting environment.
  - Read test credentials from environment variables.
- ⚠ **Do not** test this against the live site. It was verified only against local servers.

### BUG-05: Stale E2E test broke the pipeline
- **What happened:**
  - Commit `2e79235` changed the hero `<h1>` from "From idea to physical part" to "From Concept to Reality".
  - `hero-scroll.spec.ts` still expected the old text, so the `e2e` job failed on the "UI fixes" push (18 Nov 2026).
  - The commit was pushed anyway.
- **Root cause:** UI copy changed without running the E2E suite locally; nothing required CI to be green before continuing.
- **Fix:** assertion updated. Preventive action: make CI a required status check on `main` (branch protection).

### OBS-01: No circuit breaker for database outages
With the DB unreachable, requests that miss the cache wait for `connect_timeout` (15 s):
- Newman: `whatsapp-payload` took 6 s and the injection-SKU lookup took 12 s.
- JMeter run B: 122 of 2000 requests hit 15 s socket timeouts.

## 8.3 Root Cause Analysis

### RCA-1: SEC-01, brute-force lockout never triggered (fixed in commit `0e941a3`)

**Symptom:** an attacker could try unlimited passwords; the 5-attempt lockout never activated.

**Faulty code (before):**
```ts
const currentAttempts = (attempt && attempt.lockoutUntil <= now ? 0 : attempt?.count || 0) + 1
loginAttempts.set(ip, { count: currentAttempts, lockoutUntil: isLocked ? now + LOCKOUT_WINDOW_MS : 0 })
```

**5 Whys**
1. *Why was the attacker never locked out?* `currentAttempts` was always 1.
2. *Why always 1?* The "lockout expired → reset counter" branch ran on every request.
3. *Why did it run every time?* `lockoutUntil` is stored as `0` when not locked, and `0 <= now` is always true.
4. *Why did nobody notice?* There was no test that made 5 consecutive failed logins. Tests covered one bad login and one good login only.
5. *Why was there no such test?* The lockout rules were never written as a decision table, so the "N-th failure" condition was never identified as needing a test case.

**Fishbone (Ishikawa)**

| Category | Contributing cause |
|---|---|
| Method | No decision-table or state-transition analysis of the login rules |
| Code | `0` used as a sentinel for "not locked", which collides with a valid timestamp comparison |
| Test | No negative test for repeated failures; coverage looked fine because every line ran |
| People | Security logic reviewed by the same person who wrote it |
| Tooling | No SAST rule or Sonar quality gate on security hotspots |

**Corrective action (done):** check `lockoutUntil > 0 &&` before treating a lockout as expired; reset count when locking; add a regression test.

**Preventive action (this SQA work):**
- `server/tests/admin.decision-table.test.ts` covers rules R1–R6.
- The BDD scenario "Account locks after 5 failed logins" runs in CI on every push.

### RCA-2: GEO-02, rotated SLA parts falsely flagged as oversized (fixed in commit `0e941a3`)

**Symptom:** a 210 × 100 × 200 mm part was rejected for the resin printer even though it fits when rotated.

**Faulty code (before):**
```ts
if (dims.x <= 211 && dims.y <= 118 && dims.z <= 220)
```

**5 Whys**
1. *Why was the part rejected?* Its y-dimension (100) passed, but x was checked against the wrong vat axis for its orientation.
2. *Why axis-by-axis?* The check assumed the customer's STL is already oriented the way the printer will print it.
3. *Why was that assumption made?* The requirement "part fits in vat" was never specified as orientation-independent.
4. *Why wasn't it caught?* The tests used cubes (x = y = z), for which orientation doesn't matter. This is an equivalence-partitioning gap: there were no "non-cubic, fits only when rotated" cases.
5. *Why?* Test data was chosen for convenience, not from input partitions.

**Corrective action (done):** sort both the part and vat dimensions before comparing.

**Preventive action:** `client/tests/pricing.branches.test.ts` P1 uses a 210 × 100 × 200 part, so the regression is covered.

## 8.4 Bug lifecycle (BUG-01)

Checklist to follow on GitHub, screenshotting each step:

1. **New:** file BUG-01 from the template. Labels: `bug`, `severity:minor`, `priority:P3`, `status:new`.
2. **Assigned:** assign a team member; move the card to Assigned; label `status:assigned`.
3. **Fixed:** branch `fix/bug-01-min-price` → change the code → remove `.fails` from TC-BB-18 → open a PR with "Fixes #N" → CI green → merge.
4. **Verified:** a tester re-runs `npm test --workspace=client` and the quote page, then comments with the result and a screenshot. Label `status:verified`.
5. **Closed:** the issue closes automatically on merge (or manually after verification). Screenshot the full issue timeline.

> **Shop-owner decision needed (do not change prices without it):** this fix changes what real customers are charged, or what the quote page promises. Ask the owner which is intended. Should 250 LKR be the minimum *including* handling (then clamp the total and drop the separate handling line for tiny parts)? Or should the minimum apply to material + machine only (then clamp before adding handling)? Or should the "Min print Rs 250" label be removed?
