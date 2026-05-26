import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

const DEMO_PHONE = '05551234567'

export async function GET(req: Request) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { phone: DEMO_PHONE } })
    if (!tenant) return NextResponse.redirect(new URL('/giris', req.url))

    // Trial'ı her seferinde 7 gün uzat — demo hesabı asla SUSPENDED olmasın
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

    await createSession({
      id: adminUser.id,
      tenantId: tenant.id,
      name: tenant.ownerName,
      role: 'TENANT_ADMIN',
      planStatus: 'TRIAL',
    })

    return NextResponse.redirect(new URL('/admin', req.url))
  } catch (err) {
    console.error('Demo giriş hatası:', err)
    return NextResponse.redirect(new URL('/giris', req.url))
  }
}
