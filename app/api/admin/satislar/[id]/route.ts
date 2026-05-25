import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { id } = await params

  const entry = await prisma.salesEntry.findFirst({
    where: { id, tenantId: session.tenantId },
  })
  if (!entry) return NextResponse.json({ hata: 'Kayıt bulunamadı' }, { status: 404 })

  await prisma.salesEntry.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
