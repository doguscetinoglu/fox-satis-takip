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

  const [
    monthlyRevenueAgg, activeCustomers, overdueDebtAgg, totalDebtAgg,
    repsCount, todayRevenueAgg, overdueCount, pendingDebtCount,
    unassignedCustomers, recentPayments, salesEntries,
  ] = await Promise.all([
    prisma.salesEntry.aggregate({ where: { tenantId, date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.debt.aggregate({ where: { tenantId, status: 'OVERDUE' }, _sum: { amount: true } }),
    prisma.debt.aggregate({ where: { tenantId, status: { not: 'PAID' } }, _sum: { amount: true } }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.salesEntry.aggregate({ where: { tenantId, date: today }, _sum: { amount: true } }),
    prisma.debt.count({ where: { tenantId, status: 'OVERDUE' } }),
    prisma.debt.count({ where: { tenantId, status: { not: 'PAID' } } }),
    prisma.customer.count({ where: { tenantId, assignedRepId: null } }),
    prisma.payment.findMany({
      where: { tenantId },
      include: { customer: { select: { name: true } }, recordedBy: { select: { name: true } } },
      orderBy: { paymentDate: 'desc' },
      take: 6,
    }),
    prisma.salesEntry.findMany({
      where: { tenantId, date: { gte: startOfMonth } },
      select: { date: true, amount: true },
      orderBy: { date: 'asc' },
    }),
  ])

  // Daily revenue for this month
  const dailyMap: Record<string, number> = {}
  for (const e of salesEntries) {
    const d = new Date(e.date)
    const key = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
    dailyMap[key] = (dailyMap[key] ?? 0) + e.amount
  }
  const dailyRevenue = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }))

  // Per-rep stats with targets
  const reps = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true },
  })

  const repDetails = await Promise.all(reps.map(async rep => {
    const [revenue, target, customerCount] = await Promise.all([
      prisma.salesEntry.aggregate({
        where: { tenantId, userId: rep.id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.salesTarget.findUnique({
        where: { tenantId_userId_monthKey: { tenantId, userId: rep.id, monthKey } },
      }),
      prisma.customer.count({ where: { tenantId, assignedRepId: rep.id } }),
    ])
    const rev = revenue._sum.amount ?? 0
    const tgt = target?.revenueTarget ?? 0
    return {
      id: rep.id,
      name: rep.name,
      revenue: rev,
      target: tgt,
      pct: tgt > 0 ? Math.min(100, (rev / tgt) * 100) : 0,
      customerCount,
    }
  }))

  const monthlyTarget = repDetails.reduce((s, r) => s + r.target, 0)

  // Alerts
  const alerts: { type: string; message: string; count?: number; amount?: number }[] = []
  if (overdueCount > 0) alerts.push({ type: 'overdue', message: 'gecikmiş borç', count: overdueCount, amount: overdueDebtAgg._sum.amount ?? 0 })
  if (unassignedCustomers > 0) alerts.push({ type: 'unassigned', message: 'atanmamış müşteri', count: unassignedCustomers })
  const behindReps = repDetails.filter(r => r.target > 0 && r.pct < 50)
  if (behindReps.length > 0) alerts.push({ type: 'behind', message: 'temsilci hedefe gerisinde', count: behindReps.length })

  return NextResponse.json({
    monthlyRevenue: monthlyRevenueAgg._sum.amount ?? 0,
    todayRevenue: todayRevenueAgg._sum.amount ?? 0,
    activeCustomers,
    overdueDebt: overdueDebtAgg._sum.amount ?? 0,
    totalDebt: totalDebtAgg._sum.amount ?? 0,
    repsCount,
    overdueCount,
    pendingDebtCount,
    unassignedCustomers,
    monthlyTarget,
    repDetails: repDetails.sort((a, b) => b.revenue - a.revenue),
    repStats: repDetails.map(r => ({ name: r.name, revenue: r.revenue, target: r.target })),
    recentPayments: recentPayments.map(p => ({
      id: p.id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      method: p.method,
      customerName: p.customer.name,
      recordedBy: p.recordedBy.name,
    })),
    dailyRevenue,
    alerts,
  })
}
