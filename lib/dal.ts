import { redirect } from 'next/navigation'
import { getSession, SessionPayload } from './session'

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/giris')
  return session
}

export async function requireTenantAdmin(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== 'TENANT_ADMIN') redirect('/giris')
  return session
}

export async function requireSalesRep(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== 'SALES_REP') redirect('/giris')
  return session
}

export async function requirePlatformAdmin(): Promise<SessionPayload> {
  const session = await requireAuth()
  if (session.role !== 'PLATFORM_ADMIN') redirect('/giris')
  return session
}

export function unauthorized() {
  return new Response(JSON.stringify({ hata: 'Yetkisiz erişim' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function forbidden() {
  return new Response(JSON.stringify({ hata: 'Erişim engellendi' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
}
