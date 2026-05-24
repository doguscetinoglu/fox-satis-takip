import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { normalizePhone } from '@/lib/utils'
import { parseCustomerSheet, generateCustomerTemplate } from '@/lib/excel'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  if (url.searchParams.get('template') === 'true') {
    const buffer = generateCustomerTemplate()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="musteri-sablonu.xlsx"',
      },
    })
  }

  return NextResponse.json({ hata: 'Geçersiz istek' }, { status: 400 })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ hata: 'Dosya bulunamadı' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const { rows, errors } = parseCustomerSheet(buffer)

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

  let inserted = 0
  let duplicatesSkipped = 0

  for (const row of rows) {
    let repId: string | undefined
    if (row.repPhone) {
      const repPhone = normalizePhone(row.repPhone)
      const rep = await prisma.user.findUnique({
        where: { tenantId_phone: { tenantId: session.tenantId, phone: repPhone } },
      })
      if (rep) repId = rep.id
    }

    const exists = await prisma.customer.findUnique({
      where: { tenantId_code: { tenantId: session.tenantId, code: row.code } },
    })
    if (exists) { duplicatesSkipped++; continue }

    await prisma.customer.create({
      data: {
        tenantId: session.tenantId,
        code: row.code,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: row.city,
        assignedRepId: repId,
      },
    })
    inserted++
  }

  return NextResponse.json({ inserted, duplicatesSkipped, errors: [] })
}
