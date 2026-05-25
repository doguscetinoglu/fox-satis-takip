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
      customer: {
        select: {
          id: true, name: true, code: true,
          assignedRepId: true,
          assignedRep: { select: { id: true, name: true } },
        },
      },
      recordedBy: { select: { name: true } },
    },
    orderBy: { paymentDate: 'desc' },
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

/**
 * Müşterinin toplam ödemelerini en eski borca doğru uygular.
 * Her ödeme POST sonrası çağrılır; borç durumlarını (PENDING/PARTIAL/PAID/OVERDUE) günceller.
 */
async function recalcDebts(tenantId: string, customerId: string) {
  const paySum = await prisma.payment.aggregate({
    where: { tenantId, customerId },
    _sum: { amount: true },
  })
  let pool = paySum._sum.amount ?? 0

  const debts = await prisma.debt.findMany({
    where: { tenantId, customerId },
    orderBy: { dueDate: 'asc' },
    select: { id: true, amount: true, dueDate: true, status: true },
  })

  const ops = debts.map(debt => {
    let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
    if (pool <= 0) {
      newStatus = new Date(debt.dueDate) < new Date() ? 'OVERDUE' : 'PENDING'
    } else if (pool >= debt.amount) {
      pool -= debt.amount
      newStatus = 'PAID'
    } else {
      pool = 0
      newStatus = 'PARTIAL'
    }
    return { id: debt.id, newStatus, changed: debt.status !== newStatus }
  })

  const changed = ops.filter(o => o.changed)
  if (changed.length) {
    await Promise.all(
      changed.map(o => prisma.debt.update({ where: { id: o.id }, data: { status: o.newStatus } }))
    )
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const customer = await prisma.customer.findFirst({ where: { id: parsed.data.customerId, tenantId: session.tenantId } })
  if (!customer) return NextResponse.json({ hata: 'Müşteri bulunamadı' }, { status: 404 })

  // session.id may equal session.tenantId in legacy sessions — resolve correct User ID
  let recordedById = session.id
  if (session.id === session.tenantId) {
    let adminUser = await prisma.user.findFirst({ where: { tenantId: session.tenantId, role: 'TENANT_ADMIN' } })
    if (!adminUser) {
      const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })
      if (!tenant) return NextResponse.json({ hata: 'Tenant bulunamadı' }, { status: 400 })
      adminUser = await prisma.user.create({
        data: { tenantId: tenant.id, phone: tenant.phone, passwordHash: tenant.passwordHash, name: tenant.ownerName, role: 'TENANT_ADMIN' },
      })
    }
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

  // Ödeme girilince müşterinin borçlarını eskiden yeniye kapatır
  await recalcDebts(session.tenantId, parsed.data.customerId)

  return NextResponse.json(payment)
}
