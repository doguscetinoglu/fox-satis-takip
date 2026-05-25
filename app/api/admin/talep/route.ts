import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const tickets = await prisma.supportTicket.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tickets)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'TENANT_ADMIN') return unauthorized()

  const { subject, message } = await req.json()
  if (!subject?.trim() || !message?.trim())
    return NextResponse.json({ hata: 'Konu ve mesaj zorunlu' }, { status: 400 })

  const ticket = await prisma.supportTicket.create({
    data: { tenantId: session.tenantId, subject: subject.trim(), message: message.trim() },
  })

  return NextResponse.json(ticket, { status: 201 })
}
