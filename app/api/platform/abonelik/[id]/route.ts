import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

const schema = z.object({ action: z.enum(['confirm', 'reject']) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'PLATFORM_ADMIN') return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz istek' }, { status: 400 })

  const payment = await prisma.subscriptionPayment.findUnique({ where: { id } })
  if (!payment) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  if (parsed.data.action === 'confirm') {
    await prisma.subscriptionPayment.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    })
    await prisma.tenant.update({
      where: { id: payment.tenantId },
      data: {
        planStatus: 'ACTIVE',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  } else {
    await prisma.subscriptionPayment.update({ where: { id }, data: { status: 'REJECTED' } })
  }

  return NextResponse.json({ ok: true })
}
