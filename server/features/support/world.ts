import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber'
import type { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { buildApp } from '../../src/app.js'

export class AmbossWorld extends World {
  app!: FastifyInstance
  ip = '127.0.0.1'
  payload: Record<string, unknown> = {}
  response!: LightMyRequestResponse
}

setWorldConstructor(AmbossWorld)

Before(async function (this: AmbossWorld) {
  this.app = await buildApp()
})

After(async function (this: AmbossWorld) {
  await this.app?.close()
})
