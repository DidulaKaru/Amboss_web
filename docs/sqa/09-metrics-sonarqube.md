# 9. Quality Metrics & SonarQube

## 9.1 Setup (SonarCloud, free for public repos)
1. Go to https://sonarcloud.io → **Log in with GitHub** → **+ → Analyze new project** → select `Amboss_web`.
2. When asked for an analysis method, choose **GitHub Actions** (not Automatic Analysis, which can't import coverage).
3. Copy the **SONAR_TOKEN**. In GitHub, go to repo → Settings → Secrets and variables → Actions → **New repository secret**, name `SONAR_TOKEN`.
4. Edit [sonar-project.properties](../../sonar-project.properties): set `sonar.organization` and `sonar.projectKey` to the values SonarCloud shows.
5. Push. The `sonar` job in CI uploads analysis plus lcov coverage.
6. The free plan analyses `main` only, so results appear after merging to `main`. Project: [DidulaKaru_Amboss_web](https://sonarcloud.io/project/overview?id=DidulaKaru_Amboss_web).

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
| **Server** (`server/src`) | 70.3% | 57.0% | 87.3% | 72.3% |
| **Client** (`client/src`) | 26.5% | 24.7% | 11.0% | 24.0% |
| Client `pricing.ts` + `logistics.ts` | 100% | 100% | 100% | 100% |
| `stlParser.ts` | 89.4% | 80.2% | 100% | 95.3% |
| `meshTopology.ts` | 98.3% | 96.0% | 100% | 100% |

The client's overall figure is low because React components (pages, the 3D canvas, forms) are tested by Playwright/Selenium E2E, which doesn't produce v8 unit coverage. The client's pricing and delivery rules are fully covered.

### Size and defect density

| Metric | Value |
|---|---|
| Lines of code (non-blank, TS/TSX) | client 6 592 + server 2 257 = **8 849 (8.8 KLOC)** |
| Defects found in this SQA cycle | 7 (BUG-01 to 07) + 1 observation |
| **Defect density** | 7 / 8.8 = **0.80 defects/KLOC** (excluding Sonar issues) |
| Defect density incl. Sonar bugs | (7 + 4 Sonar bugs) / 12.9 Sonar KLOC = **0.85 defects/KLOC** |
| Defects by severity | Critical 1 · Major 4 · Minor 2 |
| Test count | 199 Vitest + 9 BDD scenarios + 26 API requests (46 assertions) + 4 Selenium + 11 Playwright tests |

### From SonarCloud (`main`, 25 Nov 2026)

| Metric | Before (`37c2440`) | After the fixes (`8536e9b`) | Latest (`388c6a8`) |
|---|---|---|---|
| Coverage | 26.4% | 26.7% | **36.1%** |
| Bugs | 4 (Reliability **C**) | 0 (Reliability **A**) | 0 (**A**) |
| Vulnerabilities | 18 (Security **E**) | 0 (Security **A**) | 0 (**A**) |
| Security hotspots | 0 | 0 | 0 |
| Code smells | 25 (Maintainability **A**) | 0 (Maintainability **A**) | 0 (**A**) |
| Technical debt | 59 min (ratio 0.0%) | 0 min | 0 min |
| Duplications | 2.2% | 2.1% | 2.1% |
| Lines of code | 12 894 | 13 080 | 13 189 |
| Quality gate | Passed | **Failed**: coverage on new code 53.7% (80% required) | **Passed**: coverage on new code 85.0% |

The "before" issue counts are SonarCloud's classic issue types: 4 + 18 + 25 = 47 issues. The dashboard groups the same issues by software quality instead (Security 18, Reliability 29, Maintainability 24), and one issue can count under two qualities.

Coverage is lower than Vitest's server figure because it combines both workspaces, React components are tested by E2E, which produces no lcov, and in the first two scans SonarCloud also counted test files as code to be covered.

**Quality gate history:**
1. Failed (`09a7008`): Security rating C on new code, because the SonarCloud GitHub Action was referenced by a tag. Pinning it to a commit SHA (`ec54d09`) fixed it.
2. Failed (`8536e9b`): no open issues, but 53.7% coverage on new code. The largest group of uncovered lines was in our own test files, which SonarCloud counted as product code. Tests and test tooling are now excluded from the coverage measure.
3. Failed (`713c2fe`): 77.8%, a few covered lines or branches short. The size calculation inside the 3D viewer component had no unit tests, so it was moved to `sceneSize.ts` and given 10 tests.
4. **Passed** (`388c6a8`): coverage on new code 85.0%, with every other condition also passing.

The gate failed three times, each time for a different real reason, and each fix was verified by the next scan.

## 9.3 Issues found by SonarQube

The scan reported 47 issues, and all 47 have been addressed in the code. Three representative ones are described here. The scan after the fixes reports 0 open issues.

| # | Issue | Rule | Type and severity | Location |
|---|---|---|---|---|
| 1 | Client-side open redirect | `tssecurity:S6105` | Vulnerability, Blocker | `cartContext.tsx:227` |
| 2 | Admin password hash in the source code | `secrets:S8215`, `typescript:S2068` | Vulnerability, Blocker | `env.ts:13` |
| 3 | Promise not awaited or handled | `typescript:S9383` | Bug, Major | `server/src/index.ts:28` and 3 more |

### Issue 1: open redirect at checkout
- **Problem:** checkout sent the browser to a URL taken from the API response. A tampered response could have sent a customer to a phishing page.
- **Fix:** the client builds the `https://wa.me/` link itself from the shop's number and the message text.
- **Verification:** a Playwright test returns a hostile URL from a mocked API and checks that only WhatsApp opens. It fails on the old code.

### Issue 2: admin password hash in the source code
- **Problem:** a default admin hash was stored in a public repository. This is the same weakness as BUG-04, found independently by the tool.
- **Fix:** there is no default any more: without `ADMIN_PASSWORD_HASH`, admin login is disabled and production refuses to start. Tests and CI generate a random password for each run.
- **Verification:** `env.production-guard.test.ts` and `admin.decision-table.test.ts`.

### Issue 3: unhandled promise at server startup
- **Problem:** an error before the server began listening was an unhandled promise rejection instead of a clear failure.
- **Fix:** `start()` logs the error and exits with code 1. The other three calls already handled their errors and are marked with `void`.
- **Verification:** type check, and starting the built server in production mode.

**What the tool did not find:** while fixing an issue on the same lines, we noticed that typed stock quantities were never saved (BUG-06). Static analysis pointed at the line but could not see the logic error, so manual review is still needed.

## 9.4 Proposed improvements

### Improvement 1: reduce complexity of the STL parsers and `calculateQuote`
- **Evidence:** ESLint complexity: `parseBinarySTL` = 22, `parseAsciiSTL` = 22, `calculateQuote` = 16. SonarCloud did not raise a complexity issue in this scan.
- **Action:**
  - Extract shared `accumulateTriangle(v1, v2, v3, acc)` (volume, area and bbox) from both parsers.
  - Extract `routeMachine(dims, material)` from `calculateQuote`.
- **Expected effect:** each function drops to V(G) ≤ 10, and fewer tests are needed per function.

### Improvement 2: remove duplicated business rules between client and server
- **Evidence:** the delivery rules (`logistics.ts`) and the pricing formula (`pricing.ts`, `pricingService.ts`) exist on both sides. GEO-02 and BUG-01 each had to be fixed in **both** places. SonarCloud measures 2.2% duplication overall.
- **Action:** move the shared rules into a `shared/` workspace package (`@amboss/pricing`) imported by both.
- **Expected effect:** a pricing bug fixed once is fixed everywhere.

📸 *Evidence: `evidence/SonarQube/Before.png` (before the fixes) and `evidence/SonarQube/After.png` (after).*
