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
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

  // Tek seferde tüm verileri çek — N+1 yok
  const [reps, monthRevs, todayRevs, targets, custCounts] = await Promise.all([
    prisma.user.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } }),
    prisma.salesEntry.groupBy({
      by: ['userId'],
      where: { tenantId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.salesEntry.groupBy({
      by: ['userId'],
      where: { tenantId, date: today },
      _sum: { amount: true },
    }),
    prisma.salesTarget.findMany({ where: { tenantId, monthKey } }),
    prisma.customer.groupBy({
      by: ['assignedRepId'],
      where: { tenantId, assignedRepId: { not: null } },
      _count: { id: true },
    }),
  ])

  // Lookup maps
  const monthMap  = Object.fromEntries(monthRevs.map(r => [r.userId, r._sum.amount ?? 0]))
  const todayMap  = Object.fromEntries(todayRevs.map(r => [r.userId, r._sum.amount ?? 0]))
  const targetMap = Object.fromEntries(targets.map(t => [t.userId, t]))
  const custMap   = Object.fromEntries(custCounts.map(c => [c.assignedRepId!, c._count.id]))

  const data = reps.map(rep => ({
    id: rep.id,
    name: rep.name,
    phone: rep.phone,
    isActive: rep.isActive,
    todayRevenue:      todayMap[rep.id]  ?? 0,
    monthRevenue:      monthMap[rep.id]  ?? 0,
    target:            targetMap[rep.id]?.revenueTarget    ?? 0,
    salesCountTarget:  targetMap[rep.id]?.salesCountTarget ?? 0,
    assignedCustomers: custMap[rep.id]   ?? 0,
  }))

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' },
  })
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
