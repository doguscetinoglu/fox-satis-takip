'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Entry = { id: string; date: string; amount: number; salesCount: number; description?: string; customer: { name: string } | null }
type Customer = { id: string; name: string; code: string }

export function GirisPanel() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', salesCount: '1', customerId: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/temsilci/giris').then(r => r.json()),
      fetch('/api/temsilci/musteriler').then(r => r.json()),
    ]).then(([e, c]) => { setEntries(e); setCustomers(c); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/temsilci/giris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), salesCount: Number(form.salesCount), customerId: form.customerId || undefined }),
    })
    setSaving(false)
    if (res.ok) { setForm(f => ({ ...f, amount: '', salesCount: '1', customerId: '', description: '' })); load() }
    else { const d = await res.json(); alert(d.hata) }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/temsilci/giris?id=${id}`, { method: 'DELETE' })
    load()
  }

  const monthTotal = entries.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Quick entry form */}
      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Satış Ekle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tarih</label>
              <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tutar (₺)*</label>
              <input type="number" required min="0" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Satış Adedi</label>
              <input type="number" min="1" value={form.salesCount} onChange={e => setForm(f => ({ ...f, salesCount: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Müşteri (opsiyonel)</label>
              <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none">
                <option value="">Seç (opsiyonel)</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <input placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-60 transition-colors">
            {saving ? 'Kaydediliyor...' : 'Satış Ekle'}
          </button>
        </form>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{entries.length} kayıt · Bu ay</span>
        <span className="font-bold text-emerald-400">{formatCurrency(monthTotal)}</span>
      </div>

      {/* Entry list */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Tarih', 'Tutar', 'Adet', 'Müşteri', 'Açıklama', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(e.date)}</td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-400">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.salesCount}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.customer?.name ?? '-'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{e.description ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Bu ay henüz satış girişi yok</p>}
        </div>
      )}
    </div>
  )
}
