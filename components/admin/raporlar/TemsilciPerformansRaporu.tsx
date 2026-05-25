'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency, getMonthKey } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Trophy, Users, TrendingUp } from 'lucide-react'

type Rep = {
  id: string; name: string; phone: string
  revenue: number; salesCount: number
  revenueTarget: number; salesCountTarget: number
  revPct: number; customerCount: number
}
type Data = { reps: Rep[]; trend: Record<string, unknown>[]; monthKey: string }

function getMonthOptions() {
  const opts = []
  const now = new Date()
  for (let i = -5; i <= 0; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ key, label: d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) })
  }
  return opts.reverse()
}

const MEDAL = ['🥇', '🥈', '🥉']
const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } } as const
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } } }

export function TemsilciPerformansRaporu() {
  const [monthKey, setMonthKey] = useState(getMonthKey())
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/raporlar/temsilci?monthKey=${monthKey}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [monthKey])

  if (loading) return <Spinner />
  if (!data) return null

  const repNames = data.reps.map(r => r.name)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Month picker */}
      <motion.div variants={fadeUp}>
        <select value={monthKey} onChange={e => setMonthKey(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-violet-500">
          {getMonthOptions().map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </motion.div>

      {/* Podium cards */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.reps.map((rep, i) => {
          const pct = rep.revPct
          const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b'
          return (
            <motion.div key={rep.id} variants={fadeUp}
              whileHover={{ scale: 1.03, rotateX: -2, rotateY: 5, z: 20 }}
              style={{ transformStyle: 'preserve-3d', perspective: 900 }}
              className="p-5 rounded-2xl border border-border bg-card space-y-4 cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {i < 3 && <span className="text-xl">{MEDAL[i]}</span>}
                  <div>
                    <p className="font-semibold">{rep.name}</p>
                    <p className="text-xs text-muted-foreground">{rep.phone}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${pct >= 80 ? 'bg-emerald-500/15 text-emerald-400' : pct >= 50 ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-muted/40">
                  <TrendingUp className="w-3 h-3 mx-auto mb-1 text-blue-400" />
                  <p className="font-semibold text-blue-400">{formatCurrency(rep.revenue)}</p>
                  <p className="text-muted-foreground">Ciro</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/40">
                  <Trophy className="w-3 h-3 mx-auto mb-1 text-amber-400" />
                  <p className="font-semibold">{rep.salesCount}</p>
                  <p className="text-muted-foreground">Satış</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/40">
                  <Users className="w-3 h-3 mx-auto mb-1 text-violet-400" />
                  <p className="font-semibold">{rep.customerCount}</p>
                  <p className="text-muted-foreground">Müşteri</p>
                </div>
              </div>

              {/* Revenue progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Ciro Hedefi</span>
                  <span>{rep.revenueTarget > 0 ? formatCurrency(rep.revenueTarget) : 'Belirsiz'}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: barColor }} />
                </div>
              </div>

              {/* Count progress */}
              {rep.salesCountTarget > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Adet Hedefi</span>
                    <span>{rep.salesCountTarget} adet</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }}
                      animate={{ width: `${rep.salesCountTarget > 0 ? Math.min(100, (rep.salesCount / rep.salesCountTarget) * 100) : 0}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-violet-500" />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* 6-month trend chart */}
      {data.trend.length > 0 && repNames.length > 0 && (
        <motion.div variants={fadeUp} className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">6 Aylık Ciro Karşılaştırması</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.trend} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={34} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{v}</span>} />
              {repNames.map((name, i) => (
                <Bar key={name} dataKey={name} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {data.reps.length === 0 && (
        <p className="text-center py-12 text-muted-foreground text-sm">Bu ay için temsilci verisi yok</p>
      )}
    </motion.div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
}
