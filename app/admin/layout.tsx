import { requireTenantAdmin } from '@/lib/dal'
import { AdminSidebar, AdminMenuButton } from '@/components/layout/AdminSidebar'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { TrialBanner } from '@/components/ui/TrialBanner'
import { prisma } from '@/lib/prisma'
import { getTrialDaysRemaining } from '@/lib/subscription'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTenantAdmin()
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })

  const trialDays = tenant && session.planStatus === 'TRIAL'
    ? getTrialDaysRemaining(tenant.trialEndsAt)
    : null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar name={session.name} company={tenant?.companyName ?? ''} />
        <div className="flex-1 flex flex-col min-w-0">
          {trialDays !== null && <TrialBanner daysRemaining={trialDays} />}
          <header className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-border gap-3">
            <AdminMenuButton />
            <h1 className="text-sm font-medium text-muted-foreground truncate">{tenant?.companyName ?? 'Fox Satış Takip'}</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
