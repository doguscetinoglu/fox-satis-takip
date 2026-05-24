'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, PlusCircle, FileWarning, TrendingUp, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/temsilci', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/temsilci/giris', label: 'Satış Girişi', icon: PlusCircle },
  { href: '/temsilci/musteriler', label: 'Müşterilerim', icon: Users },
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

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-slate-500 truncate">{company}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/temsilci' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-emerald-600/20 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-card border-r border-border flex-col h-screen sticky top-0">
        {sidebar}
      </aside>
      <button onClick={() => setOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border">
        <Menu className="w-5 h-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-56 bg-card border-r border-border flex flex-col h-full">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  )
}
