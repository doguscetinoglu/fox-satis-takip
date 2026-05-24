'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Payment = {
  id: string; amount: number; paymentDate: string; method?: string
  customer: { name: string; code: string }
  recordedBy: { name: string }
}

type Customer = { id: string; name: string; code: string }

export function OdemelerPanel() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customerId: '', amount: '', paymentDate: new Date().toISOString().split('T')[0], method: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/odemeler').then(r => r.json()),
      fetch('/api/admin/musteriler').then(r => r.json()),
    ]).then(([p, c]) => { setPayments(p); setCustomers(c); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/odemeler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
    setSaving(false)
    if (res.ok) { setForm(f => ({ ...f, customerId: '', amount: '', method: '', description: '' })); setShowForm(false); load() }
    else { const d = await res.json(); alert(d.hata) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Ödeme Kaydet
        </button>
      </div>

      {showForm && (
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <h3 className="font-semibold mb-4">Yeni Ödeme Kaydı</h3>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-4">
            <select required value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none">
              <option value="">Müşteri Seç*</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
            <input type="number" placeholder="Tutar (₺)*" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
            <input type="date" required value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
            <input placeholder="Yöntem (Havale, Nakit...)" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
            <input placeholder="Açıklama" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
            <div className="sm:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">İptal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Müşteri', 'Tutar', 'Tarih', 'Yöntem', 'Kaydeden'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium">{p.customer.name}</p><p className="text-xs text-muted-foreground">{p.customer.code}</p></td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.method ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.recordedBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Ödeme kaydı bulunamadı</p>}
        </div>
      )}
    </div>
  )
}
