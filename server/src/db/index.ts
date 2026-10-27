import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env.js'
import * as schema from './schema.js'

let client: postgres.Sql | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb(customUrl?: string) {
  if (env.NODE_ENV === 'test' && !process.env.TEST_DB_URL) {
    return null
  }
  const urlToUse = customUrl || env.DATABASE_URL
  if (!dbInstance || customUrl) {
    try {
      const sqlClient = postgres(urlToUse, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 5,
        onnotice: () => {},
      })
      const instance = drizzle(sqlClient, { schema })
      if (!customUrl) {
        client = sqlClient
        dbInstance = instance
      }
      return instance
    } catch (err) {
      console.warn('PostgreSQL client init failed, running in fallback mode:', err)
      return null
    }
  }
  return dbInstance
}

export { schema }
