# SQA Assignment: Step-by-Step Checklist (Amboss Web)

**Legend**
- **[C]** = done by Claude in the repo
- **[YOU]** = needs you or your team (accounts, screenshots, real users, decisions)

All written deliverables live in [docs/sqa/](docs/sqa/README.md). Screenshots go in [docs/sqa/evidence/](docs/sqa/evidence/).

**Test counts**
- Baseline: 88 Vitest tests
- Now:
  - 199 Vitest (104 client + 95 server, all passing)
  - 9 BDD scenarios
  - 26 Newman requests (46 assertions)
  - 4 Selenium tests
  - 11 Playwright tests

---

## 🚨 Step 0: Do this FIRST (before pushing anything) **[YOU]**
- [x] **0.1** Check the production server's environment variables in your hosting dashboard (Vercel/Render/etc.). If `JWT_SECRET` is unset or equals the default in `server/src/config/env.ts`, **anyone can forge an admin login on amboss.lk**. The same applies if `ADMIN_PASSWORD_HASH` is the old default (it was public in the repo).
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
- [x] **A8 [YOU]** TDD: make the 3 commits (Red → Green → Refactor) for BUG-03 (open-STL detection) from [05-tdd-bdd.md §5.2](docs/sqa/05-tdd-bdd.md); the RED test is already in `client/tests/watertight.test.ts`; screenshot the failing and passing runs

## Phase B: CI/CD & quality tooling
- [x] **B1 [C]** `.github/workflows/ci.yml`: validate (lint, coverage, BDD, build) → api (Newman) + e2e (Playwright, Selenium) + sonar
- [x] **B2 [C]** `sonar-project.properties`
- [x] **B3 [YOU]** SonarCloud setup, following [09 §9.1](docs/sqa/09-metrics-sonarqube.md):
  - Create the account and import the repo.
  - Add the `SONAR_TOKEN` GitHub secret.
  - Put the org and project key into `sonar-project.properties`.
- [x] **B4 [YOU]** Commit and push to `dev` (after Step 0). Screenshot the green Actions run: job graph, step logs, artifacts.
- [x] **B5a [C]** SonarCloud table filled in and 3 issues described in [09](docs/sqa/09-metrics-sonarqube.md); all 47 issues fixed (0 open in the scan of `8536e9b`)
- [ ] **B5b [YOU]** After the next merge to `main`, check that the quality gate passes and screenshot it as `docs/sqa/evidence/SonarQube/After.png`

## Phase C: Performance & security
- [x] **C1 [C]** JMeter plan `docs/sqa/jmeter/amboss.jmx`. Ran 3 runs (capacity, stress at 2 000 req/s, rate-limited); results are in doc 07.
- [x] **C2 [YOU]** Screenshots of the JMeter HTML dashboard (`docs/sqa/reports/jmeter/runA2-html/index.html`). Optionally re-run it yourselves; commands are in doc 07.
- [x] **C3 [C]** OWASP checks A01/A02/A03/A05/A07 → found **BUG-04 (Critical)**
- [x] **C4 [C]** Usability: Lighthouse run on amboss.lk; scores in [07 §7.3](docs/sqa/07-perf-security-usability.md)

## Phase D: Defect tracking
- [x] **D1 [C]** Issue template (`.github/ISSUE_TEMPLATE/bug_report.md`) + 5 bug reports drafted in [08-defects.md](docs/sqa/08-defects.md)
- [x] **D2 [C]** RCA (5 Whys + fishbone) for SEC-01 and GEO-02
- [x] **D3a [C]** Labels created; BUG-01 to 04, BUG-06 and BUG-07 filed as issues #6 to #11
- [ ] **D3b [YOU]** Create the Projects board (New/Assigned/Fixed/Verified/Closed). Claude's GitHub token has no `project` scope
- [x] **D4a [C]** BUG-01: minimum print price removed (shop-owner decision); no customer price changes
- [ ] **D4b [YOU]** Verify and close #6 and #10 (merged in PR #12) and screenshot the timelines. #8, #9 and #11 are closed

## Phase E: Documentation
- [x] **E1–E7 [C]** Docs 01–10 written in `docs/sqa/`
- [ ] **E8 [YOU]** Fill the `TODO(team)` fields (names, roles, dates) in [01-test-plan.md](docs/sqa/01-test-plan.md); add screenshots; export to PDF/Word
