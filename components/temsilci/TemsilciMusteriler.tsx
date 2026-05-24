'use client'
import { useEffect, useState } from 'react'
import { Phone, MapPin } from 'lucide-react'
import { formatCurrency, getDebtAgeDays, getDebtAgeBucket } from '@/lib/utils'
import { DebtAgeBadge } from '@/components/ui/DebtAgeBadge'

type Customer = {
  id: string; name: string; code: string; phone?: string; city?: string
  debts: { amount: number; dueDate: string; status: string }[]
}

export function TemsilciMusteriler() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/temsilci/musteriler').then(r => r.json()).then(d => { setCustomers(d); setLoading(false) })
  }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const openDebt = (c: Customer) => c.debts.filter(d => d.status !== 'PAID').reduce((s, d) => s + d.amount, 0)
  const maxAge = (c: Customer) => c.debts.length ? Math.max(...c.debts.map(d => getDebtAgeDays(d.dueDate))) : 0

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri ara..."
        className="w-full max-w-sm px-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-emerald-500" />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{c.code}</p>
              </div>
              {maxAge(c) > 0 && <DebtAgeBadge dueDate={new Date(Date.now() - maxAge(c) * 86400000)} />}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
              {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
              <span className="text-muted-foreground text-xs">Açık Borç</span>
              <span className={`font-semibold ${openDebt(c) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(openDebt(c))}</span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Müşteri bulunamadı</p>}
    </div>
  )
}
