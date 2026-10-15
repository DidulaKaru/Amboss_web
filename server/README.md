# Amboss Backend API Server (`server/`)

This directory houses the Fastify REST API, database layer, authentication system, and business logic for the Amboss platform.

---

## What This Section Does

1. **Deterministic 3D Print Quoting:**
   - Evaluates part geometries, material costs, machine runtimes, and preparation QA fees.
   - Enforces the **250 LKR** minimum order policy.
2. **Maker Store Inventory API:**
   - Serves maker hardware catalog with categories and real-time stock levels.
   - Provides live cart stock validation before WhatsApp order redirection.
3. **Single-Owner Admin Authentication & CMS:**
   - Environment-driven bcrypt verification (`ADMIN_PASSWORD_HASH`).
   - Issues 24-hour JWT tokens stored in HttpOnly cookies (`amboss_admin_token`) and Bearer headers.
   - Restricts catalog mutations (`POST`, `PUT`, `DELETE /api/v1/products`) with `verifyAdmin` middleware.
4. **Logistics & WhatsApp Payload Generation:**
   - Formats customer orders with transparent itemization and delivery calculations.

---

## Directory Structure

```
server/
├── src/
│   ├── config/              # Environment parser (env.ts) and logistics SSOT (logistics.ts)
│   ├── db/                  # Drizzle ORM schema, SQLite connection, seed data
│   ├── middleware/          # Authentication guards (verifyAdmin via @fastify/jwt)
│   ├── routes/              # Fastify route plugins (health, materials, products, quote, orders, admin)
│   ├── services/            # Pure business logic (pricingService.ts, logistics.ts)
│   ├── app.ts               # Fastify app builder & plugin registration
│   └── server.ts            # Entry point listening on port 4000
├── tests/                   # Vitest API integration test suites using Fastify .inject()
├── .env.example             # Documented environment variable template
├── tsconfig.json            # Node.js TypeScript compilation configuration
└── package.json             # Server dependencies and scripts
```

---

## Environment Configuration

Copy `server/.env.example` to `server/.env` to configure local settings:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `4000` | Port for the Fastify HTTP server |
| `HOST` | `0.0.0.0` | Network binding interface |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origins (Vite dev server) |
| `DATABASE_URL` | `file:./amboss.db` | Path to SQLite database file |
| `JWT_SECRET` | `amboss-dev-secret-...` | Secret used to sign admin session tokens |
| `ADMIN_USERNAME`| `admin` | Single-owner admin username |
| `ADMIN_PASSWORD_HASH` | `$2b$10$...` | Bcrypt hash for admin password (default: `amboss2026`) |

---

## Execution Instructions

```bash
# Start server in watch mode (using tsx)
npm run dev --workspace=server

# Run all backend Vitest integration tests (17 tests)
npm test --workspace=server

# Compile production TypeScript bundle
npm run build --workspace=server
```
