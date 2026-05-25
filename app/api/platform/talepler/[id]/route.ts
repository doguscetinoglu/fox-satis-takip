import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { unauthorized } from '@/lib/dal'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'PLATFORM_ADMIN') return unauthorized()

  const { id } = await params
  const { reply, status } = await req.json()

  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (reply !== undefined) {
    data.reply = reply
    data.repliedAt = new Date()
    data.status = 'REPLIED'
  }

  const ticket = await prisma.supportTicket.update({ where: { id }, data })
  return NextResponse.json(ticket)
}
