import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { normalizePhone, getMonthKey } from '@/lib/utils'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
  revenueTarget: z.number().nonnegative().optional(),
  salesCountTarget: z.number().nonnegative().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz veri' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { id, tenantId: session.tenantId } })
  if (!user) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  const { password, revenueTarget, salesCountTarget, phone, ...userFields } = parsed.data

  // Build user update payload
  const updateData: Record<string, unknown> = { ...userFields }
  if (phone) {
    const normalized = normalizePhone(phone)
    const exists = await prisma.user.findFirst({
      where: { tenantId: session.tenantId, phone: normalized, id: { not: id } },
    })
    if (exists) return NextResponse.json({ hata: 'Bu telefon numarası başka bir temsilcide kayıtlı' }, { status: 409 })
    updateData.phone = normalized
  }
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12)
  }

  await prisma.user.update({ where: { id }, data: updateData })

  // Upsert monthly target if provided
  if (revenueTarget !== undefined || salesCountTarget !== undefined) {
    const monthKey = getMonthKey()
    await prisma.salesTarget.upsert({
      where: { tenantId_userId_monthKey: { tenantId: session.tenantId, userId: id, monthKey } },
      create: {
        tenantId: session.tenantId,
        userId: id,
        monthKey,
        revenueTarget: revenueTarget ?? 0,
        salesCountTarget: salesCountTarget ?? 0,
      },
      update: {
        ...(revenueTarget !== undefined && { revenueTarget }),
        ...(salesCountTarget !== undefined && { salesCountTarget }),
      },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params
  const user = await prisma.user.findFirst({ where: { id, tenantId: session.tenantId } })
  if (!user) return NextResponse.json({ hata: 'Bulunamadı' }, { status: 404 })

  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
