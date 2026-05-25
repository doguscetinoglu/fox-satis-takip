'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Upload, Download, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Entry = {
  id: string; date: string; amount: number; salesCount: number
  description?: string; repName: string; customerName?: string; customerCode?: string
}
type Rep = { id: string; name: string }
type Customer = { id: string; name: string; code: string }

const now = new Date()
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

export function SatislarPanel() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(defaultMonth)
  const [repFilter, setRepFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ userId: '', customerId: '', amount: '', salesCount: '1', date: new Date().toISOString().split('T')[0], description: '' })
  const [saving, setSaving] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted?: number; errors?: unknown[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ month })
    if (repFilter) params.set('repId', repFilter)
    fetch(`/api/admin/satislar?${params}`).then(r => r.json()).then(d => { setEntries(d); setLoading(false) })
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/temsilciler').then(r => r.json()),
      fetch('/api/admin/musteriler').then(r => r.json()),
    ]).then(([r, c]) => { setReps(r); setCustomers(c) })
  }, [])

  useEffect(() => { load() }, [month, repFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/satislar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), salesCount: Number(form.salesCount) }),
    })
    setSaving(false)
    if (res.ok) { setForm(f => ({ ...f, userId: '', customerId: '', amount: '', salesCount: '1', description: '' })); setShowForm(false); load() }
    else { const d = await res.json(); alert(d.hata) }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/satislar/import', { method: 'POST', body: fd })
    const data = await res.json()
    setImportResult(data)
    if (res.ok) load()
    if (fileRef.current) fileRef.current.value = ''
  }

  const totalRevenue = entries.reduce((s, e) => s + e.amount, 0)
  const totalCount = entries.reduce((s, e) => s + e.salesCount, 0)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none" />
        <select value={repFilter} onChange={e => setRepFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none">
          <option value="">Tüm Temsilciler</option>
          {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <a href="/api/admin/satislar/import?template=true"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Şablon
          </a>
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm hover:bg-emerald-500/10 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Excel Aktar
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Satış Ekle
          </button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
          importResult.errors?.length ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        }`}>
          {importResult.errors?.length ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          <span>
            {importResult.errors?.length
              ? `${importResult.errors.length} satırda hata`
              : `${importResult.inserted} satış başarıyla aktarıldı`}
          </span>
          <button onClick={() => setImportResult(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <h3 className="font-semibold mb-4 text-sm">Yeni Satış Kaydı</h3>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-3">
            <select required value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none">
              <option value="">Temsilci Seç*</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none">
              <option value="">Müşteri Seç (opsiyonel)</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
            <input type="number" placeholder="Tutar (₺)*" required min="0" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none" />
            <input type="number" placeholder="Satış Adedi" min="1" value={form.salesCount}
              onChange={e => setForm(f => ({ ...f, salesCount: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none" />
            <input type="date" required value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none" />
            <input placeholder="Açıklama" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none" />
            <div className="sm:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">İptal</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60 transition-colors">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Toplam Ciro', value: formatCurrency(totalRevenue), color: 'text-blue-500 dark:text-blue-400' },
          { label: 'Satış Adedi', value: totalCount.toLocaleString('tr-TR'), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Kayıt Sayısı', value: entries.length.toString(), color: 'text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tarih</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Temsilci</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tutar</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Adet</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 font-medium">{e.repName}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {e.customerName
                        ? <><p className="font-medium">{e.customerName}</p><p className="text-xs text-muted-foreground font-mono">{e.customerCode}</p></>
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{e.salesCount}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{e.description ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Bu dönemde satış kaydı bulunamadı</p>}
          </div>
        </div>
      )}
    </div>
  )
}
