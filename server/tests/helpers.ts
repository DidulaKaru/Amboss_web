import type { FastifyInstance } from 'fastify'

/** Logs in as the default admin and returns a Cookie header value for authenticated requests. */
export async function adminCookie(app: FastifyInstance): Promise<{ cookie: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/admin/login',
    payload: { username: 'Dory', password: 'poplintu7577' },
  })
  if (res.statusCode !== 200) throw new Error(`Admin login failed: ${res.statusCode}`)
  const setCookie = res.headers['set-cookie']
  const raw = Array.isArray(setCookie) ? setCookie[0] : (setCookie as string)
  return { cookie: raw.split(';')[0] }
}
