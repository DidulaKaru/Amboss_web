import { buildApp } from './app.js'
import { env } from './config/env.js'
import { getDb } from './db/index.js'

async function start() {
  const app = await buildApp()

  // Attempt database check
  const db = getDb()
  if (db) {
    app.log.info('PostgreSQL connection initialized')
  } else {
    app.log.warn('PostgreSQL not configured or offline, operating in fallback mock mode')
  }

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    })
    console.log(`AMBOSS Fastify API listening at ${address}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
