import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PLATFORM_ADMIN') return unauthorized()

  const tickets = await prisma.supportTicket.findMany({
    include: { tenant: { select: { companyName: true, ownerName: true, phone: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(tickets)
}
