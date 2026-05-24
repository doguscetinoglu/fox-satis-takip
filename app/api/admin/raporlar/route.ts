import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'
import { formatDate } from '@/lib/utils'
import { exportSalesReport } from '@/lib/excel'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const repId = url.searchParams.get('repId') || undefined
  const format = url.searchParams.get('format')

  const where = {
    tenantId: session.tenantId,
    ...(repId ? { userId: repId } : {}),
    ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
  }

  const entries = await prisma.salesEntry.findMany({
    where,
    include: {
      user: { select: { name: true } },
      customer: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  })

  if (format === 'xlsx') {
    const buffer = exportSalesReport({
      title: 'Fox Satış Takip',
      period: from && to ? `${from} - ${to}` : 'Tüm Zamanlar',
      entries: entries.map(e => ({
        date: formatDate(e.date),
        repName: e.user.name,
        customerName: e.customer?.name,
        amount: e.amount,
        salesCount: e.salesCount,
      })),
    })
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="rapor.xlsx"',
      },
    })
  }

  const totalRevenue = entries.reduce((s, e) => s + e.amount, 0)
  const totalSales = entries.reduce((s, e) => s + e.salesCount, 0)

  return NextResponse.json({ entries, totalRevenue, totalSales })
}
