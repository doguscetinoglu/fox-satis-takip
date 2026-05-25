'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency, getMonthKey } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users, UserCheck, UserX, MapPin } from 'lucide-react'

type Customer = { id: string; name: string; code: string; city?: string; repName: string | null; monthRevenue: number; totalDebt: number }
type Data = {
  topByRevenue: Customer[]; topByDebt: Customer[]
  cityDist: { city: string; count: number }[]
  totalCustomers: number; assigned: number; unassigned: number; monthKey: string
}

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

const EMERALD_SHADES = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5', '#f0fdf4', '#f7fef9', '#fafefa', '#fdfffe']

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } } as const
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } } }

export function MusteriAnaliziRaporu() {
  const [monthKey, setMonthKey] = useState(getMonthKey())
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/raporlar/musteri?monthKey=${monthKey}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [monthKey])

  if (loading) return <Spinner />
  if (!data) return null

  const maxRevenue = data.topByRevenue[0]?.monthRevenue ?? 1

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Month picker */}
      <motion.div variants={fadeUp}>
        <select value={monthKey} onChange={e => setMonthKey(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-emerald-500">
          {getMonthOptions().map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Toplam Müşteri', value: data.totalCustomers, icon: Users, color: 'blue' },
          { label: 'Temsilci Atanmış', value: data.assigned, icon: UserCheck, color: 'emerald' },
          { label: 'Atanmamış', value: data.unassigned, icon: UserX, color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => {
          const clsMap = { blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400' }, emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' }, amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' } }
          const cls = clsMap[color as keyof typeof clsMap]
          return (
            <motion.div key={label} variants={fadeUp} whileHover={{ scale: 1.04, rotateX: -3, rotateY: 4 }}
              style={{ transformStyle: 'preserve-3d', perspective: 800 }}
              className={`p-4 rounded-2xl border ${cls.border} ${cls.bg} cursor-default`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${cls.icon}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${cls.text}`}>{value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-4">
        {/* Top revenue customers */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4 text-emerald-400">En Çok Ciro — Bu Ay</h3>
          {data.topByRevenue.length > 0 ? (
            <div className="space-y-2">
              {data.topByRevenue.map((c, i) => {
                const pct = (c.monthRevenue / maxRevenue) * 100
                return (
                  <div key={c.id} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[60%]">{c.name}</span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(c.monthRevenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ background: EMERALD_SHADES[Math.min(i, EMERALD_SHADES.length - 1)] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-center py-8 text-muted-foreground text-sm">Bu ay ciro verisi yok</p>}
        </div>

        {/* Top debt customers */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4 text-red-400">En Yüksek Borç</h3>
          {data.topByDebt.length > 0 ? (
            <div className="space-y-2.5">
              {data.topByDebt.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.repName ?? 'Atanmamış'}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(c.totalDebt)}</span>
                </motion.div>
              ))}
            </div>
          ) : <p className="text-center py-8 text-muted-foreground text-sm">Açık borç yok</p>}
        </div>
      </motion.div>

      {/* City distribution */}
      {data.cityDist.length > 0 && (
        <motion.div variants={fadeUp} className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Şehir Dağılımı
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.cityDist} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.cityDist.map((_, i) => (
                  <Cell key={i} fill={`hsl(${160 + i * 18}, 70%, ${55 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
}
