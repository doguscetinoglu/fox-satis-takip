import { NextResponse, type NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

const PUBLIC_PATHS = ['/', '/giris', '/kayit', '/api/auth']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const session = await getSessionFromRequest(req)

  if (!session) {
    return NextResponse.redirect(new URL('/giris', req.url))
  }

  // Suspended → abonelik
  if (
    (session.planStatus === 'SUSPENDED' || session.planStatus === 'CANCELLED') &&
    !path.startsWith('/admin/abonelik') &&
    !path.startsWith('/api/admin/abonelik') &&
    !path.startsWith('/api/auth')
  ) {
    return NextResponse.redirect(new URL('/admin/abonelik', req.url))
  }

  // Role routing
  if (path.startsWith('/admin') && session.role !== 'TENANT_ADMIN') {
    return NextResponse.redirect(new URL('/giris', req.url))
  }
  if (path.startsWith('/temsilci') && session.role !== 'SALES_REP') {
    return NextResponse.redirect(new URL('/giris', req.url))
  }
  if (path.startsWith('/platform') && session.role !== 'PLATFORM_ADMIN') {
    return NextResponse.redirect(new URL('/giris', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
