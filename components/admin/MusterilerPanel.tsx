'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus, Upload, Download, Search, Trash2, ChevronDown, Check, Users, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

type NewForm = {
  code: string; name: string; type: string
  phone: string; email: string
  city: string; address: string; district: string; postalCode: string
  taxNumber: string; taxOffice: string
  assignedRepId: string
}

const EMPTY_FORM: NewForm = {
  code: '', name: '', type: '',
  phone: '', email: '',
  city: '', address: '', district: '', postalCode: '',
  taxNumber: '', taxOffice: '',
  assignedRepId: '',
}

function NewCustomerDrawer({ reps, onClose, onSaved }: { reps: Rep[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<NewForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (overlayRef.current === e.target) onClose() }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [onClose])

  function set(k: keyof NewForm, v: string) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim()) { setError('Müşteri kodu zorunludur'); return }
    if (!form.name.trim()) { setError('Müşteri adı zorunludur'); return }
    setSaving(true); setError('')
    const body: Record<string, string | null> = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type || null,
      phone: form.phone || null,
      email: form.email || null,
      city: form.city || null,
      address: form.address || null,
      district: form.district || null,
      postalCode: form.postalCode || null,
      taxNumber: form.taxNumber || null,
      taxOffice: form.taxOffice || null,
      assignedRepId: form.assignedRepId || null,
    }
    const res = await fetch('/api/admin/musteriler', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) { onSaved(); onClose() }
    else { const d = await res.json().catch(() => ({})); setError(d.hata ?? 'Bir hata oluştu') }
  }

  const inp = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 transition-colors'
  const lbl = 'block text-xs font-medium text-muted-foreground mb-1.5'

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base">Yeni Müşteri Ekle</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tüm alanları doldurmanız zorunlu değil</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Müşteri Tipi */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Müşteri Tipi</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: 'BIREYSEL', l: 'Bireysel', e: '👤' }, { v: 'KURUMSAL', l: 'Kurumsal', e: '🏢' }].map(t => (
                <button key={t.v} type="button" onClick={() => set('type', form.type === t.v ? '' : t.v)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all text-center ${form.type === t.v ? 'border-blue-500 bg-blue-500/10 color-text-blue' : 'border-border hover:border-blue-500/50 hover:bg-muted/50'}`}>
                  <span className="text-lg block mb-1">{t.e}</span>{t.l}
                </button>
              ))}
            </div>
          </section>

          {/* Temel Bilgiler */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Müşteri Kodu *</label>
                <input className={inp} value={form.code} onChange={e => set('code', e.target.value)} placeholder="MST-001" />
              </div>
              <div>
                <label className={lbl}>Müşteri Adı / Ünvan *</label>
                <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ad Soyad veya Firma" />
              </div>
            </div>
          </section>

          {/* İletişim */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">İletişim</h3>
            <div>
              <label className={lbl}>Telefon</label>
              <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="05XX XXX XX XX" type="tel" />
            </div>
            <div>
              <label className={lbl}>E-posta</label>
              <input className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="ornek@firma.com" type="email" />
            </div>
          </section>

          {/* Adres */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adres</h3>
            <div>
              <label className={lbl}>Açık Adres</label>
              <input className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Sokak, Mahalle, No..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>İlçe</label>
                <input className={inp} value={form.district} onChange={e => set('district', e.target.value)} placeholder="İlçe" />
              </div>
              <div>
                <label className={lbl}>Şehir</label>
                <input className={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="İstanbul" />
              </div>
            </div>
            <div>
              <label className={lbl}>Posta Kodu</label>
              <input className={inp} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="34000" />
            </div>
          </section>

          {/* Vergi / Yasal */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vergi / Yasal</h3>
            <div>
              <label className={lbl}>{form.type === 'BIREYSEL' ? 'TC Kimlik No' : 'Vergi No'}</label>
              <input className={inp} value={form.taxNumber} onChange={e => set('taxNumber', e.target.value)}
                placeholder={form.type === 'BIREYSEL' ? '12345678901' : '1234567890'} />
            </div>
            <div>
              <label className={lbl}>Vergi Dairesi</label>
              <input className={inp} value={form.taxOffice} onChange={e => set('taxOffice', e.target.value)} placeholder="Kadıköy VD" />
            </div>
          </section>

          {/* Temsilci */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temsilci Ataması</h3>
            <select className={inp} value={form.assignedRepId} onChange={e => set('assignedRepId', e.target.value)}>
              <option value="">Atanmamış (tüm temsilciler görür)</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </section>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl border color-card-red text-sm color-text-red">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <button onClick={handleSave as unknown as React.MouseEventHandler}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Kaydediliyor...</>
              : 'Müşteri Ekle'
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

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

      <AnimatePresence>
        {showForm && (
          <NewCustomerDrawer
            reps={reps}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); load() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
