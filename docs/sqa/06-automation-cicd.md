# 6. Test Automation & CI/CD

## 6.1 UI automation

### Selenium WebDriver
**Location:** [client/selenium/amboss.selenium.test.mjs](../../client/selenium/amboss.selenium.test.mjs)
**Stack:** `selenium-webdriver` 4 + Node's built-in test runner. Selenium Manager downloads a matching chromedriver automatically.

| ID | Scenario | Result |
|---|---|---|
| SEL-01 | Shop lists products → add to cart → cart dialog shows "Order via WhatsApp" | ✔ |
| SEL-02 | Quote page: upload an STL → specification and materials appear | ✔ (its screenshot exposed **BUG-03**) |
| SEL-03 | Admin login with a wrong password → "ACCESS DENIED" alert (real API, no mocks) | ✔ |
| SEL-04 | Admin login with valid credentials → dashboard "OPERATOR:" | ✔ |

**Run locally**

```bash
# terminal 1: API in DB-isolated fallback mode
cd server && DATABASE_URL=postgresql://qa:qa@127.0.0.1:1/none npx tsx src/index.ts
# terminal 2: frontend
npm run dev:client
# terminal 3
npm run test:selenium --workspace=client       # add HEADLESS=0 to watch the browser
```

Screenshots of every test are saved automatically to `docs/sqa/evidence/selenium/`.

### Playwright (existing) vs Selenium

| Aspect | Selenium WebDriver | Playwright |
|---|---|---|
| Protocol | W3C WebDriver (HTTP to a driver binary) | CDP / browser-native protocol |
| Waiting | Explicit `driver.wait(until…)` everywhere | Auto-waiting locators |
| Network mocking | Not built in | `page.route()`; used in `admin-cms.spec.ts` |
| Browsers | All major ones, including Safari, plus Selenium Grid | Chromium, Firefox, WebKit |
| Speed in this project | ~5.8 s for 4 tests | ~similar per test, parallel workers |
| Our usage | Real-backend smoke tests | Rich, mocked user journeys |

## 6.2 API automation: Postman + Newman

**Collection:** [docs/sqa/postman/amboss.postman_collection.json](postman/amboss.postman_collection.json)
**Environment:** `local.postman_environment.json`

Import both into Postman to run them in the GUI.

| Folder | Requests | What it checks |
|---|---|---|
| 01 Smoke | TC-PM-01…05 | Health, catalogue, SKU lookup, 404, Cache-Control |
| 02 Quote (BVA/EP) | TC-PM-06…12 | Itemised total, infill/layer/quantity boundaries, unknown material |
| 03 Orders | TC-PM-13…15 | Stock validation, WhatsApp payload incl. courier fee |
| 04 Security (OWASP) | TC-PM-16…22 | A01 access control, tampered JWT, A03 injection, A05 headers, A07 auth errors |
| 05 Admin session | TC-PM-23…26 | Login → `/me` → logout → `/me` = 401 (cookie jar) |

**Run:** `npx newman run docs/sqa/postman/amboss.postman_collection.json -e docs/sqa/postman/local.postman_environment.json`

**Result:** 26 requests, **46 assertions, 0 failures**.

📸 *Evidence: Newman summary table → `evidence/newman.png`; Postman GUI runner → `evidence/postman-runner.png`*

## 6.3 CI/CD pipeline: GitHub Actions

**Workflow:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml). It runs on every push or PR touching `client/`, `server/`, the Postman collection or the workflow, and can also be started manually (`workflow_dispatch`).

```
                 ┌──────────────────────────────┐
  push / PR ───▶ │ validate                     │
                 │  • npm ci                    │
                 │  • ESLint                    │
                 │  • Vitest + coverage (lcov)  │
                 │  • Cucumber BDD              │
                 │  • tsc / vite build          │
                 │  • upload coverage + BDD     │
                 └──────┬─────────┬─────────┬───┘
                        ▼         ▼         ▼
                  ┌────────┐ ┌─────────┐ ┌──────────┐
                  │ api    │ │ e2e     │ │ sonar    │
                  │ Newman │ │Playwright│ │SonarCloud│
                  │        │ │Selenium │ │ scan     │
                  └────────┘ └─────────┘ └──────────┘
```

| Job | Artifacts uploaded |
|---|---|
| validate | `coverage` (HTML + lcov), `cucumber-report` |
| api | `newman-report` (JUnit XML), server log |
| e2e | `selenium-screenshots` |
| sonar | results appear on the SonarCloud dashboard; the job is skipped with a notice if `SONAR_TOKEN` isn't set |

**Fail-fast design:** `api`, `e2e` and `sonar` depend on `validate`. A failing unit test stops the slower jobs and saves CI minutes.

### Evidence to capture **[YOU]**
1. GitHub → **Actions** → the latest run on `dev` → screenshot the **job graph** (all green) → `evidence/ci-graph.png`
2. Open each job → expand the test step → screenshot the pass summary → `evidence/ci-validate.png`, `ci-api.png`, `ci-e2e.png`
3. Scroll to **Artifacts** → screenshot the list → `evidence/ci-artifacts.png`
