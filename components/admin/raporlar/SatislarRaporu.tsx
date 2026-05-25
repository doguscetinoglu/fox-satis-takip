'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingCart, Target, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

type RepStat = { repId: string; repName: string; revenue: number; count: number; target: number; pct: number }
type DailyEntry = { date: string; amount: number }
type Data = {
  month: string; totalRevenue: number; totalCount: number; totalTarget: number; pct: number
  repStats: RepStat[]; dailyRevenue: DailyEntry[]
}

const now = new Date()
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export function SatislarRaporu() {
  const [data, setData] = useState<Data | null>(null)
  const [month, setMonth] = useState(defaultMonth)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/raporlar/satis?month=${month}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [month])

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!data) return null

  const circumference = 2 * Math.PI * 42
  const pctOffset = circumference * (1 - data.pct / 100)

  return (
    <div className="space-y-6">
      {/* Period picker */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Dönem:</span>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm focus:outline-none" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Toplam Ciro', value: formatCurrency(data.totalRevenue), color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: ShoppingCart, label: 'Satış Adedi', value: data.totalCount.toLocaleString('tr-TR'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: Target, label: 'Aylık Hedef', value: formatCurrency(data.totalTarget), color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { icon: Award, label: 'Hedefe Ulaşma', value: `%${data.pct.toFixed(0)}`, color: data.pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : data.pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400', bg: 'bg-slate-500/10 border-slate-500/20' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`p-4 rounded-2xl border ${bg} bg-card`}>
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Hedef çemberi */}
        <div className="p-5 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-4">
          <p className="font-semibold text-sm">Genel Hedef Durumu</p>
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/60" />
            <motion.circle cx="50" cy="50" r="42" fill="none" stroke={data.pct >= 80 ? '#10b981' : data.pct >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: pctOffset }} transition={{ duration: 1.2, ease: 'easeOut' }} />
          </svg>
          <div className="text-center -mt-2">
            <p className="text-2xl font-extrabold">{data.pct.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Hedefe ulaşım</p>
          </div>
        </div>

        {/* Temsilci leaderboard */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card space-y-3">
          <p className="font-semibold text-sm mb-4">Temsilci Ciro Sıralaması</p>
          {data.repStats.length === 0 && <p className="text-sm text-muted-foreground">Kayıt bulunamadı</p>}
          {data.repStats.map((rep, i) => (
            <div key={rep.repId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                  <span className="text-sm font-medium">{rep.repName}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(rep.revenue)}</span>
                  {rep.target > 0 && <span className="text-xs text-muted-foreground ml-2">%{rep.pct.toFixed(0)}</span>}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  initial={{ width: 0 }} animate={{ width: `${rep.pct || (rep.target === 0 && rep.revenue > 0 ? 100 : 0)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rep comparison bar chart */}
      {data.repStats.length > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <p className="font-semibold text-sm mb-4">Temsilci Karşılaştırma</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.repStats} barSize={28} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="repName" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Ciro']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ciro" />
              <Bar dataKey="target" fill="rgba(148,163,184,0.25)" radius={[4, 4, 0, 0]} name="Hedef" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily revenue area chart */}
      {data.dailyRevenue.length > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <p className="font-semibold text-sm mb-4">Günlük Satış Trendi</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.dailyRevenue}>
              <defs>
                <linearGradient id="satisGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <YAxis tickFormatter={v => `₺${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Ciro']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#satisGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
