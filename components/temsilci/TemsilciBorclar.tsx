'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DebtAgeBadge } from '@/components/ui/DebtAgeBadge'

type Debt = {
  id: string; amount: number; dueDate: string; documentNo?: string
  status: string; ageDays: number
  customer: { name: string; code: string; phone?: string }
}

const buckets = [
  { key: 'all', label: 'Hepsi' },
  { key: '0-30', label: '0-30g' },
  { key: '30-60', label: '30-60g' },
  { key: '60-90', label: '60-90g' },
  { key: '90+', label: '90+g' },
]

export function TemsilciBorclar() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [bucket, setBucket] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/temsilci/borclar?bucket=${bucket}`).then(r => r.json()).then(d => { setDebts(d); setLoading(false) })
  }, [bucket])

  const total = debts.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {buckets.map(b => (
          <button key={b.key} onClick={() => setBucket(b.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${bucket === b.key ? 'bg-emerald-600 text-white' : 'border border-border hover:bg-muted'}`}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{debts.length} borç</span>
        <span className="font-semibold">{formatCurrency(total)}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {debts.map(d => (
            <div key={d.id} className={`p-4 rounded-xl border bg-card flex items-center justify-between gap-4 ${d.ageDays > 90 ? 'border-red-500/30' : d.ageDays > 60 ? 'border-orange-500/20' : 'border-border'}`}>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{d.customer.name}</p>
                <p className="text-xs text-muted-foreground">{d.customer.code} {d.customer.phone && `· ${d.customer.phone}`}</p>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <p className="font-bold">{formatCurrency(d.amount)}</p>
                <DebtAgeBadge dueDate={d.dueDate} />
              </div>
            </div>
          ))}
          {debts.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Bu filtrede borç bulunamadı</p>}
        </div>
      )}
    </div>
  )
}
