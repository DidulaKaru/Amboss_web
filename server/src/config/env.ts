import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/amboss'),
  DATABASE_URL_DIRECT: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('https://amboss.lk,https://www.amboss.lk'),
  ADMIN_USERNAME: z.string().default('Dory'),
  ADMIN_PASSWORD_HASH: z.string().default('$2b$10$if6Vv4XeouWjfdqpIvQBIurozAOyjzN0hpoCNlVTnJJ4eyrFlDpMG'),
  // Number of reverse-proxy hops to trust for X-Forwarded-For (0 = trust none).
  // Defaults to 1 in production (single load balancer), 0 elsewhere.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).optional(),
  JWT_SECRET: z.string().default('amboss-industrial-jwt-secret-key-super-secure'),
})

export type Env = z.infer<typeof envSchema>
export const env: Env = envSchema.parse(process.env)

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
