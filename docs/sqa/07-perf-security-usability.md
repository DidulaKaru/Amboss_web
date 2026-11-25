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
| **A02 Cryptographic Failures / A07 Identification & Authentication Failures** | **Forged JWT with the default secret** | Sign `{role:'admin'}` with the secret hard-coded in `env.ts`, then call `/admin/me` | **200: full admin access ✘ BUG-04 (Critical)** |
| A07 | Brute force | 5 wrong passwords | 5th → 401 "locked", 6th → 429 + Retry-After ✔ |
| A07 | Username enumeration | Wrong user vs wrong password | Identical message; constant-time bcrypt against a dummy hash ✔ |
| A07 | Session cookie flags | Inspect `Set-Cookie` | `HttpOnly`; `Secure` + `SameSite=None` in production ✔ |
| A07 | Logout invalidates the session | login → logout → `/me` | 401 ✔ (cookie cleared; the JWT itself remains valid until expiry, a stateless-JWT limitation) |
| **A03 Injection** | SQL injection in a path parameter | `GET /api/v1/products/x' OR 1=1--` | 404, no SQL error leaked ✔ (Drizzle parameterises queries) |
| A03 | Oversized and malformed input | Long strings, wrong types | 400 via Zod `max()` / type checks ✔ |
| **A05 Security Misconfiguration** | Security headers | `curl -I /health` | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP/CORP present; no X-Powered-By ✔ |
| A05 | Error detail leakage | Force a 500 | Generic message ✔ (`security.test.ts`) |
| A05 | **Insecure defaults** | `env.ts` defaults for `JWT_SECRET`, `ADMIN_PASSWORD_HASH` | **App starts in production with public defaults ✘ BUG-04** |

### BUG-04 proof of concept (local only)

```bash
# Server started from repo root (no .env) on :4002 with NODE_ENV=production
TOKEN=$(node -e "
const c=require('crypto'),b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const h=b({alg:'HS256',typ:'JWT'}),p=b({username:'Dory',role:'admin',exp:Math.floor(Date.now()/1000)+3600});
console.log(h+'.'+p+'.'+c.createHmac('sha256','<default secret from env.ts>').update(h+'.'+p).digest('base64url'))")
curl localhost:4002/api/v1/admin/me -H "cookie: amboss_admin_token=$TOKEN"
# → 200 {"success":true,"user":{"username":"Dory","role":"admin",...}}
```

The local development `.env` uses the same public values, and the repository is public. Remediation: see [08-defects.md](08-defects.md#bug-04-known-default-secrets-critical).

## 7.3 Usability **[YOU]**

### Lighthouse
In Chrome DevTools → Lighthouse, run "Navigation, Desktop" on `/`, `/quote` and `/shop`. Record the scores:

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | | | | |
| `/quote` | | | | |
| `/shop` | | | | |

### Nielsen heuristic evaluation
Have 2–3 users who don't know the system complete the tasks below. Note problems and give each a severity from 0 to 4.

**Tasks**
- **T1:** Get a price for a 3D model. Use the test STL from SEL-02, or download any STL.
- **T2:** Buy two Arduino boards with courier delivery.
- **T3:** Find out how much delivery to Galle costs for a 2500 LKR order.

| # | Heuristic | What to look at in Amboss | Finding | Severity (0–4) |
|---|---|---|---|---|
| H1 | Visibility of system status | Upload progress and parse feedback on `/quote`; "added to cart" toast | | |
| H2 | Match with the real world | LKR currency, "infill" and "layer height" jargon for non-makers | | |
| H3 | User control and freedom | "Upload different file"; remove items from the cart; Escape closes the drawer | | |
| H4 | Consistency and standards | Button styles; pickup option names the same in quote and shop | | |
| H5 | Error prevention | Out-of-stock items disabled; invalid STL warning (see **BUG-03**) | | |
| H6 | Recognition rather than recall | Price breakdown visible next to the options | | |
| H7 | Flexibility and efficiency | Keyboard navigation; preset infill buttons | | |
| H8 | Aesthetic and minimalist design | Dark industrial theme; information density | | |
| H9 | Help users recover from errors | STL parse-error banner text | | |
| H10 | Help and documentation | Disclaimer "Automated estimate"; contact via WhatsApp | | |

Already observed: "Min print Rs 250" is shown on the quote page, but no quote can ever cost 250 (BUG-01). That violates H2 and H4: the label sets an expectation the system never meets.
