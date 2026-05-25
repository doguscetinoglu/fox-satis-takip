import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const payments = await prisma.payment.findMany({
    where: { tenantId: session.tenantId },
    include: {
      customer: { select: { name: true, code: true } },
      recordedBy: { select: { name: true } },
    },
    orderBy: { paymentDate: 'desc' },
    take: 100,
  })

  return NextResponse.json(payments)
}

const createSchema = z.object({
  customerId: z.string(),
  amount: z.number().positive(),
  paymentDate: z.string(),
  method: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, tenantId: session.tenantId } })
  if (!customer) return NextResponse.json({ hata: 'Müşteri bulunamadı' }, { status: 404 })

  // session.id may be tenant.id (legacy sessions) — always resolve via User table
  let recordedById = session.id
  if (session.id === session.tenantId) {
    const adminUser = await prisma.user.findFirst({ where: { tenantId: session.tenantId, role: 'TENANT_ADMIN' } })
    if (!adminUser) return NextResponse.json({ hata: 'Yönetici kullanıcı bulunamadı' }, { status: 400 })
    recordedById = adminUser.id
  }

  const payment = await prisma.payment.create({
    data: {
      tenantId: session.tenantId,
      customerId: parsed.data.customerId,
      amount: parsed.data.amount,
      paymentDate: new Date(parsed.data.paymentDate),
      method: parsed.data.method,
      description: parsed.data.description,
      recordedById,
    },
  })

  return NextResponse.json(payment)
}
