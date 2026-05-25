import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const month = url.searchParams.get('month') // YYYY-MM
  const repId = url.searchParams.get('repId') || undefined

  let startDate: Date | undefined
  let endDate: Date | undefined

  if (month) {
    const [y, m] = month.split('-').map(Number)
    startDate = new Date(y, m - 1, 1)
    endDate = new Date(y, m, 0, 23, 59, 59)
  }

  const entries = await prisma.salesEntry.findMany({
    where: {
      tenantId: session.tenantId,
      ...(repId ? { userId: repId } : {}),
      ...(startDate && endDate ? { date: { gte: startDate, lte: endDate } } : {}),
    },
    include: {
      user: { select: { name: true } },
      customer: { select: { name: true, code: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(entries.map(e => ({
    id: e.id,
    date: e.date,
    amount: e.amount,
    salesCount: e.salesCount,
    description: e.description,
    repName: e.user.name,
    customerName: e.customer?.name,
    customerCode: e.customer?.code,
  })))
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const { userId, customerId, amount, salesCount, date, description, documentNo, dueDate } = body

  if (!userId) return NextResponse.json({ hata: 'Temsilci seçilmedi' }, { status: 400 })

  const rep = await prisma.user.findFirst({ where: { id: userId, tenantId: session.tenantId } })
  if (!rep) return NextResponse.json({ hata: 'Temsilci bulunamadı' }, { status: 404 })

  if (customerId) {
    const cust = await prisma.customer.findFirst({ where: { id: customerId, tenantId: session.tenantId } })
    if (!cust) return NextResponse.json({ hata: 'Müşteri bulunamadı' }, { status: 404 })
  }

  // Müşteri seçilmişse vade tarihi zorunlu
  if (customerId && !dueDate) {
    return NextResponse.json({ hata: 'Müşteri seçilince vade tarihi gereklidir' }, { status: 400 })
  }

  const saleDate = new Date(date)
  const resolvedDueDate = dueDate ? new Date(dueDate) : new Date(saleDate.getTime() + 30 * 86400000)

  const entry = await prisma.salesEntry.create({
    data: {
      tenantId: session.tenantId,
      userId,
      customerId: customerId || undefined,
      amount: Number(amount),
      salesCount: Number(salesCount) || 1,
      date: saleDate,
      description,
    },
  })

  if (customerId) {
    await prisma.debt.create({
      data: {
        tenantId: session.tenantId,
        customerId,
        amount: Number(amount),
        documentDate: saleDate,
        dueDate: resolvedDueDate,
        documentNo: documentNo || undefined,
        description,
        status: 'PENDING',
      },
    })
  }

  return NextResponse.json(entry)
}
