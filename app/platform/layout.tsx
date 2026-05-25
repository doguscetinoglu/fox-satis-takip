import { requirePlatformAdmin } from '@/lib/dal'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin()
  return <>{children}</>
}
