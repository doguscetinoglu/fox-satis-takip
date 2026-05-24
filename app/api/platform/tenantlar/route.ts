import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getEffectivePlanStatus } from '@/lib/subscription'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PLATFORM_ADMIN') return unauthorized()

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: { select: { users: true, customers: true } },
      subscriptionPayments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tenants.map(t => ({
    ...t,
    effectiveStatus: getEffectivePlanStatus(t),
  })))
}
