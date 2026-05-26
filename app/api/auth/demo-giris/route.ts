import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'fallback-dev-secret-32-chars!!')
const COOKIE = 'fox_session'
const DEMO_PHONE = '05551234567'

export async function GET(req: Request) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { phone: DEMO_PHONE } })
    if (!tenant) return NextResponse.redirect(new URL('/giris', req.url))

    // Trial'ı her ziyarette 7 gün uzat — demo asla SUSPENDED olmasın
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        planStatus: 'TRIAL',
      },
    })

    let adminUser = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: 'TENANT_ADMIN' },
    })
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          phone: tenant.phone,
          passwordHash: tenant.passwordHash,
          name: tenant.ownerName,
          role: 'TENANT_ADMIN',
        },
      })
    }

    const token = await new SignJWT({
      id: adminUser.id,
      tenantId: tenant.id,
      name: tenant.ownerName,
      role: 'TENANT_ADMIN',
      planStatus: 'TRIAL',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(SECRET)

    // Cookie'yi doğrudan redirect response'a bağla
    const response = NextResponse.redirect(new URL('/admin', req.url))
    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('Demo giriş hatası:', err)
    return NextResponse.redirect(new URL('/giris', req.url))
  }
}
