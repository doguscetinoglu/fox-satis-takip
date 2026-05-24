import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'fallback-dev-secret-32-chars!!')
const COOKIE = 'fox_session'

export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'SALES_REP'
export type PlanStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export type SessionPayload = {
  id: string
  tenantId: string
  name: string
  role: UserRole
  planStatus: PlanStatus
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)

  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = req.cookies.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
