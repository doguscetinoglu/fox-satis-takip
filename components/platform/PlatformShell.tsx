'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, CreditCard, Bell, LogOut,
  TrendingUp, Users, CheckCircle2, AlertTriangle, Clock,
  ChevronRight, XCircle, BadgeCheck, RefreshCw, Zap,
  ShieldCheck, Activity, DollarSign, Pencil, X, Save,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'

/* ─── Types ─── */
type TenantFull = {
  id: string; companyName: string; ownerName: string; phone: string
  planStatus: string; effectiveStatus: string; trialEndsAt: string; createdAt: string
  _count: { users: number; customers: number; salesEntries: number }
  subscriptionPayments: { id: string; status: string; period: string; amount: number; ibanRef?: string; createdAt: string }[]
}
type AttentionItem = {
  id: string; companyName: string; ownerName: string; phone: string
  type: 'suspended' | 'new' | 'expiring'; trialEndsAt: string; createdAt: string
}
type Stats = {
  totalTenants: number; activeTenants: number; trialTenants: number
  suspendedTenants: number; pendingPayments: number; monthlyRevenue: number
  tenants: TenantFull[]; attentionItems: AttentionItem[]
}

/* ─── Helpers ─── */
const statusStyle: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Aktif',    cls: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30' },
  TRIAL:     { label: 'Deneme',   cls: 'text-blue-400 bg-blue-400/15 border-blue-400/30' },
  SUSPENDED: { label: 'Askıda',   cls: 'text-red-400 bg-red-400/15 border-red-400/30' },
  CANCELLED: { label: 'İptal',    cls: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
}

function useCountUp(target: number, active = true) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || target === 0) { setVal(target); return }
    const start = Date.now()
    const dur = 900
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active])
  return val
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }:
  { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; delay?: number }) {
  const colorMap: Record<string, { icon: string; border: string; glow: string; badge: string }> = {
    blue:    { icon: 'text-blue-400',    border: 'border-blue-500/20',   glow: 'hover:shadow-blue-500/15',    badge: 'bg-blue-500/10' },
    emerald: { icon: 'text-emerald-400', border: 'border-emerald-500/20',glow: 'hover:shadow-emerald-500/15', badge: 'bg-emerald-500/10' },
    violet:  { icon: 'text-violet-400',  border: 'border-violet-500/20', glow: 'hover:shadow-violet-500/15',  badge: 'bg-violet-500/10' },
    amber:   { icon: 'text-amber-400',   border: 'border-amber-500/20',  glow: 'hover:shadow-amber-500/15',   badge: 'bg-amber-500/10' },
    red:     { icon: 'text-red-400',     border: 'border-red-500/20',    glow: 'hover:shadow-red-500/15',     badge: 'bg-red-500/10' },
  }
  const c = colorMap[color]
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative p-5 rounded-2xl border ${c.border} bg-slate-800/60 backdrop-blur-sm hover:shadow-xl ${c.glow} transition-all duration-300 overflow-hidden`}>
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%)' }} />
      <div className={`w-10 h-10 rounded-xl ${c.badge} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-sm font-medium text-slate-300 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

/* ─── Tabs ─── */
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'firmalar',  label: 'Firmalar',  icon: Building2 },
  { id: 'odemeler',  label: 'Ödemeler',  icon: CreditCard },
  { id: 'talepler',  label: 'Talepler',  icon: Bell },
]

