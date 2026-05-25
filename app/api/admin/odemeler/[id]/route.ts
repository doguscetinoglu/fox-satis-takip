import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

// Müşterinin toplam ödemelerini borçlarına uygular
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params

  const payment = await prisma.payment.findFirst({
    where: { id, tenantId: session.tenantId },
    select: { id: true, customerId: true },
  })
  if (!payment) return NextResponse.json({ hata: 'Kayıt bulunamadı' }, { status: 404 })

  await prisma.payment.delete({ where: { id } })

  // Ödeme silindikten sonra borçları yeniden hesapla
  await recalcDebts(session.tenantId, payment.customerId)

  return NextResponse.json({ ok: true })
}
