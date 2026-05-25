import { requireSalesRep } from '@/lib/dal'
import { TemsilciSidebar } from '@/components/layout/TemsilciSidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { prisma } from '@/lib/prisma'

export default async function TemsilciLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSalesRep()
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })

  return (
    <div className="flex min-h-screen">
      <TemsilciSidebar name={session.name} company={tenant?.companyName ?? ''} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="header-glass flex items-center justify-between px-4 md:px-6 py-3.5 border-b sticky top-0 z-30">
          <div className="md:hidden w-9" />
          <h1 className="text-sm font-medium text-muted-foreground truncate">{tenant?.companyName}</h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
