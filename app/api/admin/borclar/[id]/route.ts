import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params
  const debt = await prisma.debt.findFirst({ where: { id, tenantId: session.tenantId } })
  if (!debt) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz durum' }, { status: 400 })

  await prisma.debt.update({ where: { id }, data: { status: parsed.data.status } })
  return NextResponse.json({ ok: true })
}
