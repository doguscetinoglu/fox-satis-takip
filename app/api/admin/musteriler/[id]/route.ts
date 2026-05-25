import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  taxNumber: z.string().nullable().optional(),
  taxOffice: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  assignedRepId: z.string().nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params
  const customer = await prisma.customer.findFirst({ where: { id, tenantId: session.tenantId } })
  if (!customer) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  await prisma.customer.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params
  const customer = await prisma.customer.findFirst({ where: { id, tenantId: session.tenantId } })
  if (!customer) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  await prisma.customer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
