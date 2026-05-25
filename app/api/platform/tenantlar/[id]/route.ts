import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { z } from 'zod'

const patchSchema = z.object({
  companyName:       z.string().min(1).optional(),
  ownerName:         z.string().min(1).optional(),
  phone:             z.string().min(1).optional(),
  planStatus:        z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  trialEndsAt:       z.string().optional(),
  subscriptionEndsAt: z.string().nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'PLATFORM_ADMIN') return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const { trialEndsAt, subscriptionEndsAt, ...rest } = parsed.data
  const data: Record<string, unknown> = { ...rest }
  if (trialEndsAt !== undefined) data.trialEndsAt = new Date(trialEndsAt)
  if (subscriptionEndsAt !== undefined) data.subscriptionEndsAt = subscriptionEndsAt ? new Date(subscriptionEndsAt) : null

  try {
    await prisma.tenant.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === 'P2002') return NextResponse.json({ hata: 'Bu telefon numarası zaten kayıtlı' }, { status: 409 })
    return NextResponse.json({ hata: 'Güncelleme başarısız' }, { status: 500 })
  }
}
