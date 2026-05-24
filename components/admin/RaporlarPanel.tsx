'use client'
import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { formatCurrency, formatDate, getMonthKey } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Entry = {
  id: string; date: string; amount: number; salesCount: number
  user: { name: string }; customer: { name: string } | null
}

type Rep = { id: string; name: string }

export function RaporlarPanel() {
  const now = new Date()
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])
  const [repId, setRepId] = useState('')
  const [reps, setReps] = useState<Rep[]>([])
  const [data, setData] = useState<{ entries: Entry[]; totalRevenue: number; totalSales: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/admin/temsilciler').then(r => r.json()).then(setReps) }, [])

  function load() {
    setLoading(true)
    const params = new URLSearchParams({ from, to })
    if (repId) params.set('repId', repId)
    fetch(`/api/admin/raporlar?${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }

  function downloadExcel() {
    const params = new URLSearchParams({ from, to, format: 'xlsx' })
    if (repId) params.set('repId', repId)
    window.open(`/api/admin/raporlar?${params}`)
  }

  const chartData = data?.entries.reduce((acc: Record<string, number>, e) => {
    const d = formatDate(e.date)
    acc[d] = (acc[d] ?? 0) + e.amount
    return acc
  }, {})

  const chartArr = chartData ? Object.entries(chartData).map(([date, amount]) => ({ date, amount })) : []

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border bg-card">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Başlangıç</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Bitiş</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Temsilci</label>
          <select value={repId} onChange={e => setRepId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none">
            <option value="">Tümü</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button onClick={load} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">Getir</button>
          <button onClick={downloadExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm transition-colors">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Toplam Ciro</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Toplam Satış Adedi</p>
              <p className="text-2xl font-bold">{data.totalSales}</p>
            </div>
          </div>

          {chartArr.length > 0 && (
            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-semibold mb-4 text-sm">Günlük Ciro Trendi</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartArr}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
                  <Bar dataKey="amount" fill="#0071E3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Tarih', 'Temsilci', 'Müşteri', 'Tutar', 'Adet'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.entries.map(e => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-muted-foreground">{formatDate(e.date)}</td>
                    <td className="px-4 py-2.5">{e.user.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.customer?.name ?? '-'}</td>
                    <td className="px-4 py-2.5 font-semibold">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{e.salesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
