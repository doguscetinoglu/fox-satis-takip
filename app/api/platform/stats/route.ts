import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { getEffectivePlanStatus } from '@/lib/subscription'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'PLATFORM_ADMIN') return unauthorized()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [tenants, allPayments] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        _count: { select: { users: true, customers: true, salesEntries: true } },
        subscriptionPayments: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subscriptionPayment.findMany({
      where: { status: 'CONFIRMED', confirmedAt: { gte: startOfMonth } },
    }),
  ])

  const withStatus = tenants.map(t => ({ ...t, effectiveStatus: getEffectivePlanStatus(t) }))

  const totalTenants = tenants.length
  const activeTenants = withStatus.filter(t => t.effectiveStatus === 'ACTIVE').length
  const trialTenants = withStatus.filter(t => t.effectiveStatus === 'TRIAL').length
  const suspendedTenants = withStatus.filter(t => t.effectiveStatus === 'SUSPENDED').length

  const pendingPayments = tenants.flatMap(t =>
    t.subscriptionPayments.filter(p => p.status === 'PENDING')
  ).length

  const monthlyRevenue = allPayments.reduce((s, p) => s + p.amount, 0)

  // Attention items: expiring trials (within 3 days), suspended, new signups (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  const attentionItems = withStatus
    .filter(t =>
      t.effectiveStatus === 'SUSPENDED' ||
      (t.effectiveStatus === 'TRIAL' && new Date(t.trialEndsAt) <= threeDaysFromNow) ||
      new Date(t.createdAt) >= sevenDaysAgo
    )
    .map(t => ({
      id: t.id,
      companyName: t.companyName,
      ownerName: t.ownerName,
      phone: t.phone,
      type: t.effectiveStatus === 'SUSPENDED' ? 'suspended'
        : new Date(t.createdAt) >= sevenDaysAgo ? 'new'
        : 'expiring',
      trialEndsAt: t.trialEndsAt,
      createdAt: t.createdAt,
    }))

  return NextResponse.json({
    totalTenants, activeTenants, trialTenants, suspendedTenants,
    pendingPayments, monthlyRevenue,
    tenants: withStatus,
    attentionItems,
  })
}
