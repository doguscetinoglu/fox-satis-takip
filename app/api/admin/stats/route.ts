import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getMonthKey } from '@/lib/utils'
import { unauthorized } from '@/lib/dal'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const tenantId = session.tenantId
  const monthKey = getMonthKey()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [monthlyRevenue, activeCustomers, overdueDebt, repsCount, todayRevenue] = await Promise.all([
    prisma.salesEntry.aggregate({
      where: { tenantId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.debt.aggregate({
      where: { tenantId, status: 'OVERDUE' },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.salesEntry.aggregate({
      where: { tenantId, date: today },
      _sum: { amount: true },
    }),
  ])

  // Per-rep stats for chart
  const reps = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true },
  })

  const repStats = await Promise.all(reps.map(async rep => {
    const [revenue, target] = await Promise.all([
      prisma.salesEntry.aggregate({
        where: { tenantId, userId: rep.id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.salesTarget.findUnique({
        where: { tenantId_userId_monthKey: { tenantId, userId: rep.id, monthKey } },
      }),
    ])
    return {
      name: rep.name,
      revenue: revenue._sum.amount ?? 0,
      target: target?.revenueTarget ?? 0,
    }
  }))

  return NextResponse.json({
    monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    activeCustomers,
    overdueDebt: overdueDebt._sum.amount ?? 0,
    repsCount,
    todayRevenue: todayRevenue._sum.amount ?? 0,
    repStats,
  })
}
