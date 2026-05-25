import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getMonthKey } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const monthParam = url.searchParams.get('month') // YYYY-MM, default current
  const tenantId = session.tenantId

  let year: number, month: number
  if (monthParam) {
    [year, month] = monthParam.split('-').map(Number)
  } else {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth() + 1
  }

  const monthKey = getMonthKey(new Date(year, month - 1, 1))
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [entries, reps] = await Promise.all([
    prisma.salesEntry.findMany({
      where: { tenantId, date: { gte: startDate, lte: endDate } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' },
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true },
    }),
  ])

  // Per-rep aggregation with targets
  const repStats = await Promise.all(reps.map(async rep => {
    const repEntries = entries.filter(e => e.userId === rep.id)
    const revenue = repEntries.reduce((s, e) => s + e.amount, 0)
    const count = repEntries.reduce((s, e) => s + e.salesCount, 0)
    const target = await prisma.salesTarget.findUnique({
      where: { tenantId_userId_monthKey: { tenantId, userId: rep.id, monthKey } },
    })
    return {
      repId: rep.id,
      repName: rep.name,
      revenue,
      count,
      target: target?.revenueTarget ?? 0,
      pct: target?.revenueTarget ? Math.min(100, (revenue / target.revenueTarget) * 100) : 0,
    }
  }))

  // Daily breakdown
  const dailyMap: Record<string, number> = {}
  for (const e of entries) {
    const d = new Date(e.date)
    const key = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
    dailyMap[key] = (dailyMap[key] ?? 0) + e.amount
  }
  const dailyRevenue = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }))

  const totalRevenue = entries.reduce((s, e) => s + e.amount, 0)
  const totalCount = entries.reduce((s, e) => s + e.salesCount, 0)
  const totalTarget = repStats.reduce((s, r) => s + r.target, 0)

  return NextResponse.json({
    month: `${year}-${String(month).padStart(2, '0')}`,
    totalRevenue,
    totalCount,
    totalTarget,
    pct: totalTarget > 0 ? Math.min(100, (totalRevenue / totalTarget) * 100) : 0,
    repStats: repStats.sort((a, b) => b.revenue - a.revenue),
    dailyRevenue,
  })
}
