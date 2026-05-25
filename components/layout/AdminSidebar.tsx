'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Target, FileWarning,
  CreditCard, BarChart2, BadgeDollarSign, TrendingUp, LogOut, X, Menu
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/temsilciler', label: 'Temsilciler', icon: Users },
  { href: '/admin/musteriler', label: 'Müşteriler', icon: UserCheck },
  { href: '/admin/hedefler', label: 'Hedefler', icon: Target },
  { href: '/admin/borclar', label: 'Borçlar', icon: FileWarning },
  { href: '/admin/odemeler', label: 'Ödemeler', icon: CreditCard },
  { href: '/admin/raporlar', label: 'Raporlar', icon: BarChart2 },
  { href: '/admin/abonelik', label: 'Abonelik', icon: BadgeDollarSign },
]

export function AdminMenuButton() {
  const { toggle } = useSidebar()
  return (
    <button onClick={toggle} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
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
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{company}</p>
            <p className="text-xs text-slate-500 truncate">{name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={close}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-card border-r border-border flex-col h-screen sticky top-0">
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative w-64 bg-card border-r border-border flex flex-col h-full shadow-2xl"
            >
              <button onClick={close} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
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
