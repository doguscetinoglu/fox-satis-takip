import { requireTenantAdmin } from '@/lib/dal'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
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
    <div className="flex min-h-screen bg-background">
      <AdminSidebar name={session.name} company={tenant?.companyName ?? ''} />
      <div className="flex-1 flex flex-col min-w-0">
        {trialDays !== null && <TrialBanner daysRemaining={trialDays} />}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="md:hidden w-8" />
          <h1 className="text-sm font-medium text-muted-foreground">Fox Satış Takip</h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
