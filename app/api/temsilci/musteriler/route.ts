import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'SALES_REP') return unauthorized()

  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId, assignedRepId: session.id },
    include: {
      debts: { where: { status: { not: 'PAID' } }, select: { amount: true, dueDate: true, status: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(customers)
}
