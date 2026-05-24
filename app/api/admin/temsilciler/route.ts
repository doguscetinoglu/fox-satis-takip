import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { normalizePhone, getMonthKey } from '@/lib/utils'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const tenantId = session.tenantId
  const monthKey = getMonthKey()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const reps = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  })

  const data = await Promise.all(reps.map(async rep => {
    const [todayRevenue, monthRevenue, target, assignedCount] = await Promise.all([
      prisma.salesEntry.aggregate({ where: { tenantId, userId: rep.id, date: today }, _sum: { amount: true } }),
      prisma.salesEntry.aggregate({ where: { tenantId, userId: rep.id, date: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.salesTarget.findUnique({ where: { tenantId_userId_monthKey: { tenantId, userId: rep.id, monthKey } } }),
      prisma.customer.count({ where: { tenantId, assignedRepId: rep.id } }),
    ])
    return {
      id: rep.id,
      name: rep.name,
      phone: rep.phone,
      isActive: rep.isActive,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      monthRevenue: monthRevenue._sum.amount ?? 0,
      target: target?.revenueTarget ?? 0,
      salesCountTarget: target?.salesCountTarget ?? 0,
      assignedCustomers: assignedCount,
    }
  }))

  return NextResponse.json(data)
}

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const phone = normalizePhone(parsed.data.phone)
  const exists = await prisma.user.findUnique({ where: { tenantId_phone: { tenantId: session.tenantId, phone } } })
  if (exists) return NextResponse.json({ hata: 'Bu telefon numarası zaten kayıtlı' }, { status: 409 })

  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId,
      phone,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      name: parsed.data.name,
      role: 'SALES_REP',
    },
  })

  return NextResponse.json({ id: user.id })
}
