'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DebtAgeBadge } from '@/components/ui/DebtAgeBadge'

type Debt = {
  id: string; amount: number; dueDate: string; documentNo?: string
  status: string; ageDays: number; ageBucket: string
  customer: { name: string; code: string; phone?: string; assignedRep: { name: string } | null }
}

const buckets = [
  { key: 'all', label: 'Hepsi' },
  { key: '0-30', label: '0-30 Gün' },
  { key: '30-60', label: '30-60 Gün' },
  { key: '60-90', label: '60-90 Gün' },
  { key: '90+', label: '90+ Gün' },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Bekliyor', cls: 'status-pending border' },
  PARTIAL: { label: 'Kısmi',    cls: 'status-partial border' },
  OVERDUE: { label: 'Gecikmiş', cls: 'status-overdue border' },
  PAID:    { label: 'Ödendi',   cls: 'status-paid border' },
}

export function BorclarPanel() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [bucket, setBucket] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/borclar?bucket=${bucket}`).then(r => r.json()).then(d => { setDebts(d); setLoading(false) })
  }, [bucket])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/borclar/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setBucket(b => b)
  }

  const total = debts.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-4">
      {/* Bucket filter */}
      <div className="flex gap-2 flex-wrap">
        {buckets.map(b => (
          <button key={b.key} onClick={() => setBucket(b.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${bucket === b.key ? 'bg-blue-600 text-white' : 'border border-border hover:bg-muted'}`}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{debts.length} borç kaydı</span>
        <span className="font-semibold">Toplam: {formatCurrency(total)}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Temsilci</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Belge No</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tutar</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Vade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Gecikme</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Durum</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {debts.map(d => {
                  const st = statusMap[d.status] ?? statusMap.PENDING
                  return (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.customer.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{d.customer.code}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{d.customer.assignedRep?.name ?? '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{d.documentNo ?? '-'}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(d.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDate(d.dueDate)}</td>
                      <td className="px-4 py-3"><DebtAgeBadge dueDate={d.dueDate} /></td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select onChange={e => updateStatus(d.id, e.target.value)} value={d.status}
                          className="text-xs px-2 py-1 rounded-lg bg-background border border-border focus:outline-none">
                          <option value="PENDING">Bekliyor</option>
                          <option value="PARTIAL">Kısmi</option>
                          <option value="OVERDUE">Gecikmiş</option>
                          <option value="PAID">Ödendi</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {debts.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Borç kaydı bulunamadı</p>}
          </div>
        </div>
      )}
    </div>
  )
}
