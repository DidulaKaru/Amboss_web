import { z } from 'zod'
import dotenv from 'dotenv'

// Tests (Vitest and the BDD run set NODE_ENV=test) must be hermetic: use the built-in dev defaults,
// never a developer's local server/.env, so rotating real secrets can't break the suite.
if (process.env.NODE_ENV !== 'test') dotenv.config()

/**
 * Development-only fallbacks. These values are public (they live in this repo), so they must
 * never be accepted in production; `assertProductionSecrets` enforces that at startup.
 */
export const DEV_DEFAULT_ADMIN_PASSWORD_HASH =
  '$2b$10$if6Vv4XeouWjfdqpIvQBIurozAOyjzN0hpoCNlVTnJJ4eyrFlDpMG'
export const DEV_DEFAULT_JWT_SECRET = 'amboss-industrial-jwt-secret-key-super-secure'

/** Placeholders from server/.env.example that must also be rejected. */
const PLACEHOLDER_VALUES = new Set([
  'replace-with-a-very-long-random-secret-key',
  'replace-with-bcrypt-hash',
])

export const MIN_JWT_SECRET_LENGTH = 32

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/amboss'),
  DATABASE_URL_DIRECT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('https://amboss.lk,https://www.amboss.lk'),
  ADMIN_USERNAME: z.string().default('Dory'),
  ADMIN_PASSWORD_HASH: z.string().default(DEV_DEFAULT_ADMIN_PASSWORD_HASH),
  // Number of reverse-proxy hops to trust for X-Forwarded-For (0 = trust none).
  // Defaults to 1 in production (single load balancer), 0 elsewhere.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).optional(),
  JWT_SECRET: z.string().default(DEV_DEFAULT_JWT_SECRET),
})

export type Env = z.infer<typeof envSchema>

/**
 * Refuses to run in production with the public development defaults (or .env.example placeholders)
 * for the admin password hash or JWT secret. Anyone could otherwise forge an admin session
 * (see BUG-04 in docs/sqa/08-defects.md). Throws one error listing every problem found.
 */
export function assertProductionSecrets(
  config: Pick<Env, 'NODE_ENV' | 'ADMIN_PASSWORD_HASH' | 'JWT_SECRET'>
): void {
  if (config.NODE_ENV !== 'production') return

  const problems: string[] = []

  const hash = config.ADMIN_PASSWORD_HASH
  if (hash === DEV_DEFAULT_ADMIN_PASSWORD_HASH || PLACEHOLDER_VALUES.has(hash)) {
    problems.push('ADMIN_PASSWORD_HASH is unset or a public default; set a new bcrypt hash')
  } else if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(hash)) {
    problems.push('ADMIN_PASSWORD_HASH is not a valid bcrypt hash')
  }

  const secret = config.JWT_SECRET
  if (secret === DEV_DEFAULT_JWT_SECRET || PLACEHOLDER_VALUES.has(secret)) {
    problems.push('JWT_SECRET is unset or a public default; set a long random value')
  } else if (secret.length < MIN_JWT_SECRET_LENGTH) {
    problems.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`)
  }

  if (problems.length > 0) {
    throw new Error(`Insecure production configuration:\n - ${problems.join('\n - ')}`)
  }
}

export const env: Env = envSchema.parse(process.env)
assertProductionSecrets(env)

/**
 * Resolves the Fastify `trustProxy` value: trust exactly N reverse-proxy hops in production, none elsewhere.
 *
 * A function is used (rather than the bare number) because Fastify >= 5.12 treats a numeric
 * `trustProxy` as "trust nothing", which would collapse every client behind the load balancer
 * onto the proxy's IP. With hops=1, request.ip is the right-most X-Forwarded-For entry, i.e.
 * the address the proxy itself observed, so a client-injected X-Forwarded-For prefix is ignored.
 */
export function resolveTrustProxy(
  nodeEnv: string = env.NODE_ENV
): false | ((address: string, hop: number) => boolean) {
  if (nodeEnv !== 'production') return false
  const hops = env.TRUST_PROXY_HOPS ?? 1
  return hops > 0 ? (_address, hop) => hop < hops : false
}
