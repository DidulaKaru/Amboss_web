# SQA Assignment: Step-by-Step Checklist (Amboss Web)

**Legend**
- **[C]** = done by Claude in the repo
- **[YOU]** = needs you or your team (accounts, screenshots, real users, decisions)

All written deliverables live in [docs/sqa/](docs/sqa/README.md). Screenshots go in [docs/sqa/evidence/](docs/sqa/evidence/).

**Test counts**
- Baseline: 88 Vitest tests
- Now:
  - 156 Vitest (154 pass + 2 expected-fail for known bugs)
  - 9 BDD scenarios
  - 26 Newman requests (46 assertions)
  - 4 Selenium tests
  - 8 Playwright tests

---

## 🚨 Step 0: Do this FIRST (before pushing anything) **[YOU]**
- [x] **0.1** Check the production server's environment variables in your hosting dashboard (Vercel/Render/etc.). If `JWT_SECRET` is unset or equals the default in `server/src/config/env.ts`, **anyone can forge an admin login on amboss.lk**. The same applies if `ADMIN_PASSWORD_HASH` is the default (password `poplintu7577`, public in the repo).
- [x] **0.2** Set a new random `JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) and a new admin password hash in production, then redeploy. Do the same in your local `server/.env`.
- [x] **0.3** Only then push the SQA work. The docs describe the exploit (BUG-04), and the repo is public.

## Phase A: Automated tests
- [x] **A1 [C]** Black-box: EP + BVA → `client/tests/blackbox.test.ts`, `server/tests/quote.bva.test.ts`
- [x] **A2 [C]** Decision-table tests for admin login (R1–R6) → `server/tests/admin.decision-table.test.ts`
- [x] **A3 [C]** White-box branch tests (P1–P9) → `client/tests/pricing.branches.test.ts` (100% stmt/branch on pricing + logistics)
- [x] **A4 [C]** Coverage tooling: `npm run test:coverage` (v8, lcov); complexity report: `npm run lint:complexity --workspace=client`
- [x] **A5 [C]** BDD: `server/features/*.feature` + steps → `npm run test:bdd --workspace=server`
- [x] **A6 [C]** Postman collection + Newman → `docs/sqa/postman/`
- [x] **A7 [C]** Selenium WebDriver suite → `client/selenium/` (screenshots auto-saved)
- [x] **A7b [C]** Fixed the stale Playwright test that was making CI red (BUG-05)
- [ ] **A8 [YOU]** TDD: make the 3 commits (Red → Green → Refactor) from [05-tdd-bdd.md §5.2](docs/sqa/05-tdd-bdd.md); screenshot the failing and passing runs

## Phase B: CI/CD & quality tooling
- [x] **B1 [C]** `.github/workflows/ci.yml`: validate (lint, coverage, BDD, build) → api (Newman) + e2e (Playwright, Selenium) + sonar
- [x] **B2 [C]** `sonar-project.properties`
- [ ] **B3 [YOU]** SonarCloud setup, following [09 §9.1](docs/sqa/09-metrics-sonarqube.md):
  - Create the account and import the repo.
  - Add the `SONAR_TOKEN` GitHub secret.
  - Put the org and project key into `sonar-project.properties`.
- [ ] **B4 [YOU]** Commit and push to `dev` (after Step 0). Screenshot the green Actions run: job graph, step logs, artifacts.
- [ ] **B5 [YOU]** Screenshot the SonarCloud dashboard and fill in the table in [09 §9.2](docs/sqa/09-metrics-sonarqube.md)

## Phase C: Performance & security
- [x] **C1 [C]** JMeter plan `docs/sqa/jmeter/amboss.jmx`. Ran 3 runs (capacity, stress at 2 000 req/s, rate-limited); results are in doc 07.
- [ ] **C2 [YOU]** Screenshots of the JMeter HTML dashboard (`docs/sqa/reports/jmeter/runA2-html/index.html`). Optionally re-run it yourselves; commands are in doc 07.
- [x] **C3 [C]** OWASP checks A01/A02/A03/A05/A07 → found **BUG-04 (Critical)**
- [ ] **C4 [YOU]** Usability: run Lighthouse and the Nielsen checklist with 2–3 real users; fill in the tables in [07 §7.3](docs/sqa/07-perf-security-usability.md)

## Phase D: Defect tracking
- [x] **D1 [C]** Issue template (`.github/ISSUE_TEMPLATE/bug_report.md`) + 5 bug reports drafted in [08-defects.md](docs/sqa/08-defects.md)
- [x] **D2 [C]** RCA (5 Whys + fishbone) for SEC-01 and GEO-02
- [ ] **D3 [YOU]** Create labels and the Projects board (New/Assigned/Fixed/Verified/Closed); file BUG-01 to 04 as issues (BUG-04 only after Step 0)
- [ ] **D4 [YOU → C]** Decide how BUG-01 should be fixed (see the end of doc 08); then I'll implement the fix in a PR with "Fixes #N"; you assign, verify, close and screenshot the timeline

## Phase E: Documentation
- [x] **E1–E7 [C]** Docs 01–10 written in `docs/sqa/`
- [ ] **E8 [YOU]** Fill the `TODO(team)` fields (names, roles, dates) in [01-test-plan.md](docs/sqa/01-test-plan.md); add screenshots; export to PDF/Word
