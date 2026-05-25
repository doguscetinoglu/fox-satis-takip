import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import { normalizePhone } from '@/lib/utils'
import { getEffectivePlanStatus } from '@/lib/subscription'
import { z } from 'zod'

const schema = z.object({
  telefon: z.string().min(10),
  sifre: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz istek' }, { status: 400 })

    const phone = normalizePhone(parsed.data.telefon)
    const { sifre } = parsed.data

    // Platform admin check
    if (phone === normalizePhone(process.env.PLATFORM_ADMIN_PHONE ?? '')) {
      const hash = process.env.PLATFORM_ADMIN_HASH ?? ''
      if (hash && await bcrypt.compare(sifre, hash)) {
        await createSession({ id: 'platform', tenantId: 'platform', name: 'Platform Admin', role: 'PLATFORM_ADMIN', planStatus: 'ACTIVE' })
        return NextResponse.json({ rol: 'PLATFORM_ADMIN' })
      }
    }

    // Tenant admin (phone on Tenant table)
    const tenant = await prisma.tenant.findUnique({ where: { phone } })
    if (tenant) {
      const ok = await bcrypt.compare(sifre, tenant.passwordHash)
      if (!ok) return NextResponse.json({ hata: 'Telefon veya şifre hatalı' }, { status: 401 })
      const planStatus = getEffectivePlanStatus(tenant)
      // Find or create a User record so session.id is always a valid User FK
      let adminUser = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'TENANT_ADMIN' } })
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: { tenantId: tenant.id, phone: tenant.phone, passwordHash: tenant.passwordHash, name: tenant.ownerName, role: 'TENANT_ADMIN' },
        })
      }
      await createSession({ id: adminUser.id, tenantId: tenant.id, name: tenant.ownerName, role: 'TENANT_ADMIN', planStatus })
      return NextResponse.json({ rol: 'TENANT_ADMIN' })
    }

    // Sales rep (phone on User table)
    const user = await prisma.user.findFirst({ where: { phone, isActive: true }, include: { tenant: true } })
    if (user) {
      const ok = await bcrypt.compare(sifre, user.passwordHash)
      if (!ok) return NextResponse.json({ hata: 'Telefon veya şifre hatalı' }, { status: 401 })
      const planStatus = getEffectivePlanStatus(user.tenant)
      await createSession({ id: user.id, tenantId: user.tenantId, name: user.name, role: 'SALES_REP', planStatus })
      return NextResponse.json({ rol: 'SALES_REP' })
    }

    return NextResponse.json({ hata: 'Telefon veya şifre hatalı' }, { status: 401 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ hata: 'Sunucu hatası' }, { status: 500 })
  }
}
