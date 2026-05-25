'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type BucketData = { count: number; total: number }
type Customer = {
  id: string; name: string; code: string; repName: string | null; total: number
  buckets: Record<string, number>
}
type Data = {
  buckets: Record<string, BucketData>
  customers: Customer[]
  totalDebt: number
  debtCount: number
}

const BUCKET_CONFIG = [
  { key: '0-30',  label: '0–30 Gün',   color: '#f59e0b', bg: 'from-amber-500/20 to-amber-500/5',   border: 'border-amber-500/30',   text: 'text-amber-400' },
  { key: '30-60', label: '30–60 Gün',  color: '#f97316', bg: 'from-orange-500/20 to-orange-500/5',  border: 'border-orange-500/30',  text: 'text-orange-400' },
  { key: '60-90', label: '60–90 Gün',  color: '#ef4444', bg: 'from-red-500/20 to-red-500/5',        border: 'border-red-500/30',     text: 'text-red-400' },
  { key: '90+',   label: '90+ Gün',    color: '#dc2626', bg: 'from-red-700/30 to-red-700/5',        border: 'border-red-700/40',     text: 'text-red-500' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } } as const
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } } }

export function BorcYaslandirmaRaporu() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/raporlar/borc').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <Spinner />
  if (!data) return null

  const pieData = BUCKET_CONFIG
    .map(b => ({ name: b.label, value: data.buckets[b.key].total, color: b.color }))
    .filter(d => d.value > 0)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Summary cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {BUCKET_CONFIG.map(b => {
          const bucket = data.buckets[b.key]
          return (
            <motion.div key={b.key} variants={fadeUp} whileHover={{ scale: 1.03, rotateX: -3, rotateY: 4 }}
              style={{ transformStyle: 'preserve-3d', perspective: 800 }}
              className={`p-4 rounded-2xl border bg-gradient-to-br ${b.bg} ${b.border} cursor-default`}>
              <p className="text-xs text-muted-foreground mb-1">{b.label}</p>
              <p className={`text-xl font-bold ${b.text}`}>{formatCurrency(bucket.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{bucket.count} borç kaydı</p>
              {data.totalDebt > 0 && (
                <div className="mt-2 h-1 rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(bucket.total / data.totalDebt) * 100}%` }}
                    transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: b.color }} />
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Pie chart + top debtors */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Vade Dağılımı</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value" animationBegin={100} animationDuration={700}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 text-muted-foreground text-sm">Borç verisi yok</p>}
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Toplam Açık Borç</h3>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(data.totalDebt)}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.debtCount} aktif borç kaydı</p>
            </div>
            <div className="space-y-2 mt-4">
              {BUCKET_CONFIG.map(b => {
                const bucket = data.buckets[b.key]
                if (bucket.total === 0) return null
                const pct = data.totalDebt > 0 ? (bucket.total / data.totalDebt) * 100 : 0
                return (
                  <div key={b.key} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className={b.text}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="h-full rounded-full" style={{ background: b.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top debtors table */}
      {data.customers.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 bg-muted/40 border-b border-border">
            <h3 className="font-semibold text-sm">En Yüksek Borçlu Müşteriler</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr>{['Müşteri', 'Temsilci', '0-30', '30-60', '60-90', '90+', 'Toplam'].map(h =>
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.customers.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{c.code}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.repName ?? '–'}</td>
                    {['0-30', '30-60', '60-90', '90+'].map(bk => (
                      <td key={bk} className="px-4 py-3 text-xs">
                        {c.buckets[bk] > 0
                          ? <span className={BUCKET_CONFIG.find(b => b.key === bk)!.text}>{formatCurrency(c.buckets[bk])}</span>
                          : <span className="text-muted-foreground">–</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-red-400">{formatCurrency(c.total)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
}
