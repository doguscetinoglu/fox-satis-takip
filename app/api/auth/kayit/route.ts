import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import { normalizePhone } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  ownerName: z.string().min(2),
  companyName: z.string().min(2),
  phone: z.string().min(10),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ hata: 'Geçersiz form verisi' }, { status: 400 })

    const phone = normalizePhone(parsed.data.phone)
    const { ownerName, companyName, password } = parsed.data

    const exists = await prisma.tenant.findUnique({ where: { phone } })
    if (exists) return NextResponse.json({ hata: 'Bu telefon numarası zaten kayıtlı' }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const tenant = await prisma.tenant.create({
      data: { companyName, ownerName, phone, passwordHash, planStatus: 'TRIAL', trialEndsAt },
    })

    await createSession({ id: tenant.id, tenantId: tenant.id, name: ownerName, role: 'TENANT_ADMIN', planStatus: 'TRIAL' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ hata: 'Sunucu hatası' }, { status: 500 })
  }
}
