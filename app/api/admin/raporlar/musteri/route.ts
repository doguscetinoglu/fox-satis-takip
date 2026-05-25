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

  const [customers, debts, entries] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, code: true, city: true, assignedRep: { select: { name: true } } },
    }),
    prisma.debt.findMany({
      where: { tenantId, status: { not: 'PAID' } },
      select: { customerId: true, amount: true },
    }),
    prisma.salesEntry.findMany({
      where: { tenantId, date: { gte: startOfMonth, lte: endOfMonth }, customerId: { not: null } },
      select: { customerId: true, amount: true, salesCount: true },
    }),
  ])

  // Revenue per customer this month
  const revenueMap: Record<string, number> = {}
  for (const e of entries) {
    if (e.customerId) revenueMap[e.customerId] = (revenueMap[e.customerId] ?? 0) + e.amount
  }

  // Debt per customer
  const debtMap: Record<string, number> = {}
  for (const d of debts) {
    debtMap[d.customerId] = (debtMap[d.customerId] ?? 0) + d.amount
  }

  const enriched = customers.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    city: c.city,
    repName: c.assignedRep?.name ?? null,
    monthRevenue: revenueMap[c.id] ?? 0,
    totalDebt: debtMap[c.id] ?? 0,
  }))

  const topByRevenue = [...enriched]
    .filter(c => c.monthRevenue > 0)
    .sort((a, b) => b.monthRevenue - a.monthRevenue)
    .slice(0, 10)

  const topByDebt = [...enriched]
    .filter(c => c.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)
    .slice(0, 10)

  // City distribution
  const cityMap: Record<string, number> = {}
  for (const c of customers) {
    const city = c.city || 'Belirtilmemiş'
    cityMap[city] = (cityMap[city] ?? 0) + 1
  }
  const cityDist = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))

  const assigned = customers.filter(c => c.assignedRep).length
  const unassigned = customers.length - assigned

  return NextResponse.json({
    topByRevenue,
    topByDebt,
    cityDist,
    totalCustomers: customers.length,
    assigned,
    unassigned,
    monthKey,
  })
}
