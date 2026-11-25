# 1. Test Plan: Amboss Web

| | |
|---|---|
| **System under test** | Amboss Web: 3D-printing quotation and maker-store platform (amboss.lk) |
| **Architecture** | React 19 + Vite SPA (client) · Fastify 5 + Drizzle ORM + PostgreSQL REST API (server) · TypeScript monorepo |
| **Version / branch** | `dev` |
| **Prepared by** | TODO(team): names and student IDs |
| **Date** | TODO(team) |

## 1.1 Objectives
1. Verify that the quotation engine produces correct, deterministic prices and machine routing for every valid input, and rejects invalid input.
2. Verify that the shop's cart, stock validation and delivery-fee rules behave as specified.
3. Verify that the admin area is protected against unauthorised access and brute-force attacks.
4. Measure performance under concurrent load and confirm rate limiting works.
5. Establish automated regression testing in CI, and measure code quality with SonarQube.

## 1.2 Scope

### In scope
| ID | Feature | Main components |
|---|---|---|
| F1 | **Instant 3D-print quote** | `client/src/features/quote/utils/stlParser.ts`, `pricing.ts`, `POST /api/v1/quote/calculate` |
| F2 | **Shop & checkout** | `cartInternal.ts`, `client/src/config/logistics.ts`, `POST /api/v1/orders/validate-cart`, `/whatsapp-payload` |
| F3 | **Admin authentication & CMS** | `POST /api/v1/admin/login`, `/me`, `/logout`, protected product/portfolio CRUD |
| F4 | Public catalogue APIs | `GET /api/v1/materials`, `/products`, `/machines`, `/portfolio`, `/health` |

### Out of scope
- The 3D hero animation and WebGL shaders (visual only, no business logic)
- SEO metadata, sitemap, static About/Projects page content
- WhatsApp message delivery: we only verify the generated `wa.me` link
- Production infrastructure (hosting, DNS, the Neon database). **No testing is performed against the live site**, except Lighthouse, which only loads public pages.
- Mobile native apps (there are none)

## 1.3 Approach: the test pyramid

| Level | Technique | Tool | Location |
|---|---|---|---|
| Unit | Black-box (EP, BVA), white-box (branch coverage), TDD | Vitest (the TypeScript equivalent of JUnit/PyTest) | `client/tests`, `server/tests` |
| Integration / API | Black-box via in-process HTTP (`fastify.inject`) | Vitest | `server/tests` |
| Acceptance | BDD (Gherkin) | Cucumber.js | `server/features` |
| API (black-box, over the network) | Functional and security assertions | Postman + Newman | `docs/sqa/postman` |
| UI / E2E | User-journey automation | Playwright (existing) + Selenium WebDriver | `client/e2e`, `client/selenium` |
| Non-functional | Load / stress | Apache JMeter | `docs/sqa/jmeter` |
| Security | OWASP Top 10 manual checks | curl, Postman, Node scripts | `07-perf-security-usability.md` |
| Static analysis | Code smells, debt, coverage | ESLint, `tsc`, SonarCloud | CI |

## 1.4 Quality model: ISO/IEC 25010

| Characteristic | Sub-characteristic | How we test it |
|---|---|---|
| **Functional suitability** | Correctness, completeness | EP/BVA on quote and fee rules, decision tables, BDD scenarios |
| **Reliability** | Fault tolerance, recoverability | Corrupt/empty/open STL files; DB-unavailable fallback mode (BUG-02, OBS-01) |
| **Security** | Confidentiality, integrity, authenticity | Lockout decision table, JWT tampering, access control, injection, headers (BUG-04) |
| **Performance efficiency** | Time behaviour, capacity | JMeter: capacity, stress, and rate-limited runs |
| **Usability** | Operability, user error protection, accessibility | Lighthouse audits, E2E walkthrough |
| **Maintainability** | Analysability, modifiability, testability | Cyclomatic complexity, SonarCloud smells, duplication, debt |

## 1.5 Verification vs validation

| | Verification: "are we building the product right?" | Validation: "are we building the right product?" |
|---|---|---|
| **Question** | Does the code conform to its specification (`guide.md`, Zod schemas, READMEs)? | Does it meet customers' and the owner's real needs? |
| **Activities** | Code review on PRs; ESLint and `tsc --noEmit`; SonarCloud static analysis; unit tests against spec values (fees, limits); white-box coverage analysis | BDD scenarios written from the customer's view; Playwright/Selenium end-to-end journeys; owner acceptance of the quote output |
| **Static or dynamic** | Mostly static, plus dynamic unit tests | Dynamic |
| **Example** | "infillPct 101 returns 400" matches the schema | "A maker can upload a part and understand the price breakdown" |

## 1.6 Resources

| Role | Responsibility | Member |
|---|---|---|
| Test lead | Plan, schedule, defect triage, final report | TODO(team) |
| Test designer | EP/BVA/decision tables, test cases | TODO(team) |
| Automation engineer | Vitest, Cucumber, Selenium, Newman, CI | TODO(team) |
| Performance & security tester | JMeter, OWASP checks | TODO(team) |

**Tools:** Node 22, Vitest 5, Cucumber 13, Playwright, Selenium WebDriver 4, Postman/Newman, JMeter 5.6.3, SonarCloud, GitHub Actions, GitHub Issues/Projects.

## 1.7 Schedule

| Week | Activities | Deliverable |
|---|---|---|
| 1 | Requirement analysis, test plan, environment setup | `01`, `02` |
| 2 | Test design: EP, BVA, decision tables, CFG | `03`, `04` |
| 3 | Automation: unit, BDD, API, UI; CI pipeline | `05`, `06`, green pipeline |
| 4 | Performance, security, usability; defect logging and RCA | `07`, `08` |
| 5 | SonarCloud metrics, improvements, reflection, closure report | `09`, `10` |

## 1.8 Entry and exit criteria
- **Entry:** code builds (`npm run build`); test environment is up; requirements baselined.
- **Exit:**
  - All P1 test cases executed.
  - 100% statement and branch coverage on `pricing.ts` and `logistics.ts`.
  - Server coverage ≥ 65% statements.
  - No open Critical defects. BUG-04 must be resolved or accepted with a mitigation plan.
  - CI pipeline green.

## 1.9 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Tests accidentally write to the production Neon DB | Data pollution | Tests run with `NODE_ENV=test` (DB disabled); API/load tests use an unreachable `DATABASE_URL` so seed-data fallback is used |
| Rate limiter distorts load-test results | Misleading metrics | Separate runs: capacity (limits off) vs production config (limits on) |
| In-memory lockout state leaks between tests | Flaky tests | Unique source IP per test |
| Time constraints | Incomplete coverage | Prioritise F1 and F3 (money and security) |
