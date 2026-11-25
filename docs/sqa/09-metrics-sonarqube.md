# 9. Quality Metrics & SonarQube

## 9.1 Setup (SonarCloud, free for public repos) **[YOU]**
1. Go to https://sonarcloud.io → **Log in with GitHub** → **+ → Analyze new project** → select `Amboss_web`.
2. When asked for an analysis method, choose **GitHub Actions** (not Automatic Analysis, which can't import coverage).
3. Copy the **SONAR_TOKEN**. In GitHub, go to repo → Settings → Secrets and variables → Actions → **New repository secret**, name `SONAR_TOKEN`.
4. Edit [sonar-project.properties](../../sonar-project.properties): set `sonar.organization` and `sonar.projectKey` to the values SonarCloud shows.
5. Push. The `sonar` job in CI uploads analysis plus lcov coverage.

**Alternative (local SonarQube):**

```bash
docker run -d -p 9000:9000 sonarqube:community   # http://localhost:9000, admin/admin
npm run test:coverage
npx sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.token=<token>
```

## 9.2 Metrics

### Measured locally (Vitest + v8)

| Scope | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **Server** (`server/src`) | 69.6% | 55.6% | 88.2% | 71.6% |
| **Client** (`client/src`) | 22.3% | 20.9% | 8.8% | 20.1% |
| `pricing.ts` + `logistics.ts` | 100% | 100% | 100% | 100% |
| `stlParser.ts` | 86.5% | 73.2% | 100% | 94.5% |

The client's overall figure is low because React components (pages, the 3D canvas, forms) are tested by Playwright/Selenium E2E, which doesn't produce v8 unit coverage. Business logic is fully covered.

### Size and defect density

| Metric | Value |
|---|---|
| Lines of code (non-blank, TS/TSX) | client 6 493 + server 2 206 = **8 699 (8.7 KLOC)** |
| Defects found in this SQA cycle | 5 (BUG-01 to 05) + 1 observation |
| **Defect density** | 5 / 8.7 = **0.57 defects/KLOC** (excluding Sonar issues) |
| Defect density incl. Sonar bugs | (5 + *Sonar bugs*) / *Sonar KLOC* = TODO |
| Defects by severity | Critical 1 · Major 2 · Minor 2 |
| Test count | 165 Vitest (163 pass + 2 expected-fail) + 9 BDD scenarios + 26 API requests (46 assertions) + 4 Selenium + 8 Playwright tests |

### From SonarCloud **[YOU: fill in after the first scan]**

| Metric | Value | Rating |
|---|---|---|
| Coverage | % | |
| Bugs | | Reliability: |
| Vulnerabilities | | Security: |
| Security hotspots | | |
| Code smells | | Maintainability: |
| Technical debt | h / min | Debt ratio: % |
| Duplications | % | |
| Lines of code | | |
| Quality gate | Passed / Failed | |

📸 *Evidence: project Overview page, Issues list filtered by type, Measures → Coverage, Measures → Duplications → `evidence/sonar-*.png`*

## 9.3 Proposed improvements

These are already backed by measurements. Check them against the Sonar issue list and cite the rule IDs Sonar shows (e.g. `typescript:S3776` Cognitive Complexity, `typescript:S1192` duplicated strings, `typescript:S2068` hard-coded credentials).

### Improvement 1: reduce complexity of the STL parsers and `calculateQuote`
- **Evidence:** ESLint complexity: `parseBinarySTL` = 22, `parseAsciiSTL` = 22, `calculateQuote` = 16. Sonar's Cognitive Complexity limit is 15, so expect S3776 flags.
- **Action:**
  - Extract shared `accumulateTriangle(v1, v2, v3, acc)` (volume, area and bbox) from both parsers.
  - Extract `routeMachine(dims, material)` from `calculateQuote`.
- **Expected effect:** each function drops to V(G) ≤ 10, fewer tests are needed per function, and the routing logic can be reused by the server.

### Improvement 2: remove duplicated business rules between client and server
- **Evidence:** `client/src/config/logistics.ts` (84 lines) and `server/src/config/logistics.ts` (91 lines) are nearly identical. The pricing formula is implemented twice (`pricing.ts` and `pricingService.ts`). GEO-02 had to be fixed in **both** places (see RCA-2). Sonar's duplication metric will show this.
- **Action:** move the shared rules into a `shared/` workspace package (`@amboss/pricing`) imported by both.
- **Expected effect:** lower duplication %, and a pricing bug fixed once is fixed everywhere.

### Improvement 3: remove hard-coded credentials and secrets (BUG-04)
- **Evidence:** default `JWT_SECRET` and `ADMIN_PASSWORD_HASH` in `server/src/config/env.ts`; the plaintext admin password in `server/tests/helpers.ts`, `client/e2e/*.spec.ts` and the Postman environment. Sonar flags these as **Security Hotspots** (S2068 / S6418).
- **Action:**
  - Use Zod `.refine()` in `env.ts` to refuse startup in production when the secrets are missing or equal the defaults.
  - Tests read `ADMIN_TEST_PASSWORD` from the environment.
  - Rotate the production secrets.
- **Expected effect:** the Security rating improves and the hotspots are reviewed as "Safe".

### Optional: show before and after
Implement improvement 1 or 2, push, and screenshot SonarCloud's **Activity** graph showing complexity or duplication going down.
