import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getMonthKey } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'SALES_REP') return unauthorized()

  const now = new Date()
  const monthKey = getMonthKey()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysElapsed = now.getDate()
  const daysRemaining = daysInMonth - daysElapsed

  const [todayRevenue, monthRevenue, target, overdueCount, assignedCount] = await Promise.all([
    prisma.salesEntry.aggregate({ where: { tenantId: session.tenantId, userId: session.id, date: today }, _sum: { amount: true } }),
    prisma.salesEntry.aggregate({ where: { tenantId: session.tenantId, userId: session.id, date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.salesTarget.findUnique({ where: { tenantId_userId_monthKey: { tenantId: session.tenantId, userId: session.id, monthKey } } }),
    prisma.debt.count({
      where: { tenantId: session.tenantId, status: 'OVERDUE', customer: { assignedRepId: session.id } },
    }),
    prisma.customer.count({ where: { tenantId: session.tenantId, assignedRepId: session.id } }),
  ])

  const revenueTotal = monthRevenue._sum.amount ?? 0
  const revenueTarget = target?.revenueTarget ?? 0
  const pace = daysElapsed > 0 ? revenueTotal / daysElapsed : 0
  const requiredPace = daysRemaining > 0 ? (revenueTarget - revenueTotal) / daysRemaining : 0

  return NextResponse.json({
    todayRevenue: todayRevenue._sum.amount ?? 0,
    monthRevenue: revenueTotal,
    revenueTarget,
    salesCountTarget: target?.salesCountTarget ?? 0,
    daysInMonth,
    daysElapsed,
    daysRemaining,
    pace,
    requiredPace,
    overdueCount,
    assignedCount,
  })
}
