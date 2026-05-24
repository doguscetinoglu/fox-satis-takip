import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getDebtAgeDays, getDebtAgeBucket } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'SALES_REP') return unauthorized()

  const url = new URL(req.url)
  const bucket = url.searchParams.get('bucket') || 'all'

  const debts = await prisma.debt.findMany({
    where: {
      tenantId: session.tenantId,
      status: { not: 'PAID' },
      customer: { assignedRepId: session.id },
    },
    include: { customer: { select: { name: true, code: true, phone: true } } },
    orderBy: { dueDate: 'asc' },
  })

  const withAge = debts.map(d => ({
    ...d,
    ageDays: getDebtAgeDays(d.dueDate),
    ageBucket: getDebtAgeBucket(getDebtAgeDays(d.dueDate)),
  }))

  const filtered = bucket === 'all' ? withAge : withAge.filter(d => d.ageBucket === bucket)

  return NextResponse.json(filtered)
}
