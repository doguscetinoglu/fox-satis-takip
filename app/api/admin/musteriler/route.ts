import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const repId = url.searchParams.get('repId') || undefined
  const city = url.searchParams.get('city') || undefined

  const customers = await prisma.customer.findMany({
    where: {
      tenantId: session.tenantId,
      ...(repId ? { assignedRepId: repId } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    include: {
      assignedRep: { select: { name: true } },
      debts: { where: { status: { not: 'PAID' } }, select: { amount: true, status: true, dueDate: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(customers)
}

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  assignedRepId: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const exists = await prisma.customer.findUnique({
    where: { tenantId_code: { tenantId: session.tenantId, code: parsed.data.code } },
  })
  if (exists) return NextResponse.json({ hata: 'Bu müşteri kodu zaten mevcut' }, { status: 409 })

  const customer = await prisma.customer.create({
    data: { tenantId: session.tenantId, ...parsed.data },
  })
  return NextResponse.json(customer)
}
