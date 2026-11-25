# 7. Performance, Security & Usability

## 7.1 Load testing with Apache JMeter

**Test plan:** [docs/sqa/jmeter/amboss.jmx](jmeter/amboss.jmx)

| Element | Configuration |
|---|---|
| Thread Group "Customers" | `users` threads, `rampup` seconds, `loops` iterations (CLI properties) |
| Sampler 1 | `GET /api/v1/materials`: read-heavy, served from the in-memory cache |
| Sampler 2 | `POST /api/v1/quote/calculate`: compute; randomised volume, area, size and infill per request (`__Random`) |
| Assertions | Response code = 200; JSON path `$.pricing.totalPriceLkr` exists |
| Timer | Constant think time (`think`, default 200 ms) |
| Listeners | Summary Report, Aggregate Report; HTML dashboard via `-e -o` |

**Command (headless):**

```bash
jmeter -n -t docs/sqa/jmeter/amboss.jmx -Jport=4001 -Jusers=50 -Jrampup=10 -Jloops=20 \
       -l docs/sqa/reports/jmeter/runA.jtl -e -o docs/sqa/reports/jmeter/runA-html
```

**Server under test:** local machine (Windows 11, Node 24), DB disabled, so we measure the application tier and not Neon's network latency.

### Results

| Run | Purpose | Users | Ramp | Loops | Think | Samples | Throughput | Avg | p90 | p95 | p99 | Max | Errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | Capacity, normal load | 50 | 10 s | 20 | 200 ms | 2 000 | 111.9 req/s | 0.8 ms | 1 ms | 2 ms | 2 ms | 30 ms | **0%** |
| A2 | Stress | 200 | 10 s | 50 | 0 | 20 000 | **2 003 req/s** | 0.3 ms | 1 ms | 1 ms | 1 ms | 23 ms | **0%** |
| B | Production config (rate limits on, DB unreachable) | 50 | 10 s | 20 | 200 ms | 2 000 | 34 req/s | 962 ms | — | — | — | 15 005 ms | 99.1% (see below) |

Per-endpoint figures for runs A and A2:

| Run | Endpoint | Avg | p90 | p95 | p99 | Max |
|---|---|---|---|---|---|---|
| A | GET materials | 0.79 ms | 1 | 2 | 2 | 30 |
| A | POST quote | 0.86 ms | 1 | 2 | 2 | 4 |
| A2 | GET materials | 0.24 ms | 1 | 1 | 1 | 23 |
| A2 | POST quote | 0.28 ms | 1 | 1 | 1 | 5 |

**Run B breakdown (2000 samples):**

| Response | Count | Meaning |
|---|---|---|
| 200 | 18 | Allowed by the limiter |
| 429 Too Many Requests | ~1 860 | Global limiter (120 req/min/IP) and quote limiter (20/min) working ✔ |
| Socket timeout (15 s) | 122 | **OBS-01**: cache misses wait for the unreachable DB's 15 s `connect_timeout`; the pool of 10 connections saturates |

### Analysis
- Pricing is pure CPU arithmetic, so the API handles more than 2 000 req/s on one Node process with p99 ≤ 1 ms. Performance efficiency is not a risk for expected traffic, which is a small business.
- From a single client the effective limit is the **rate limiter**, by design (DoS and abuse protection). Note that all JMeter threads share one IP; real users each get their own budget.
- The real risk is **dependency failure**. With Postgres unreachable, latency jumps from about 1 ms to 15 s. Recommendation: a short `connect_timeout` (2–3 s) plus a circuit breaker that switches to seed data immediately after N failures.

📸 *Evidence **[YOU]**: open `docs/sqa/reports/jmeter/runA2-html/index.html` → screenshot the Dashboard (APDEX, Statistics table) and the "Response Times Over Time" chart → `evidence/jmeter-*.png`. Optionally open the `.jmx` in the JMeter GUI and screenshot the test-plan tree.*

## 7.2 Security: OWASP Top 10 (2021) manual checks

All checks were run **only against local servers**. Reproducible with curl or with the Postman folder "04 Security".

