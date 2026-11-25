import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import type { AmbossWorld } from '../support/world.js'

Given('I am connecting from IP {string}', function (this: AmbossWorld, ip: string) {
  // Unique IP per scenario run so the in-memory lockout map does not leak between scenarios
  this.ip = ip.replace(/\.\d+$/, `.${Math.floor(Math.random() * 200) + 20}`)
})

async function login(world: AmbossWorld, username: string, password: string) {
  world.response = await world.app.inject({
    method: 'POST',
    url: '/api/v1/admin/login',
    remoteAddress: world.ip,
    payload: { username, password },
  })
}

When('I log in as {string} with the correct password', async function (this: AmbossWorld, u: string) {
  await login(this, u, process.env.ADMIN_TEST_PASSWORD ?? '')
})

When('I fail to log in {int} times', async function (this: AmbossWorld, n: number) {
  for (let i = 0; i < n; i++) await login(this, 'intruder', `guess-${i}`)
})

Then('a HttpOnly session cookie should be set', function (this: AmbossWorld) {
  assert.match(String(this.response.headers['set-cookie']), /HttpOnly/i)
})

Then('the response should include a Retry-After header', function (this: AmbossWorld) {
  assert.ok(this.response.headers['retry-after'])
})
