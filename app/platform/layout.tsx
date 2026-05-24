import { requirePlatformAdmin } from '@/lib/dal'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin()
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <h1 className="font-bold text-lg">Fox Platform Admin</h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