| OWASP | Check | Method | Result |
|---|---|---|---|
| **A01 Broken Access Control** | Admin endpoints without a cookie | `curl localhost:4000/api/v1/admin/me` | 401 ✔ |
| A01 | Mutation without auth | `curl -X POST …/api/v1/products -d '{}'` | 401 ✔ |
| A01 | Tampered JWT (bad signature) | Cookie `amboss_admin_token=<header>.<payload>.tampered` | 401 ✔ |
| **A02 Cryptographic Failures / A07 Identification & Authentication Failures** | **Forged JWT with the default secret** | Sign `{role:'admin'}` with the secret hard-coded in `env.ts`, then call `/admin/me` | First run: **200, full admin access ✘ BUG-04 (Critical)**. Re-test: the server refuses to start with it ✔ |
| A07 | Brute force | 5 wrong passwords | 5th → 401 "locked", 6th → 429 + Retry-After ✔ |
| A07 | Username enumeration | Wrong user vs wrong password | Identical message; the same bcrypt comparison runs for every username ✔ |
| A07 | Session cookie flags | Inspect `Set-Cookie` | `HttpOnly`; `Secure` + `SameSite=None` in production ✔ |
| A07 | Logout invalidates the session | login → logout → `/me` | 401 ✔ (cookie cleared; the JWT itself remains valid until expiry, a stateless-JWT limitation) |
| **A03 Injection** | SQL injection in a path parameter | `GET /api/v1/products/x' OR 1=1--` | 404, no SQL error leaked ✔ (Drizzle parameterises queries) |
| A03 | Oversized and malformed input | Long strings, wrong types | 400 via Zod `max()` / type checks ✔ |
| **A05 Security Misconfiguration** | Security headers | `curl -I /health` | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP/CORP present; no X-Powered-By ✔ |
| A05 | Error detail leakage | Force a 500 | Generic message ✔ (`security.test.ts`) |
| A05 | **Insecure defaults** | `env.ts` defaults for `JWT_SECRET`, `ADMIN_PASSWORD_HASH` | First run: **app starts with public defaults ✘ BUG-04**. Re-test: startup error ✔ |

### BUG-04 proof of concept (local only, before the fix)

```bash
# Server started from repo root (no .env) on :4002 with NODE_ENV=production
TOKEN=$(node -e "
const c=require('crypto'),b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const h=b({alg:'HS256',typ:'JWT'}),p=b({username:'Dory',role:'admin',exp:Math.floor(Date.now()/1000)+3600});
console.log(h+'.'+p+'.'+c.createHmac('sha256','<default secret from env.ts>').update(h+'.'+p).digest('base64url'))")
curl localhost:4002/api/v1/admin/me -H "cookie: amboss_admin_token=$TOKEN"
# → 200 {"success":true,"user":{"username":"Dory","role":"admin",...}}
```

At the time, the local `.env` used the same public values, and the repository is public. Both are fixed. Remediation: see [08-defects.md](08-defects.md#bug-04-known-default-secrets-critical).

## 7.3 Usability

### Lighthouse
Lighthouse 12.8.2 was run on the live site, amboss.lk, on 25 Nov 2026 (desktop preset, headless Chrome). Scores are medians, measured after the BUG-07 fix was deployed (8 runs of `/`, 3 runs each of the others).

| Page | Performance | Accessibility | Best practices | SEO (before → after BUG-07) |
|---|---|---|---|---|
| `/` | 90 | 98 | 96 | 92 |
| `/quote` | 98 | 100 | 96 | 85 → **92** |
| `/shop` | 82 | 98 | 96 | 85 → **92** |

| Page | First contentful paint | Largest contentful paint | Total blocking time | Layout shift |
|---|---|---|---|---|
| `/` | 0.8 s | 1.7 s | 16 ms | 0 |
| `/quote` | 0.8 s | 1.1 s | 0 ms | 0 |
| `/shop` | 1.2 s | 2.7 s | 0 ms | 0 |

In the first session, Lighthouse refused to score `/quote` and `/shop`, because the live site returned HTTP 404 for them (BUG-07). They could only be scored with `--ignore-status-code`. After the fix they return 200 and are scored normally.

**Measurement note:** three runs (two of `/`, one of `/shop`) scored 55 to 61 for Performance because the test machine's connection stalled: Lighthouse measured a network round trip of 0.9 to 3.1 s, against about 0.1 s normally. No run was discarded; the median limits their effect.

**Findings**

| Finding | Pages | Effect | Action |
|---|---|---|---|
| The page is returned with HTTP status 404 | `/quote`, `/shop` | SEO; search engines may not index the pages | [BUG-07](08-defects.md): **fixed**, confirmed live |
| `robots.txt` has an unknown directive, `Content-Signal` | All | SEO score only | Added by Cloudflare's managed `robots.txt`, not by our file |
| 401 logged in the browser console | All | Best practices | Every visitor's browser checks `/admin/me`. Run that check only on admin pages |
| Heading levels are skipped | `/`, `/shop` | Accessibility | Correct the heading order |
| Largest contentful paint is 2.7 s | `/shop` | Performance | Review how the product images load |

**Interpretation:** there is almost no blocking time and no layout shift, so the pages respond quickly and do not jump while loading. `/shop` is the slowest page.

📸 *Evidence: full reports in `evidence/lighthouse/` (`quote.html` and `shop.html` are before BUG-07, `*-after.html` are after). Open the HTML files in a browser to screenshot them.*
