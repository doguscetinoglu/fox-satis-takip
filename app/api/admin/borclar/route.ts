import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getDebtAgeDays, getDebtAgeBucket } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const bucket = url.searchParams.get('bucket') || 'all'
  const repId = url.searchParams.get('repId') || undefined

  const debts = await prisma.debt.findMany({
    where: {
      tenantId: session.tenantId,
      status: { not: 'PAID' },
      ...(repId ? { customer: { assignedRepId: repId } } : {}),
    },
    include: {
      customer: {
        select: { name: true, code: true, phone: true, assignedRep: { select: { name: true } } },
      },
    },
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
