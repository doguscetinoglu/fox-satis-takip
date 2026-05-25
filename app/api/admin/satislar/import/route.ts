import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { normalizePhone } from '@/lib/utils'
import { parseSalesSheet, generateSalesTemplate } from '@/lib/excel'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  if (url.searchParams.get('template') === 'true') {
    const buffer = generateSalesTemplate()
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="satis-sablonu.xlsx"',
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
  const { rows, errors } = parseSalesSheet(buffer)

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 })

  let inserted = 0

  for (const row of rows) {
    const repPhone = normalizePhone(row.repPhone)
    const rep = await prisma.user.findUnique({
      where: { tenantId_phone: { tenantId: session.tenantId, phone: repPhone } },
    })
    if (!rep) continue

    let customerId: string | undefined
    if (row.customerCode) {
      const cust = await prisma.customer.findUnique({
        where: { tenantId_code: { tenantId: session.tenantId, code: row.customerCode } },
      })
      if (cust) customerId = cust.id
    }

    await prisma.salesEntry.create({
      data: {
        tenantId: session.tenantId,
        userId: rep.id,
        customerId,
        amount: row.amount,
        salesCount: row.salesCount,
        date: row.date,
        description: row.description,
      },
    })
    inserted++
  }

  return NextResponse.json({ inserted, errors: [] })
}
