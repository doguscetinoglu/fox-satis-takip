import { requireSalesRep } from '@/lib/dal'
import { TemsilciSidebar } from '@/components/layout/TemsilciSidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { prisma } from '@/lib/prisma'

export default async function TemsilciLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSalesRep()
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })

  return (
    <div className="flex min-h-screen bg-background">
      <TemsilciSidebar name={session.name} company={tenant?.companyName ?? ''} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="md:hidden w-8" />
          <h1 className="text-sm font-medium text-muted-foreground">{tenant?.companyName}</h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
