import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const monthKey = url.searchParams.get('monthKey') || ''

  const targets = await prisma.salesTarget.findMany({
    where: { tenantId: session.tenantId, ...(monthKey ? { monthKey } : {}) },
    include: { user: { select: { name: true, phone: true } } },
  })

  return NextResponse.json(targets)
}

const schema = z.object({
  userId: z.string(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  revenueTarget: z.number().min(0),
  salesCountTarget: z.number().min(0).int(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { id: parsed.data.userId, tenantId: session.tenantId } })
  if (!user) return NextResponse.json({ hata: 'Temsilci bulunamadı' }, { status: 404 })

  const target = await prisma.salesTarget.upsert({
    where: { tenantId_userId_monthKey: { tenantId: session.tenantId, userId: parsed.data.userId, monthKey: parsed.data.monthKey } },
    update: { revenueTarget: parsed.data.revenueTarget, salesCountTarget: parsed.data.salesCountTarget },
    create: { tenantId: session.tenantId, ...parsed.data },
  })

  return NextResponse.json(target)
}
