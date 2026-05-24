import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'SALES_REP') return unauthorized()

  const url = new URL(req.url)
  const monthKey = url.searchParams.get('monthKey')
  const now = new Date()
  const startOfMonth = monthKey
    ? new Date(monthKey + '-01')
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)

  const entries = await prisma.salesEntry.findMany({
    where: {
      tenantId: session.tenantId,
      userId: session.id,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { customer: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(entries)
}

const createSchema = z.object({
  date: z.string(),
  amount: z.number().positive(),
  salesCount: z.number().int().min(1).default(1),
  customerId: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'SALES_REP') return unauthorized()

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const date = new Date(parsed.data.date)

  const entry = await prisma.salesEntry.create({
    data: {
      tenantId: session.tenantId,
      userId: session.id,
      date,
      amount: parsed.data.amount,
      salesCount: parsed.data.salesCount,
      customerId: parsed.data.customerId,
      description: parsed.data.description,
    },
  })

  return NextResponse.json(entry)
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'SALES_REP') return unauthorized()

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ hata: 'ID gerekli' }, { status: 400 })

  const entry = await prisma.salesEntry.findFirst({ where: { id, userId: session.id, tenantId: session.tenantId } })
  if (!entry) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  await prisma.salesEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
