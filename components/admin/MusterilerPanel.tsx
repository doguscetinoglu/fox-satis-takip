'use client'
import { useEffect, useState } from 'react'
import { Plus, Upload, Download, Search, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, getDebtAgeDays } from '@/lib/utils'
import { DebtAgeBadge } from '@/components/ui/DebtAgeBadge'
import { CustomerImportModal } from './CustomerImportModal'

type Customer = {
  id: string; code: string; name: string; phone?: string; city?: string
  assignedRep: { name: string } | null
  debts: { amount: number; dueDate: string; status: string }[]
}

type Rep = { id: string; name: string }

export function MusterilerPanel() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRep, setFilterRep] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', phone: '', city: '', assignedRepId: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterRep) params.set('repId', filterRep)
    Promise.all([
      fetch(`/api/admin/musteriler?${params}`).then(r => r.json()),
      fetch('/api/admin/temsilciler').then(r => r.json()),
    ]).then(([c, r]) => { setCustomers(c); setReps(r); setLoading(false) })
  }

  useEffect(() => { load() }, [filterRep])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/musteriler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { setForm({ code: '', name: '', phone: '', city: '', assignedRepId: '' }); setShowForm(false); load() }
    else { const d = await res.json(); alert(d.hata) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return
    await fetch(`/api/admin/musteriler/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalDebt = (c: Customer) => c.debts.reduce((s, d) => s + d.amount, 0)
  const maxOverdue = (c: Customer) => c.debts.length ? Math.max(...c.debts.map(d => getDebtAgeDays(d.dueDate))) : 0

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Müşteri ara..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <select value={filterRep} onChange={e => setFilterRep(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none">
          <option value="">Tüm Temsilciler</option>
          {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button onClick={() => window.open('/api/admin/musteriler/import?template=true')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
          <Download className="w-4 h-4" /> Şablon İndir
        </button>
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
          <Upload className="w-4 h-4" /> Excel Yükle
        </button>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Müşteri Ekle
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <h3 className="font-semibold mb-4">Yeni Müşteri</h3>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-4">
            {[
              { k: 'code', p: 'Müşteri Kodu*' }, { k: 'name', p: 'Müşteri Adı*' },
              { k: 'phone', p: 'Telefon' }, { k: 'city', p: 'Şehir' },
            ].map(({ k, p }) => (
              <input key={k} placeholder={p} required={p.includes('*')} value={form[k as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500" />
            ))}
            <select value={form.assignedRepId} onChange={e => setForm(f => ({ ...f, assignedRepId: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none">
              <option value="">Temsilci Seç</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="sm:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">İptal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Kod', 'Müşteri', 'Şehir', 'Temsilci', 'Açık Borç', 'Gecikme', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.city ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.assignedRep?.name ?? <span className="text-amber-400">Atanmamış</span>}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(totalDebt(c))}</td>
                    <td className="px-4 py-3">{maxOverdue(c) > 0 ? <DebtAgeBadge dueDate={new Date(Date.now() - maxOverdue(c) * 86400000)} /> : <span className="text-xs text-emerald-400">Güncel</span>}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Müşteri bulunamadı</p>}
          </div>
        </div>
      )}

      {showImport && <CustomerImportModal onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); load() }} />}
    </div>
  )
}
