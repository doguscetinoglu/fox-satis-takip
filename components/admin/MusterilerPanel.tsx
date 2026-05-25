'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus, Upload, Download, Search, Trash2, ChevronDown, Check, Users } from 'lucide-react'
import { formatCurrency, getDebtAgeDays } from '@/lib/utils'
import { DebtAgeBadge } from '@/components/ui/DebtAgeBadge'
import { CustomerImportModal } from './CustomerImportModal'
import { CustomerDetailModal } from './CustomerDetailModal'

type Customer = {
  id: string; code: string; name: string; type?: string | null
  phone?: string | null; email?: string | null
  taxNumber?: string | null; taxOffice?: string | null
  address?: string | null; district?: string | null
  city?: string | null; postalCode?: string | null
  assignedRepId: string | null
  assignedRep: { name: string } | null
  debts: { amount: number; dueDate: string; status: string }[]
}

type Rep = { id: string; name: string }

function RepPopover({ customer, reps, onAssign, busy }: {
  customer: Customer; reps: Rep[]
  onAssign: (repId: string) => void; busy: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const assigned = customer.assignedRep?.name

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        disabled={busy}
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-90 border
          ${assigned
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
          } ${busy ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      >
        {busy
          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-0.5" />
          : null
        }
        {assigned ?? 'Atanmamış'}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-52 rounded-2xl border border-border bg-card shadow-xl shadow-black/15 overflow-hidden">
          <div className="p-1.5 space-y-0.5">
            {/* Atanmamış */}
            <button
              onClick={() => { onAssign(''); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-colors hover:bg-muted
                ${!customer.assignedRepId ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${!customer.assignedRepId ? 'border-amber-500 bg-amber-500' : 'border-border'}`}>
                {!customer.assignedRepId && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              Atanmamış
              <span className="text-xs text-muted-foreground ml-auto">Hepsi</span>
            </button>

            {reps.length > 0 && <div className="h-px bg-border mx-2 my-1" />}

            {reps.map(r => (
              <button key={r.id}
                onClick={() => { onAssign(r.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left transition-colors hover:bg-muted
                  ${customer.assignedRepId === r.id ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${customer.assignedRepId === r.id ? 'border-blue-500 bg-blue-500' : 'border-border'}`}>
                  {customer.assignedRepId === r.id && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterRep) params.set('repId', filterRep)
    Promise.all([
      fetch(`/api/admin/musteriler?${params}`).then(r => r.json()),
      fetch('/api/admin/temsilciler').then(r => r.json()),
    ]).then(([c, r]) => { setCustomers(Array.isArray(c) ? c : []); setReps(Array.isArray(r) ? r : []); setLoading(false) })
  }

  useEffect(() => { load() }, [filterRep])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/musteriler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) { setForm({ code: '', name: '', phone: '', city: '', assignedRepId: '' }); setShowForm(false); load() }
    else { const d = await res.json(); alert(d.hata) }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return
    await fetch(`/api/admin/musteriler/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleAssign(customerId: string, repId: string) {
    setAssigningId(customerId)
    await fetch(`/api/admin/musteriler/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedRepId: repId || null }),
    })
    setAssigningId(null)
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c
      const rep = reps.find(r => r.id === repId) ?? null
      return { ...c, assignedRepId: repId || null, assignedRep: rep ? { name: rep.name } : null }
    }))
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
          <option value="__unassigned__">Atanmamış</option>
          {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button onClick={() => window.open('/api/admin/musteriler/import?template=true')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
          <Download className="w-4 h-4" /> Şablon
        </button>
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm transition-colors">
          <Upload className="w-4 h-4" /> Excel
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
              <option value="">Temsilci Seç (Opsiyonel)</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="sm:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">İptal</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
        <Users className="w-3.5 h-3.5 flex-shrink-0" />
        Atanmamış müşteriler tüm temsilcilerde görünür. Temsilciye bağlandığında yalnızca o temsilcide görünür.
        <span className="ml-1 text-muted-foreground">· Müşteri satırına tıklayarak detay &amp; düzenleme yapabilirsiniz.</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Kod</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Şehir</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Temsilci</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Açık Borç</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Gecikme</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">{c.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium group-hover:text-blue-500 transition-colors">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.city ?? '-'}</td>
                    <td className="px-4 py-3">
                      <RepPopover
                        customer={c}
                        reps={reps}
                        busy={assigningId === c.id}
                        onAssign={repId => handleAssign(c.id, repId)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(totalDebt(c))}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {maxOverdue(c) > 0
                        ? <DebtAgeBadge dueDate={new Date(Date.now() - maxOverdue(c) * 86400000)} />
                        : <span className="text-xs text-emerald-400">Güncel</span>
                      }
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={e => handleDelete(e, c.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Müşteri bulunamadı</p>
            )}
          </div>
        </div>
      )}

      {showImport && (
        <CustomerImportModal onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); load() }} />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          reps={reps}
          onClose={() => setSelectedCustomer(null)}
          onSaved={() => { load(); setSelectedCustomer(null) }}
        />
      )}
    </div>
  )
}
