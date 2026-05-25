'use client'
import { useEffect, useState } from 'react'
import { Download, TrendingUp, ShoppingCart, AlertCircle, Zap } from 'lucide-react'
import { formatCurrency, getMonthKey } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

type RepStat = {
  id: string; name: string
  revenue: number; salesCount: number
  revenueTarget: number; salesCountTarget: number
}

type Data = {
  totalRevenue: number; totalSales: number; overdueDebt: number; todayRevenue: number
  daysInMonth: number; daysElapsed: number
  reps: RepStat[]
  daily: { date: string; revenue: number; salesCount: number }[]
}

function getMonthOptions() {
  const opts = []
  const now = new Date()
  for (let i = -5; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    opts.push({ key, label })
  }
  return opts
}

function CircleProgress({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#f59e0b'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  )
}

function MiniProgress({ value, target, color = 'blue' }: { value: number; target: number; color?: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0
  const bg = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{pct.toFixed(0)}%</span>
        <span>{target > 0 ? `${pct.toFixed(0)}%` : 'Hedef yok'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function CiroTakibiRaporu() {
  const [monthKey, setMonthKey] = useState(getMonthKey())
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/raporlar/ciro?monthKey=${monthKey}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [monthKey])

  function downloadExcel() {
    const [year, month] = monthKey.split('-').map(Number)
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    window.open(`/api/admin/raporlar?from=${from}&to=${to}&format=xlsx`)
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return null

  const totalTarget = data.reps.reduce((s, r) => s + r.revenueTarget, 0)
  const totalCountTarget = data.reps.reduce((s, r) => s + r.salesCountTarget, 0)
  const overallPct = totalTarget > 0 ? Math.min(100, (data.totalRevenue / totalTarget) * 100) : 0
  const dailyAvg = data.daysElapsed > 0 ? data.totalRevenue / data.daysElapsed : 0
  const donutData = [
    { name: 'Gerçekleşen', value: data.totalRevenue },
    { name: 'Kalan', value: Math.max(0, totalTarget - data.totalRevenue) },
  ]

  return (
    <div className="space-y-6 pt-2">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={monthKey} onChange={e => setMonthKey(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500">
          {getMonthOptions().map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <button onClick={downloadExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm transition-colors">
          <Download className="w-4 h-4" /> Excel İndir
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Ciro', value: formatCurrency(data.totalRevenue), icon: TrendingUp, color: 'blue' },
          { label: 'Satış Adedi', value: `${data.totalSales} adet`, icon: ShoppingCart, color: 'violet' },
          { label: 'Günlük Ortalama', value: formatCurrency(dailyAvg), icon: Zap, color: 'emerald' },
          { label: 'Gecikmiş Borç', value: formatCurrency(data.overdueDebt), icon: AlertCircle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => {
          const border = color === 'blue' ? 'border-blue-500/20' : color === 'violet' ? 'border-violet-500/20' : color === 'emerald' ? 'border-emerald-500/20' : 'border-red-500/20'
          const bg = color === 'blue' ? 'bg-blue-500/10' : color === 'violet' ? 'bg-violet-500/10' : color === 'emerald' ? 'bg-emerald-500/10' : 'bg-red-500/10'
          const text = color === 'blue' ? 'text-blue-400' : color === 'violet' ? 'text-violet-400' : color === 'emerald' ? 'text-emerald-400' : 'text-red-400'
          return (
            <div key={label} className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${bg} ${border} border`}>
                  <Icon className={`w-3.5 h-3.5 ${text}`} />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className={`text-xl font-bold ${text}`}>{value}</p>
            </div>
          )
        })}
      </div>

      {/* Target Progress */}
      {totalTarget > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-5">Hedef İlerlemesi</h3>
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Donut + center text */}
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <CircleProgress pct={overallPct} size={140} stroke={12} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{overallPct.toFixed(0)}%</span>
                <span className="text-xs text-muted-foreground">tamamlandı</span>
              </div>
            </div>

            {/* Summary */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-xs text-muted-foreground mb-0.5">Gerçekleşen Ciro</p>
                <p className="text-lg font-bold text-blue-400">{formatCurrency(data.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{data.totalSales} adet</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-xs text-muted-foreground mb-0.5">Toplam Hedef</p>
                <p className="text-lg font-bold">{formatCurrency(totalTarget)}</p>
                <p className="text-xs text-muted-foreground">{totalCountTarget} adet</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-xs text-muted-foreground mb-0.5">Kalan</p>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(Math.max(0, totalTarget - data.totalRevenue))}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-xs text-muted-foreground mb-0.5">Geçen Gün</p>
                <p className="text-lg font-bold">{data.daysElapsed} / {data.daysInMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-rep cards */}
      {data.reps.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Temsilci Bazlı Performans</h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.reps.map(rep => {
              const revPct = rep.revenueTarget > 0 ? Math.min(100, (rep.revenue / rep.revenueTarget) * 100) : 0
              const cntPct = rep.salesCountTarget > 0 ? Math.min(100, (rep.salesCount / rep.salesCountTarget) * 100) : 0
              return (
                <div key={rep.id} className="p-4 rounded-2xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{rep.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${revPct >= 80 ? 'bg-emerald-500/10 text-emerald-400' : revPct >= 50 ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {revPct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground text-xs">Ciro</span>
                      <span className="font-semibold text-sm">{formatCurrency(rep.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${revPct >= 80 ? 'bg-emerald-500' : revPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${revPct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Gerçekleşen</span>
                      <span>Hedef: {rep.revenueTarget > 0 ? formatCurrency(rep.revenueTarget) : 'Belirsiz'}</span>
                    </div>
                  </div>

                  {/* Sales count */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground text-xs">Satış Adedi</span>
                      <span className="font-semibold text-sm">{rep.salesCount} adet</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${cntPct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Gerçekleşen</span>
                      <span>Hedef: {rep.salesCountTarget > 0 ? `${rep.salesCountTarget} adet` : 'Belirsiz'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Daily chart */}
      {data.daily.length > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold text-sm mb-4">Günlük Ciro Trendi</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.daily} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), 'Ciro']}
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: 'rgba(59,130,246,0.06)' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.daily.length === 0 && data.reps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Bu ay için henüz satış verisi bulunmuyor
        </div>
      )}
    </div>
  )
}
