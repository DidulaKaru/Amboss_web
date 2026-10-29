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
  JWT_SECRET: z.string().default('amboss-industrial-jwt-secret-key-super-secure'),
})

export type Env = z.infer<typeof envSchema>
export const env: Env = envSchema.parse(process.env)
