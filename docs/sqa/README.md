# SQA Deliverables: Amboss Web

| § | Topic | Document |
|---|---|---|
| 3.1 | Introduction & test planning | [01-test-plan.md](01-test-plan.md) |
| 3.2 | STLC & test cases | [02-stlc-test-cases.md](02-stlc-test-cases.md) |
| 3.3 | Black-box testing (EP, BVA, decision tables) | [03-black-box.md](03-black-box.md) |
| 3.4 | White-box testing (cyclomatic complexity, coverage) | [04-white-box.md](04-white-box.md) |
| 3.5 | TDD / BDD | [05-tdd-bdd.md](05-tdd-bdd.md) |
| 3.6 | Test automation & CI/CD | [06-automation-cicd.md](06-automation-cicd.md) |
| 3.7 | Performance, security & usability | [07-perf-security-usability.md](07-perf-security-usability.md) |
| 3.8 | Defect tracking & RCA | [08-defects.md](08-defects.md) |
| 3.9 | Quality metrics & SonarQube | [09-metrics-sonarqube.md](09-metrics-sonarqube.md) |
| 3.10 | Agile/DevOps reflection | [10-reflection.md](10-reflection.md) |

## Quick commands

| What | Command |
|---|---|
| Unit + integration tests | `npm test` |
| With coverage | `npm run test:coverage` |
| BDD (Cucumber) | `npm run test:bdd --workspace=server` |
| Cyclomatic complexity report | `npm run lint:complexity --workspace=client` |
| API tests (needs API on :4000) | `npm run test:api -- --env-var "adminPassword=<your local admin password>"` |
| Selenium (needs API :4000 + Vite :5173) | `npm run test:selenium --workspace=client` |
| Playwright | `npm run test:e2e` |
| JMeter | see [07](07-perf-security-usability.md#71-load-testing-with-apache-jmeter) |

⚠ Never point API, Selenium or JMeter tests at the production database. Start the API with `DATABASE_URL=postgresql://qa:qa@127.0.0.1:1/none` (seed-data fallback) or `NODE_ENV=test`.

Generated reports (git-ignored): `client/coverage/`, `server/coverage/`, `server/reports/`, `docs/sqa/reports/`.
Committed evidence: `docs/sqa/evidence/`.
