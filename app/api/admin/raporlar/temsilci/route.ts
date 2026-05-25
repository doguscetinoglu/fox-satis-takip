import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getMonthKey } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const tenantId = session.tenantId
  const url = new URL(req.url)
  const monthKey = url.searchParams.get('monthKey') || getMonthKey()
  const [year, month] = monthKey.split('-').map(Number)
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const reps = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true, phone: true },
  })

  const stats = await Promise.all(reps.map(async rep => {
    const [agg, target, customerCount] = await Promise.all([
      prisma.salesEntry.aggregate({
        where: { tenantId, userId: rep.id, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true, salesCount: true },
      }),
      prisma.salesTarget.findUnique({
        where: { tenantId_userId_monthKey: { tenantId, userId: rep.id, monthKey } },
      }),
      prisma.customer.count({ where: { tenantId, assignedRepId: rep.id } }),
    ])

    const revenue = agg._sum.amount ?? 0
    const salesCount = agg._sum.salesCount ?? 0
    const revenueTarget = target?.revenueTarget ?? 0
    const salesCountTarget = target?.salesCountTarget ?? 0
    const revPct = revenueTarget > 0 ? Math.min(100, (revenue / revenueTarget) * 100) : 0

    return {
      id: rep.id,
      name: rep.name,
      phone: rep.phone,
      revenue,
      salesCount,
      revenueTarget,
      salesCountTarget,
      revPct,
      customerCount,
    }
  }))

  const sorted = [...stats].sort((a, b) => b.revenue - a.revenue)

  // Monthly trend per rep (last 6 months)
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const trend = await Promise.all(months.map(async mk => {
    const [y, m] = mk.split('-').map(Number)
    const s = new Date(y, m - 1, 1)
    const e = new Date(y, m, 0, 23, 59, 59)
    const label = new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'short' })
    const repAmounts: Record<string, number> = {}
    for (const rep of reps) {
      const a = await prisma.salesEntry.aggregate({
        where: { tenantId, userId: rep.id, date: { gte: s, lte: e } },
        _sum: { amount: true },
      })
      repAmounts[rep.name] = a._sum.amount ?? 0
    }
    return { month: label, ...repAmounts }
  }))

  return NextResponse.json({ reps: sorted, trend, monthKey })
}
