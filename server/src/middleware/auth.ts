import type { FastifyRequest, FastifyReply } from 'fastify'

export interface AdminJwtPayload {
  username: string
  role: 'admin'
  iat?: number
  exp?: number
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AdminJwtPayload
    user: AdminJwtPayload
  }
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    // 1. Check HttpOnly cookie
    let token = request.cookies?.amboss_admin_token

    // 2. Fallback to Authorization: Bearer <token>
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ')
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1]
      }
    }

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized: Admin credentials required',
      })
    }

    // Verify token using fastify jwt plugin
    const decoded = await (request.server as any).jwt.verify(token)
    if (!decoded || decoded.role !== 'admin') {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized: Invalid admin token',
      })
    }

    request.user = decoded as AdminJwtPayload
  } catch (err: unknown) {
    request.log.warn({ err }, 'Admin verification failed')
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized: Session expired or invalid token',
    })
  }
}
