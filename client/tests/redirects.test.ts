import { describe, it, expect } from 'vitest'
import redirects from '../public/_redirects?raw'
import appSource from '../src/App.tsx?raw'

const rules = redirects
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.trim().split(/\s+/))

const appRoutes = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => path !== '/')

describe('BUG-07: Cloudflare Pages _redirects', () => {
  it('finds the routes in App.tsx', () => {
    expect(appRoutes).toContain('/shop')
    expect(appRoutes).toContain('/admin')
  })

  it.each(appRoutes)('serves %s with HTTP 200', (path) => {
    expect(rules).toContainEqual([path, '/', '200'])
  })

  it('has no rule that Pages rejects as a loop', () => {
    for (const [source, target] of rules) {
      expect(source).not.toContain('*')
      expect(target).toBe('/')
    }
  })
})
