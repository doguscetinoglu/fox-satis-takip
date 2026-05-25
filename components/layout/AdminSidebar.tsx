'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Target, FileWarning,
  CreditCard, BarChart2, BadgeDollarSign, TrendingUp, LogOut, X, Menu, ShoppingCart, LifeBuoy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/temsilciler', label: 'Temsilciler', icon: Users },
  { href: '/admin/musteriler', label: 'Müşteriler', icon: UserCheck },
  { href: '/admin/hedefler', label: 'Hedefler', icon: Target },
  { href: '/admin/satislar', label: 'Satışlar', icon: ShoppingCart },
  { href: '/admin/borclar', label: 'Borçlar', icon: FileWarning },
  { href: '/admin/odemeler', label: 'Ödemeler', icon: CreditCard },
  { href: '/admin/raporlar', label: 'Raporlar', icon: BarChart2 },
  { href: '/admin/abonelik', label: 'Abonelik', icon: BadgeDollarSign },
  { href: '/admin/destek', label: 'Destek', icon: LifeBuoy },
]

export function AdminMenuButton() {
  const { toggle } = useSidebar()
  return (
    <button onClick={toggle} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
      <Menu className="w-5 h-5" />
    </button>
  )
}

export function AdminSidebar({ name, company }: { name: string; company: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { open, close } = useSidebar()

  async function logout() {
    await fetch('/api/auth/cikis', { method: 'POST' })
    router.push('/giris')
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b" style={{ borderColor: 'var(--nav-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{company}</p>
            <p className="text-xs text-muted-foreground truncate">{name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={close}
              className={cn('nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm', active && 'active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--nav-border)' }}>
        <button onClick={logout} className="nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:!text-red-500 dark:hover:!text-red-400 hover:!bg-red-500/10 w-full cursor-pointer">
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-glass hidden md:flex w-56 flex-shrink-0 border-r flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring' as const, stiffness: 320, damping: 32 }}
              className="sidebar-glass relative w-64 border-r flex flex-col h-full shadow-2xl"
            >
              <button onClick={close} className="nav-item absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
