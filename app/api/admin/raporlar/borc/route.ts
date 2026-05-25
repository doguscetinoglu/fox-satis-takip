import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getDebtAgeDays, getDebtAgeBucket } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const debts = await prisma.debt.findMany({
    where: { tenantId: session.tenantId, status: { not: 'PAID' } },
    include: {
      customer: { select: { id: true, name: true, code: true, assignedRep: { select: { name: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const bucketMap: Record<string, { count: number; total: number }> = {
    '0-30': { count: 0, total: 0 },
    '30-60': { count: 0, total: 0 },
    '60-90': { count: 0, total: 0 },
    '90+': { count: 0, total: 0 },
  }

  // Group by customer
  const customerMap: Record<string, {
    id: string; name: string; code: string; repName: string | null
    buckets: Record<string, number>; total: number
  }> = {}

  for (const d of debts) {
    const age = getDebtAgeDays(d.dueDate)
    const bucket = getDebtAgeBucket(age)
    bucketMap[bucket].count++
    bucketMap[bucket].total += d.amount

    const cid = d.customer.id
    if (!customerMap[cid]) {
      customerMap[cid] = {
        id: cid,
        name: d.customer.name,
        code: d.customer.code,
        repName: d.customer.assignedRep?.name ?? null,
        buckets: { '0-30': 0, '30-60': 0, '60-90': 0, '90+': 0 },
        total: 0,
      }
    }
    customerMap[cid].buckets[bucket] += d.amount
    customerMap[cid].total += d.amount
  }

  const customers = Object.values(customerMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)

  const totalDebt = debts.reduce((s, d) => s + d.amount, 0)

  return NextResponse.json({ buckets: bucketMap, customers, totalDebt, debtCount: debts.length })
}
