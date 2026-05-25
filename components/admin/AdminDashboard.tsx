'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, AlertCircle, Users, UserCheck, CreditCard,
  Target, ArrowUpRight, Bell, CheckCircle2, UserX, Clock,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type RepDetail = { id: string; name: string; revenue: number; target: number; pct: number; customerCount: number }
type Payment = { id: string; amount: number; paymentDate: string; method?: string; customerName: string; recordedBy: string }
type Alert = { type: string; message: string; count?: number; amount?: number }
type Stats = {
  monthlyRevenue: number; todayRevenue: number; activeCustomers: number
  overdueDebt: number; totalDebt: number; repsCount: number
  overdueCount: number; pendingDebtCount: number; unassignedCustomers: number
  monthlyTarget: number; repDetails: RepDetail[]
  recentPayments: Payment[]; dailyRevenue: { date: string; amount: number }[]
  alerts: Alert[]
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const timer = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setValue(Math.round(eased * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, duration, delay])
  return value
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
})

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

function StatCard({ title, value, subtitle, icon: Icon, color, delay = 0, trend }: {
  title: string; value: string; subtitle?: string; icon: typeof TrendingUp
  color: 'blue' | 'emerald' | 'violet' | 'red' | 'amber'; delay?: number; trend?: string
}) {
  return (
    <motion.div {...fadeUp(delay)}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative p-5 rounded-2xl border color-card-${color} overflow-hidden cursor-default`}>
      <div className="absolute inset-0 shimmer pointer-events-none opacity-30 dark:opacity-50" />
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-xl color-icon-${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight color-text-${color}`}>{value}</p>
      <div className="flex items-center justify-between mt-1">
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium color-text-emerald`}>
            <ArrowUpRight className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        className="h-full rounded-full" style={{ background: color }} />
    </div>
  )
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [])

  const monthlyRevenue = useCountUp(stats?.monthlyRevenue ?? 0, 1200, 200)
  const todayRevenue = useCountUp(stats?.todayRevenue ?? 0, 1000, 350)
  const overdueDebt = useCountUp(stats?.overdueDebt ?? 0, 1000, 500)
  const totalDebt = useCountUp(stats?.totalDebt ?? 0, 1000, 450)
  const overallPct = stats && stats.monthlyTarget > 0
    ? Math.min(100, (stats.monthlyRevenue / stats.monthlyTarget) * 100)
    : 0

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const alertConfig: Record<string, { icon: typeof Bell; color: string; cardCls: string }> = {
    overdue:    { icon: AlertCircle, color: 'color-text-red',   cardCls: 'border color-card-red' },
    unassigned: { icon: UserX,       color: 'color-text-amber', cardCls: 'border color-card-amber' },
    behind:     { icon: Target,      color: 'color-text-amber', cardCls: 'border color-card-amber' },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-bold">
          {greeting()} <span className="gradient-text">👋</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Aylık Ciro" value={formatCurrency(monthlyRevenue)} subtitle={`Hedef: ${formatCurrency(stats.monthlyTarget)}`} icon={TrendingUp} color="blue" delay={0.05} />
        <StatCard title="Bugünkü Ciro" value={formatCurrency(todayRevenue)} subtitle="Bugün gerçekleşen" icon={TrendingUp} color="emerald" delay={0.1} />
        <StatCard title="Toplam Açık Borç" value={formatCurrency(totalDebt)} subtitle={`${stats.pendingDebtCount} kayıt`} icon={CreditCard} color="amber" delay={0.15} />
        <StatCard title="Gecikmiş Borç" value={formatCurrency(overdueDebt)} subtitle={`${stats.overdueCount} kayıt`} icon={AlertCircle} color="red" delay={0.2} />
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Target progress + rep leaderboard */}
        <motion.div {...fadeUp(0.25)} className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card space-y-5">
          {/* Overall target */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" /> Aylık Hedef İlerlemesi
              </h2>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${overallPct >= 80 ? 'color-card-emerald color-text-emerald' : overallPct >= 50 ? 'color-card-blue color-text-blue' : 'color-card-amber color-text-amber'}`}>
                %{overallPct.toFixed(0)}
              </span>
            </div>
            <ProgressBar pct={overallPct} color={overallPct >= 80 ? '#10b981' : overallPct >= 50 ? '#3b82f6' : '#f59e0b'} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
              <span>{formatCurrency(stats.monthlyRevenue)} gerçekleşti</span>
              <span>{formatCurrency(stats.monthlyTarget)} hedef</span>
            </div>
          </div>

          {/* Rep leaderboard */}
          {stats.repDetails.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Temsilci Sıralaması
              </h3>
              {stats.repDetails.slice(0, 5).map((rep, i) => {
                const medal = ['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`
                const barColor = rep.pct >= 80 ? '#10b981' : rep.pct >= 50 ? '#3b82f6' : '#f59e0b'
                return (
                  <motion.div key={rep.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{medal}</span>
                        <span className="font-medium">{rep.name}</span>
                        <span className="text-xs text-muted-foreground">({rep.customerCount} müşteri)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(rep.revenue)}</span>
                        <span className="text-xs text-muted-foreground">%{rep.pct.toFixed(0)}</span>
                      </div>
                    </div>
                    <ProgressBar pct={rep.pct} color={barColor} />
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Bottom summary */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
            {[
              { label: 'Temsilci', value: stats.repsCount, icon: Users, color: 'color-text-blue' },
              { label: 'Müşteri', value: stats.activeCustomers, icon: UserCheck, color: 'color-text-violet' },
              { label: 'Atanmamış', value: stats.unassignedCustomers, icon: UserX, color: 'color-text-amber' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/40">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                <p className="font-bold text-lg">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right column: Alerts + Quick info */}
        <div className="space-y-4">
          {/* Alerts */}
          <motion.div {...fadeUp(0.3)} className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Uyarılar
            </h2>
            {stats.alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm color-text-emerald">
                <CheckCircle2 className="w-4 h-4" />
                <span>Her şey yolunda</span>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.alerts.map((a, i) => {
                  const conf = alertConfig[a.type]
                  const Icon = conf.icon
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className={`flex items-start gap-3 p-3 rounded-xl ${conf.cardCls}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${conf.color}`} />
                      <div>
                        <p className={`text-sm font-semibold ${conf.color}`}>{a.count} {a.message}</p>
                        {a.amount !== undefined && (
                          <p className="text-xs text-muted-foreground">{formatCurrency(a.amount)}</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Recent payments */}
          <motion.div {...fadeUp(0.35)} className="p-5 rounded-2xl border border-border bg-card">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Son Ödemeler
            </h2>
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz ödeme kaydı yok</p>
            ) : (
              <div className="space-y-2.5">
                {stats.recentPayments.slice(0, 5).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.customerName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(p.paymentDate)}
                      </p>
                    </div>
                    <span className="text-sm font-bold color-text-emerald ml-2 flex-shrink-0">
                      +{formatCurrency(p.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      {stats.dailyRevenue.length > 0 && (
        <motion.div {...fadeUp(0.45)} className="p-5 rounded-2xl border border-border bg-card">
          <h2 className="font-semibold text-sm mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Bu Ay Günlük Ciro
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.dailyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Ciro']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2}
                fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}
