import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'fallback-dev-secret-32-chars!!')
const COOKIE = 'fox_session'
const DEMO_PHONE = '05551234567'

async function ensureDemoData() {
  // Tenant yoksa oluştur
  let tenant = await prisma.tenant.findUnique({ where: { phone: DEMO_PHONE } })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        companyName: 'Demo Şirketi A.Ş.',
        ownerName: 'Ahmet Yılmaz',
        phone: DEMO_PHONE,
        passwordHash: await bcrypt.hash('demo1234', 12),
        planStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Temsilciler
    const rep1 = await prisma.user.create({
      data: { tenantId: tenant.id, phone: '05551111111', passwordHash: await bcrypt.hash('rep1234', 12), name: 'Mehmet Kaya', role: 'SALES_REP' },
    })
    const rep2 = await prisma.user.create({
      data: { tenantId: tenant.id, phone: '05552222222', passwordHash: await bcrypt.hash('rep1234', 12), name: 'Fatma Demir', role: 'SALES_REP' },
    })

    // Müşteriler
    const customerData = [
      { code: 'MUS001', name: 'Ege Tekstil Ltd.', phone: '02321234567', city: 'İzmir', repId: rep1.id },
      { code: 'MUS002', name: 'Anadolu Market', phone: '03121234567', city: 'Ankara', repId: rep1.id },
      { code: 'MUS003', name: 'İstanbul Gıda A.Ş.', phone: '02121234567', city: 'İstanbul', repId: rep2.id },
      { code: 'MUS004', name: 'Marmara Yapı', phone: '02161234567', city: 'İstanbul', repId: rep2.id },
      { code: 'MUS005', name: 'Akdeniz Tarım', phone: '02421234567', city: 'Antalya', repId: rep1.id },
    ]
    const customers = []
    for (const c of customerData) {
      const cust = await prisma.customer.create({
        data: { tenantId: tenant.id, code: c.code, name: c.name, phone: c.phone, city: c.city, assignedRepId: c.repId },
      })
      customers.push(cust)
    }

    // Borçlar
    const now = new Date()
    const debtData = [
      { customerId: customers[0].id, amount: 15000, daysAgo: 45, status: 'OVERDUE' as const },
      { customerId: customers[0].id, amount: 8500,  daysAgo: 10, status: 'PENDING' as const },
      { customerId: customers[1].id, amount: 22000, daysAgo: 95, status: 'OVERDUE' as const },
      { customerId: customers[2].id, amount: 5000,  daysAgo: 5,  status: 'PENDING' as const },
      { customerId: customers[3].id, amount: 12000, daysAgo: 65, status: 'OVERDUE' as const },
      { customerId: customers[4].id, amount: 3500,  daysAgo: 0,  status: 'PENDING' as const },
    ]
    for (const d of debtData) {
      const dueDate = new Date(now.getTime() - d.daysAgo * 86400000)
      await prisma.debt.create({
        data: {
          tenantId: tenant.id, customerId: d.customerId, amount: d.amount,
          dueDate, documentDate: new Date(dueDate.getTime() - 30 * 86400000),
          status: d.status, documentNo: `FAT-${Math.floor(Math.random() * 9000) + 1000}`,
        },
      })
    }

    // Son 14 günün satışları
    for (let i = 0; i < 14; i++) {
      const date = new Date(now.getTime() - i * 86400000)
      date.setHours(0, 0, 0, 0)
      for (const rep of [rep1, rep2]) {
        if (Math.random() > 0.3) {
          await prisma.salesEntry.create({
            data: { tenantId: tenant.id, userId: rep.id, date, amount: Math.floor(Math.random() * 8000) + 2000, salesCount: Math.floor(Math.random() * 5) + 1 },
          })
        }
      }
    }

    // Hedefler
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await prisma.salesTarget.create({ data: { tenantId: tenant.id, userId: rep1.id, monthKey, revenueTarget: 150000, salesCountTarget: 50 } })
    await prisma.salesTarget.create({ data: { tenantId: tenant.id, userId: rep2.id, monthKey, revenueTarget: 120000, salesCountTarget: 40 } })
  }

  return tenant
}

export async function GET(req: Request) {
  try {
    let tenant = await ensureDemoData()

    // Trial'ı her ziyarette sıfırla
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), planStatus: 'TRIAL' },
    })

    let adminUser = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: 'TENANT_ADMIN' } })
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: { tenantId: tenant.id, phone: tenant.phone, passwordHash: tenant.passwordHash, name: tenant.ownerName, role: 'TENANT_ADMIN' },
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
