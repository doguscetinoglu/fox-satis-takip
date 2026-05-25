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
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysElapsed = monthKey === getMonthKey()
    ? today.getDate()
    : daysInMonth

  const [totalRevAgg, overdueAgg, todayAgg, reps] = await Promise.all([
    prisma.salesEntry.aggregate({
      where: { tenantId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true, salesCount: true },
    }),
    prisma.debt.aggregate({
      where: { tenantId, status: 'OVERDUE' },
      _sum: { amount: true },
    }),
    prisma.salesEntry.aggregate({
      where: { tenantId, date: startOfToday },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true },
    }),
  ])

  const repStats = await Promise.all(reps.map(async rep => {
    const [agg, target] = await Promise.all([
      prisma.salesEntry.aggregate({
        where: { tenantId, userId: rep.id, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true, salesCount: true },
      }),
      prisma.salesTarget.findUnique({
        where: { tenantId_userId_monthKey: { tenantId, userId: rep.id, monthKey } },
      }),
    ])
    return {
      id: rep.id,
      name: rep.name,
      revenue: agg._sum.amount ?? 0,
      salesCount: agg._sum.salesCount ?? 0,
      revenueTarget: target?.revenueTarget ?? 0,
      salesCountTarget: target?.salesCountTarget ?? 0,
    }
  }))

  // Daily breakdown
  const entries = await prisma.salesEntry.findMany({
    where: { tenantId, date: { gte: startOfMonth, lte: endOfMonth } },
    select: { date: true, amount: true, salesCount: true },
    orderBy: { date: 'asc' },
  })

  const dailyMap: Record<string, { revenue: number; salesCount: number }> = {}
  for (const e of entries) {
    const d = new Date(e.date)
    const key = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!dailyMap[key]) dailyMap[key] = { revenue: 0, salesCount: 0 }
    dailyMap[key].revenue += e.amount
    dailyMap[key].salesCount += e.salesCount
  }
  const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

  return NextResponse.json({
    totalRevenue: totalRevAgg._sum.amount ?? 0,
    totalSales: totalRevAgg._sum.salesCount ?? 0,
    overdueDebt: overdueAgg._sum.amount ?? 0,
    todayRevenue: todayAgg._sum.amount ?? 0,
    daysInMonth,
    daysElapsed,
    reps: repStats,
    daily,
  })
}
