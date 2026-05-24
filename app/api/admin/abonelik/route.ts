import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getTrialDaysRemaining, getEffectivePlanStatus } from '@/lib/subscription'
import { z } from 'zod'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })
  if (!tenant) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  const payments = await prisma.subscriptionPayment.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    planStatus: getEffectivePlanStatus(tenant),
    trialDaysRemaining: getTrialDaysRemaining(tenant.trialEndsAt),
    trialEndsAt: tenant.trialEndsAt,
    subscriptionEndsAt: tenant.subscriptionEndsAt,
    iban: process.env.PLATFORM_IBAN ?? '',
    ibanName: process.env.PLATFORM_IBAN_NAME ?? '',
    payments,
  })
}

const submitSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  ibanRef: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const payment = await prisma.subscriptionPayment.create({
    data: {
      tenantId: session.tenantId,
      amount: 100,
      period: parsed.data.period,
      ibanRef: parsed.data.ibanRef,
      status: 'PENDING',
    },
  })

  return NextResponse.json(payment)
}
