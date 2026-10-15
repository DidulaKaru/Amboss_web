import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/amboss'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD_HASH: z.string().default('$2b$10$yShZVCy0Wx.eGfJcwo5OEelZaa.GbkcB9xhYbITiXS4FNcRTOjj6e'),
  JWT_SECRET: z.string().default('amboss-industrial-jwt-secret-key-super-secure'),
})

export type Env = z.infer<typeof envSchema>
export const env: Env = envSchema.parse(process.env)
