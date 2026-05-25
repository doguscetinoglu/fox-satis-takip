import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getDebtAgeDays, getDebtAgeBucket } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const showPaid = url.searchParams.get('showPaid') === 'true'

  const debts = await prisma.debt.findMany({
    where: {
      tenantId: session.tenantId,
      ...(showPaid ? {} : { status: { not: 'PAID' } }),
    },
    include: {
      customer: {
        select: {
          id: true, name: true, code: true, phone: true,
          assignedRepId: true,
          assignedRep: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  const withAge = debts.map(d => ({
    ...d,
    ageDays: getDebtAgeDays(d.dueDate),
    ageBucket: getDebtAgeBucket(getDebtAgeDays(d.dueDate)),
  }))

  return NextResponse.json(withAge)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const { customerId, documentNo, amount, dueDate, documentDate, description } = body

  const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId: session.tenantId } })
  if (!customer) return NextResponse.json({ hata: 'Müşteri bulunamadı' }, { status: 404 })

  const debt = await prisma.debt.create({
    data: {
      tenantId: session.tenantId,
      customerId,
      documentNo,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      documentDate: new Date(documentDate),
      description,
      status: 'PENDING',
    },
  })

  return NextResponse.json(debt)
}
