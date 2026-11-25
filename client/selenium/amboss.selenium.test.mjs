/**
 * SQA 3.6 — Selenium WebDriver UI automation (real backend, no request mocking).
 *
 * Prerequisites:
 *   1. Backend running on :4000   (npm run dev:server, or the QA command in docs/sqa/06-automation-cicd.md)
 *   2. Frontend running on :5173  (npm run dev:client)
 *   3. Google Chrome installed     (Selenium Manager downloads a matching chromedriver automatically)
 *
 * Run:  npm run test:selenium --workspace=client
 * Env:  BASE_URL (default http://localhost:5173), HEADLESS=0 to watch the browser
 * Screenshots are saved to docs/sqa/evidence/selenium/
 */
import { describe, it, before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const TIMEOUT = 15000
const here = path.dirname(fileURLToPath(import.meta.url))
const SHOT_DIR = path.resolve(here, '../../docs/sqa/evidence/selenium')
fs.mkdirSync(SHOT_DIR, { recursive: true })

/** @type {import('selenium-webdriver').WebDriver} */
let driver

before(async () => {
  const options = new chrome.Options().addArguments('--window-size=1366,900', '--no-sandbox', '--disable-dev-shm-usage')
  if (process.env.HEADLESS !== '0') options.addArguments('--headless=new')
  driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
})

after(async () => {
  await driver?.quit()
})

afterEach(async (t) => {
  const name = t.name.replace(/[^a-z0-9-]+/gi, '_').slice(0, 60)
  fs.writeFileSync(path.join(SHOT_DIR, `${name}.png`), await driver.takeScreenshot(), 'base64')
})

const byText = (tag, text) => By.xpath(`//${tag}[contains(normalize-space(.), "${text}")]`)
const waitVisible = async (locator) => driver.wait(until.elementIsVisible(await driver.wait(until.elementLocated(locator), TIMEOUT)), TIMEOUT)

describe('Amboss UI — Selenium', () => {
  it('SEL-01 shop lists products and adds one to the cart', async () => {
    await driver.get(`${BASE_URL}/shop`)
    await driver.wait(until.titleMatches(/Shop/i), TIMEOUT)
    await waitVisible(By.css('[data-testid="product-card"]'))

    const addButtons = await driver.findElements(byText('button', 'Add to Cart'))
    assert.ok(addButtons.length > 0, 'at least one Add to Cart button')
    await addButtons[0].click()

    await (await waitVisible(By.css('header button[aria-label^="Shopping cart"]'))).click()
    const drawer = await waitVisible(By.css('[role="dialog"][aria-label="Cart"], [role="dialog"]'))
    assert.ok(await drawer.isDisplayed())
    await waitVisible(byText('button', 'Order via WhatsApp'))
  })

  it('SEL-02 quote page prices an uploaded STL', async () => {
    const stl = [
      'solid cube',
      ...[[0, 0, 20, 20, 0, 20, 20, 20, 20], [0, 0, 20, 20, 20, 20, 0, 20, 20]].map(
        (v) => `facet normal 0 0 1\nouter loop\nvertex ${v.slice(0, 3).join(' ')}\nvertex ${v.slice(3, 6).join(' ')}\nvertex ${v.slice(6).join(' ')}\nendloop\nendfacet`
      ),
      'endsolid cube',
    ].join('\n')
    const file = path.join(os.tmpdir(), 'selenium_cube.stl')
    fs.writeFileSync(file, stl)

    await driver.get(`${BASE_URL}/quote`)
    await waitVisible(By.css('h1'))
    const input = await driver.wait(until.elementLocated(By.css('input[type="file"]')), TIMEOUT)
    await input.sendKeys(file)

    const spec = await waitVisible(byText('h2', 'Specification'))
    assert.ok(await spec.isDisplayed(), 'the quote specification panel is shown after upload')
    await waitVisible(byText('button', 'PLA+'))
    await waitVisible(byText('button', 'Order via WhatsApp'))
  })

  it('SEL-03 admin login rejects a wrong password (real API)', async () => {
    await driver.get(`${BASE_URL}/admin/login`)
    await (await waitVisible(By.id('admin-username'))).sendKeys('Dory')
    await driver.findElement(By.id('admin-password')).sendKeys('definitely-wrong')
    await driver.findElement(By.css('button[type="submit"]')).click()

    const alert = await waitVisible(By.css('[role="alert"]'))
    assert.match(await alert.getText(), /ACCESS DENIED|Invalid/i)
  })

  const noPassword = !process.env.ADMIN_PASSWORD && 'set ADMIN_PASSWORD to the admin password of the API under test'
  it('SEL-04 admin login accepts valid credentials and opens the dashboard', { skip: noPassword }, async () => {
    // Also resets this IP's failed-attempt counter after SEL-03
    await driver.get(`${BASE_URL}/admin/login`)
    const user = await waitVisible(By.id('admin-username'))
    await user.clear()
    await user.sendKeys(process.env.ADMIN_USER ?? 'Dory')
    await driver.findElement(By.id('admin-password')).sendKeys(process.env.ADMIN_PASSWORD)
    await driver.findElement(By.css('button[type="submit"]')).click()

    await waitVisible(byText('*', 'OPERATOR:'))
    assert.match(await driver.getCurrentUrl(), /\/admin/)
  })
})
