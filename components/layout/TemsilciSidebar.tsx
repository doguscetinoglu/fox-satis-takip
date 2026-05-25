'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, PlusCircle, FileWarning, TrendingUp, LogOut, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/temsilci', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/temsilci/giris', label: 'Satış Girişi', icon: PlusCircle },
  { href: '/temsilci/musteriler', label: 'Müşteriler', icon: Users },
  { href: '/temsilci/borclar', label: 'Borçlar', icon: FileWarning },
]

export function TemsilciSidebar({ name, company }: { name: string; company: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/auth/cikis', { method: 'POST' })
    router.push('/giris')
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b" style={{ borderColor: 'var(--nav-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{company}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/temsilci' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn('nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm',
                active ? 'active !text-emerald-600 dark:!text-emerald-400 !bg-emerald-500/10 dark:!bg-emerald-600/20 font-medium' : ''
              )}>
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

      {/* Mobile: hamburger trigger */}
      <button onClick={() => setOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-40 p-2 rounded-lg bg-card border border-border shadow-sm cursor-pointer">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring' as const, stiffness: 320, damping: 32 }}
              className="sidebar-glass relative w-64 border-r flex flex-col h-full shadow-2xl"
            >
              <button onClick={() => setOpen(false)}
                className="nav-item absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile: bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t" style={{ background: 'var(--sidebar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderColor: 'var(--nav-border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/temsilci' && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn('flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'
                )}>
                <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]')} />
                <span className="font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