/* ═══════════════════════════════════════════════════════════ */
export function PlatformShell() {
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editTenant, setEditTenant] = useState<TenantFull | null>(null)
  const router = useRouter()

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true)
    const data = await fetch('/api/platform/stats').then(r => r.json())
    setStats(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  async function changeStatus(id: string, planStatus: string) {
    await fetch(`/api/platform/tenantlar/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planStatus }),
    })
    load(true)
  }

  async function confirmPayment(paymentId: string, action: 'confirm' | 'reject') {
    await fetch(`/api/platform/abonelik/${paymentId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    load(true)
  }

  async function logout() {
    await fetch('/api/auth/cikis', { method: 'POST' })
    router.push('/giris')
    router.refresh()
  }

  const total = useCountUp(stats?.totalTenants ?? 0, !!stats)
  const active = useCountUp(stats?.activeTenants ?? 0, !!stats)
  const trial = useCountUp(stats?.trialTenants ?? 0, !!stats)
  const revenue = useCountUp(stats?.monthlyRevenue ?? 0, !!stats)
  const pendingCount = stats?.pendingPayments ?? 0

  const allPending = stats?.tenants.flatMap(t =>
    t.subscriptionPayments.filter(p => p.status === 'PENDING').map(p => ({ ...p, tenant: t }))
  ) ?? []
  const allPaymentHistory = stats?.tenants.flatMap(t =>
    t.subscriptionPayments.filter(p => p.status !== 'PENDING').map(p => ({ ...p, tenant: t }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20) ?? []

  return (
    <>
    {/* ── Edit Tenant Modal ── */}
    <AnimatePresence>
      {editTenant && (
        <TenantEditModal
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSaved={() => { setEditTenant(null); load(true) }}
        />
      )}
    </AnimatePresence>

    <div className="min-h-screen bg-[#060b18] text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-400/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.018]" style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/6 bg-slate-900/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight">Fox Platform</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Super Admin</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-white/5">
          {TABS.map(t => {
            const isActive = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {isActive && (
                  <motion.div layoutId="platform-tab" className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600/80 to-violet-600/80"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                )}
                <t.icon className="relative w-4 h-4" />
                <span className="relative">{t.label}</span>
                {t.id === 'odemeler' && pendingCount > 0 && (
                  <span className="relative ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-[10px] font-bold text-black">{pendingCount}</span>
                )}
                {t.id === 'talepler' && (stats?.attentionItems.length ?? 0) > 0 && (
                  <span className="relative ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white">{stats!.attentionItems.length}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => load(true)} disabled={refreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Çıkış</span>
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-1 px-4 py-3 bg-slate-900/50 border-b border-white/5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'odemeler' && pendingCount > 0 && <span className="ml-0.5 px-1 rounded-full bg-amber-500 text-[9px] font-bold text-black">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Yükleniyor...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

              {/* ── DASHBOARD ── */}
              {tab === 'dashboard' && stats && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Platform Özeti</h1>
                    <p className="text-slate-500 text-sm mt-1">Tüm firmalar ve sistem durumu</p>
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard icon={Building2} label="Toplam Firma" value={total} color="blue" delay={0} />
                    <StatCard icon={CheckCircle2} label="Aktif" value={active} color="emerald" delay={0.05} />
                    <StatCard icon={Clock} label="Deneme" value={trial} color="violet" delay={0.1} />
                    <StatCard icon={AlertTriangle} label="Askıda" value={stats.suspendedTenants} color="red" delay={0.15} />
                    <StatCard icon={DollarSign} label="Bu Ay Gelir" value={`₺${revenue.toLocaleString('tr-TR')}`} color="emerald" delay={0.2} />
                    <StatCard icon={Bell} label="Bekleyen" value={pendingCount} sub="ödeme talebi" color={pendingCount > 0 ? 'amber' : 'blue'} delay={0.25} />
                  </div>

                  {/* Recent + Attention split */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent tenants */}
                    <div className="rounded-2xl border border-white/6 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <p className="font-semibold text-sm">Son Kayıt Olan Firmalar</p>
                        <button onClick={() => setTab('firmalar')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                          Tümü <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="divide-y divide-white/4">
                        {stats.tenants.slice(0, 5).map((t, i) => {
                          const s = statusStyle[t.effectiveStatus] ?? statusStyle.CANCELLED
                          return (
                            <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-300">
                                {t.companyName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{t.companyName}</p>
                                <p className="text-xs text-slate-500">{t._count.users} temsilci · {t._count.customers} müşteri</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Pending payments */}
                    <div className="rounded-2xl border border-white/6 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          Bekleyen Ödemeler
                          {allPending.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">{allPending.length}</span>}
                        </p>
                        <button onClick={() => setTab('odemeler')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer">
                          Tümü <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      {allPending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                          <CheckCircle2 className="w-8 h-8 mb-2" />
                          <p className="text-sm">Bekleyen ödeme yok</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/4">
                          {allPending.slice(0, 4).map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-4 px-5 py-3.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.tenant.companyName}</p>
                                <p className="text-xs text-slate-500">{p.period} · ₺{p.amount}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => confirmPayment(p.id, 'confirm')}
                                  className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all cursor-pointer">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => confirmPayment(p.id, 'reject')}
                                  className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all cursor-pointer">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity mini chart — firm distribution */}
                  <div className="rounded-2xl border border-white/6 bg-slate-800/50 backdrop-blur-sm p-5">
                    <p className="font-semibold text-sm mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> Firma Dağılımı</p>
                    <div className="flex items-end gap-3 h-20">
                      {[
                        { label: 'Aktif', count: stats.activeTenants, color: 'bg-emerald-500' },
                        { label: 'Deneme', count: stats.trialTenants, color: 'bg-blue-500' },
                        { label: 'Askıda', count: stats.suspendedTenants, color: 'bg-red-500' },
                        { label: 'İptal', count: stats.tenants.filter(t => t.effectiveStatus === 'CANCELLED').length, color: 'bg-slate-600' },
                      ].map((b, i) => {
                        const pct = stats.totalTenants > 0 ? (b.count / stats.totalTenants) * 100 : 0
                        return (
                          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-400">{b.count}</span>
                            <div className="w-full rounded-t-md overflow-hidden" style={{ height: '60px' }}>
                              <motion.div className={`w-full ${b.color} rounded-t-md`}
                                initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 4)}%` }}
                                transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                                style={{ marginTop: 'auto' }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{b.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── FİRMALAR ── */}
              {tab === 'firmalar' && stats && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Firmalar</h1>
                    <p className="text-slate-500 text-sm mt-1">{stats.totalTenants} kayıtlı firma</p>
                  </div>

                  <div className="rounded-2xl border border-white/6 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-900/60">
                        <tr>
                          <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Firma</th>
                          <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Temsilci / Müşteri</th>
                          <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Kayıt</th>
                          <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Durum</th>
                          <th className="px-5 py-3.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/4">
                        {stats.tenants.map((t, i) => {
                          const s = statusStyle[t.effectiveStatus] ?? statusStyle.CANCELLED
                          const pending = t.subscriptionPayments.find(p => p.status === 'PENDING')
                          return (
                            <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                              className="hover:bg-white/3 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                                    {t.companyName[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">{t.companyName}</p>
                                    <p className="text-xs text-slate-500">{t.ownerName} · {t.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell">
                                {t._count.users} temsilci · {t._count.customers} müşteri · {t._count.salesEntries} satış
                              </td>
                              <td className="px-5 py-4 text-slate-500 text-xs hidden sm:table-cell">{formatDate(t.createdAt)}</td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>
                                  {pending && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">Ödeme Bekliyor</span>}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <select value={t.planStatus} onChange={e => changeStatus(t.id, e.target.value)}
                                    className="text-xs px-2 py-1.5 rounded-lg bg-slate-700 border border-white/10 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer">
                                    <option value="TRIAL">Deneme</option>
                                    <option value="ACTIVE">Aktif</option>
                                    <option value="SUSPENDED">Askıda</option>
                                    <option value="CANCELLED">İptal</option>
                                  </select>
                                  <button onClick={() => setEditTenant(t)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors cursor-pointer" title="Düzenle">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── ÖDEMELER ── */}
              {tab === 'odemeler' && stats && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Ödemeler</h1>
                    <p className="text-slate-500 text-sm mt-1">Abonelik ödeme onayları</p>
                  </div>

                  {/* Pending */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Onay Bekleyenler ({allPending.length})
                    </p>
                    {allPending.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/5 bg-slate-800/30 text-slate-600 gap-3">
                        <CheckCircle2 className="w-10 h-10" />
                        <p>Bekleyen ödeme talebi yok</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allPending.map((p, i) => (
                          <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            className="flex items-center gap-5 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white">{p.tenant.companyName}</p>
                              <p className="text-sm text-slate-400">{p.tenant.ownerName} · {p.tenant.phone}</p>
                              <p className="text-xs text-amber-400/80 mt-1">Dönem: {p.period} · Tutar: ₺{p.amount} · {formatDate(p.createdAt)}</p>
                              {p.ibanRef && <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {p.ibanRef}</p>}
                            </div>
                            <div className="flex gap-3">
                              <button onClick={() => confirmPayment(p.id, 'confirm')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors cursor-pointer">
                                <BadgeCheck className="w-4 h-4" /> Onayla
                              </button>
                              <button onClick={() => confirmPayment(p.id, 'reject')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600 text-red-400 hover:text-white text-sm font-medium border border-red-500/30 hover:border-transparent transition-all cursor-pointer">
                                <XCircle className="w-4 h-4" /> Reddet
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* History */}
                  {allPaymentHistory.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Geçmiş Ödemeler</p>
                      <div className="rounded-2xl border border-white/6 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-900/60">
                            <tr>
                              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Firma</th>
                              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Dönem</th>
                              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Tarih</th>
                              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Durum</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/4">
                            {allPaymentHistory.map((p, i) => (
                              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                className="hover:bg-white/3 transition-colors">
                                <td className="px-5 py-3">
                                  <p className="font-medium text-white">{p.tenant.companyName}</p>
                                  <p className="text-xs text-slate-500">{p.tenant.phone}</p>
                                </td>
                                <td className="px-5 py-3 text-slate-400 hidden sm:table-cell">{p.period} · ₺{p.amount}</td>
                                <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">{formatDate(p.createdAt)}</td>
                                <td className="px-5 py-3">
                                  {p.status === 'CONFIRMED'
                                    ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">Onaylandı</span>
                                    : <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-400/15 text-red-400 border border-red-400/30">Reddedildi</span>}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TALEPLER ── */}
              {tab === 'talepler' && stats && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Dikkat Gerektiren</h1>
                    <p className="text-slate-500 text-sm mt-1">Yeni kayıtlar, süresi bitmek üzere denemeler, askıdaki firmalar</p>
                  </div>

                  {stats.attentionItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/5 bg-slate-800/30 text-slate-600 gap-3">
                      <Zap className="w-10 h-10" />
                      <p>Her şey yolunda, dikkat gerektiren durum yok</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.attentionItems.map((item, i) => {
                        const config = {
                          new:      { icon: Zap,           color: 'border-blue-500/25 bg-blue-500/5',   badge: 'bg-blue-400/15 text-blue-400 border-blue-400/30',   label: 'Yeni Kayıt' },
                          expiring: { icon: Clock,         color: 'border-amber-500/25 bg-amber-500/5', badge: 'bg-amber-400/15 text-amber-400 border-amber-400/30', label: 'Süresi Bitiyor' },
                          suspended:{ icon: AlertTriangle, color: 'border-red-500/25 bg-red-500/5',     badge: 'bg-red-400/15 text-red-400 border-red-400/30',       label: 'Askıda' },
                        }[item.type]
                        const Icon = config.icon
                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className={`flex items-center gap-5 p-5 rounded-2xl border ${config.color} transition-colors`}>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-white">{item.companyName}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${config.badge}`}>{config.label}</span>
                              </div>
                              <p className="text-sm text-slate-400">{item.ownerName} · {item.phone}</p>
                              {item.type === 'expiring' && (
                                <p className="text-xs text-amber-400/80 mt-1">Deneme bitiş: {formatDate(item.trialEndsAt)}</p>
                              )}
                              {item.type === 'new' && (
                                <p className="text-xs text-blue-400/80 mt-1">Kayıt tarihi: {formatDate(item.createdAt)}</p>
                              )}
                            </div>
                            <select defaultValue={item.type === 'suspended' ? 'SUSPENDED' : 'TRIAL'}
                              onChange={e => changeStatus(item.id, e.target.value)}
                              className="text-xs px-2 py-1.5 rounded-lg bg-slate-700 border border-white/10 text-slate-300 focus:outline-none cursor-pointer">
                              <option value="TRIAL">Deneme</option>
                              <option value="ACTIVE">Aktif Yap</option>
                              <option value="SUSPENDED">Askıya Al</option>
                              <option value="CANCELLED">İptal</option>
                            </select>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════ */
function TenantEditModal({ tenant, onClose, onSaved }: {
  tenant: TenantFull
  onClose: () => void
  onSaved: () => void
}) {
  const toDateInput = (iso: string | null | undefined) => {
    if (!iso) return ''
    return new Date(iso).toISOString().slice(0, 10)
  }

  const [form, setForm] = useState({
    companyName: tenant.companyName,
    ownerName:   tenant.ownerName,
    phone:       tenant.phone,
    planStatus:  tenant.planStatus,
    trialEndsAt: toDateInput(tenant.trialEndsAt),
    subscriptionEndsAt: toDateInput((tenant as unknown as Record<string, string>).subscriptionEndsAt),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  async function save() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/platform/tenantlar/${tenant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: form.companyName,
        ownerName:   form.ownerName,
        phone:       form.phone,
        planStatus:  form.planStatus,
        trialEndsAt: form.trialEndsAt || undefined,
        subscriptionEndsAt: form.subscriptionEndsAt || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.hata ?? 'Bir hata oluştu'); setSaving(false); return }
    onSaved()
  }

  const field = (label: string, key: string, type = 'text') => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
      <input type={type} value={form[key as keyof typeof form] ?? ''}
        onChange={e => set(key, e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-700/60 border border-white/10 text-white text-sm placeholder-slate-500
          focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors" />
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">Firma Düzenle</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{tenant.companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {field('Firma Adı', 'companyName')}
          {field('Yetkili Adı', 'ownerName')}
          {field('Telefon', 'phone', 'tel')}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Plan Durumu</label>
            <select value={form.planStatus} onChange={e => set('planStatus', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-700/60 border border-white/10 text-white text-sm
                focus:outline-none focus:border-blue-500 transition-colors cursor-pointer">
              <option value="TRIAL">Deneme</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SUSPENDED">Askıda</option>
              <option value="CANCELLED">İptal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Deneme Bitiş', 'trialEndsAt', 'date')}
            {field('Abonelik Bitiş', 'subscriptionEndsAt', 'date')}
          </div>

          {error && (
            <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors cursor-pointer">
            İptal
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors cursor-pointer">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
