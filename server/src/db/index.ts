import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env.js'
import * as schema from './schema.js'

let client: postgres.Sql | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!dbInstance) {
    try {
      client = postgres(env.DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 5,
        onnotice: () => {},
      })
      dbInstance = drizzle(client, { schema })
    } catch (err) {
      console.warn('PostgreSQL client init failed, running in fallback mode:', err)
      return null
    }
  }
  return dbInstance
}

export { schema }
