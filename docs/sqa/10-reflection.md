# 10. Reflection: Agile & DevOps in Amboss's Testing Approach

Amboss is built iteratively by a small team. The commit history shows short feature increments (catalogue, quote engine, admin CMS) followed by hardening passes (SEC-01, GEO-01/02, DAT-01–03). That rhythm is Agile in practice: working software every iteration, with quality work fed back into the next one rather than left to a final testing phase. This SQA exercise made the approach explicit and showed where it was strong and where it had gaps.

**Shift-left testing.** The project already moved some quality checks to the earliest possible point. Every API input is described by a Zod schema, so invalid data is rejected at the boundary, and TypeScript's compiler catches whole classes of defects before any test runs. We extended this by deriving EP and BVA cases directly from those schemas. The schema *is* the specification, so test design can start the day an endpoint is designed. TDD (section 5.2) pushes this further: the test exists before the code.

**Continuous integration as continuous testing.** The GitHub Actions pipeline turns the test pyramid into a gate that runs on every push. Lint, about 200 unit and integration tests, BDD scenarios and the production build run first. API (Newman), UI (Playwright, Selenium) and static analysis (SonarCloud) run only if those pass. That ordering is deliberate DevOps feedback-loop design: the fastest, cheapest tests fail first, so a developer learns about a broken boundary in about a minute, not after a 10-minute browser run. Artifacts (coverage, Cucumber HTML, Selenium screenshots, Newman JUnit) make every run auditable without re-running it.

**The test pyramid in practice.** Most checks are fast unit tests on pure functions (`pricing.ts`, `logistics.ts`). A middle layer exercises real HTTP semantics in-process via `fastify.inject`, with no network and no database. A thin top layer of browser tests validates real user journeys. This kept the whole suite under a minute locally, which keeps developers running it.

**What the exercise taught us.**
1. *Coverage is necessary but not sufficient.* `pricing.ts` reached 100% branch coverage, yet BUG-01 (an unreachable minimum price) survived until boundary-value analysis of the output domain.
2. *Exploratory evidence matters.* BUG-03 was spotted by reading an automated Selenium screenshot: a flat square priced as a 2.67 cm³ part. Automation produces the evidence; a human still has to look at it.
3. *Security needs adversarial thinking, not only assertions.* The existing tests verified that the lockout worked. None asked "what if the secret is the default one?" BUG-04 shows that configuration is part of the attack surface, which DevOps practice calls "policy as code": the app should refuse to start with an insecure configuration.
4. *Static analysis and review complement each other.* SonarCloud found an open redirect that our tests had missed. Reviewing the lines it flagged then exposed BUG-06, a logic error no rule could see. The quality gate also failed on our own CI change, which shows that pipeline code needs the same scrutiny as product code.
5. *Tests make optimisation safe.* The TDD fix for BUG-03 turned out to be slow on very large files. With its tests in place, it was made about 10 times faster without changing results.
6. *Root-cause analysis pays off.* Both historical defects (SEC-01, GEO-02) had the same meta-cause: test data chosen for convenience rather than from systematic partitions. The decision-table and rotated-part tests now guard against both permanently.

**Definition of Done.** We propose the team's DoD becomes:
- code reviewed
- unit tests for new logic, with boundary cases
- CI green
- no new Sonar issues above *Minor*
- for any bug fix, a regression test that failed before the fix

`it.fails` markers kept BUG-01 and BUG-03 visible in every test run until their tests passed and the markers were removed.

**Next steps for a mature DevOps pipeline:**
- a staging environment with its own database, so integration and load tests can include real Postgres behaviour
- a SonarCloud quality gate as a required PR check
- contract tests to keep the duplicated client and server pricing logic in sync until it is unified
- production monitoring with a health check that actually queries the database (BUG-02), so operations sees outages before customers do
