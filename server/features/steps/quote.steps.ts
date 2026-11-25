import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import type { AmbossWorld } from '../support/world.js'

Given('the Amboss quote service is running', function (this: AmbossWorld) {
  assert.ok(this.app, 'Fastify app should be built')
})

Given(
  'I have a {int} mm cube with volume {float} cm³ and surface area {float} cm²',
  function (this: AmbossWorld, side: number, volumeCm3: number, surfaceAreaCm2: number) {
    this.payload = {
      fileName: 'cube.stl',
      volumeCm3,
      surfaceAreaCm2,
      dimensions: { x: side, y: side, z: side },
    }
  }
)

Given(
  'I choose material {string} with {int}% infill and {float} mm layers',
  function (this: AmbossWorld, materialSlug: string, infillPct: number, layerHeightMm: number) {
    Object.assign(this.payload, { materialSlug, infillPct, layerHeightMm, quantity: 1 })
  }
)

When('I request a quote', async function (this: AmbossWorld) {
  this.response = await this.app.inject({
    method: 'POST',
    url: '/api/v1/quote/calculate',
    payload: this.payload,
  })
})

Then('the response status should be {int}', function (this: AmbossWorld, status: number) {
  assert.equal(this.response.statusCode, status, this.response.body)
})

Then('the total price should equal material + machine + handling cost', function (this: AmbossWorld) {
  const p = this.response.json().pricing
  assert.equal(p.totalPriceLkr, p.materialCostLkr + p.machineCostLkr + p.handlingCostLkr)
})

Then('the handling cost should be {int} LKR', function (this: AmbossWorld, lkr: number) {
  assert.equal(this.response.json().pricing.handlingCostLkr, lkr)
})

Then('the recommended machine should contain {string}', function (this: AmbossWorld, text: string) {
  assert.match(this.response.json().pricing.recommendedMachine, new RegExp(text))
})

Then('the error message should contain {string}', function (this: AmbossWorld, text: string) {
  assert.ok(this.response.json().error.includes(text), this.response.body)
})
