'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Upload, Download, X, Search, SlidersHorizontal,
  TrendingUp, ShoppingCart, BarChart3, Zap,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Entry = {
  id: string; date: string; amount: number; salesCount: number
  description?: string | null; repName: string
  customerName?: string | null; customerCode?: string | null
}
type Rep      = { id: string; name: string }
type Customer = { id: string; name: string; code: string }

const now = new Date()
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const PERIODS = [
  { key: 'all',       label: 'Tümü' },
  { key: 'week',      label: 'Bu Hafta' },
  { key: 'month',     label: 'Bu Ay' },
  { key: 'lastMonth', label: 'Geçen Ay' },
  { key: 'year',      label: 'Bu Yıl' },
  { key: 'custom',    label: 'Ay Seç' },
]

function periodMatch(e: Entry, period: string, customMonth: string): boolean {
  const date = new Date(e.date)
  const n = new Date()
  switch (period) {
    case 'week':      return date >= new Date(Date.now() - 7 * 86400000)
    case 'month':     return date >= new Date(n.getFullYear(), n.getMonth(), 1)
    case 'lastMonth': return date >= new Date(n.getFullYear(), n.getMonth() - 1, 1)
                        && date < new Date(n.getFullYear(), n.getMonth(), 1)
    case 'year':      return date >= new Date(n.getFullYear(), 0, 1)
    case 'custom':    return customMonth ? e.date.startsWith(customMonth) : true
    default:          return true
  }
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
        ${active ? 'bg-blue-600 text-white shadow-sm' : 'border border-border hover:bg-muted text-muted-foreground'}`}>
      {children}
    </button>
  )
}

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub: string
  icon: typeof TrendingUp; color: 'blue' | 'emerald' | 'violet' | 'amber'
}) {
  return (
    <div className={`p-4 rounded-2xl border color-card-${color} space-y-1`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className={`p-1.5 rounded-lg color-icon-${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className={`text-xl font-bold tracking-tight color-text-${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

type SortKey = 'date' | 'amount' | 'salesCount'
type SortDir = 'asc' | 'desc'

export function SatislarPanel() {
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [reps,       setReps]       = useState<Rep[]>([])
  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [loading,    setLoading]    = useState(true)

  // Filters
  const [search,       setSearch]       = useState('')
  const [filterRep,    setFilterRep]    = useState('')
  const [filterPeriod, setFilterPeriod] = useState('month')
  const [customMonth,  setCustomMonth]  = useState(defaultMonth)

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Form
  const [showForm,   setShowForm]   = useState(false)
  const [form, setForm] = useState({
    userId: '', customerId: '', amount: '', salesCount: '1',
    date: new Date().toISOString().split('T')[0], description: '',
  })
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState('')
  const [saved,   setSaved]   = useState(false)

  // Import
  const [importResult, setImportResult] = useState<{ inserted?: number; errors?: unknown[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/satislar').then(r => r.json()),
      fetch('/api/admin/temsilciler').then(r => r.json()),
      fetch('/api/admin/musteriler').then(r => r.json()),
    ]).then(([e, r, c]) => {
      setAllEntries(Array.isArray(e) ? e : [])
      setReps(Array.isArray(r) ? r : [])
      setCustomers(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  // Summary stats — always from full unfiltered dataset
  const stats = useMemo(() => {
    const n = new Date()
    const thisMonthStart = new Date(n.getFullYear(), n.getMonth(), 1)
    const thisMonth = allEntries.filter(e => new Date(e.date) >= thisMonthStart)
    const sumAmt  = (arr: Entry[]) => arr.reduce((s, e) => s + e.amount, 0)
    const sumCnt  = (arr: Entry[]) => arr.reduce((s, e) => s + e.salesCount, 0)
    const maxAmt  = allEntries.length ? Math.max(...allEntries.map(e => e.amount)) : 0
    return {
      monthTotal: sumAmt(thisMonth),  monthCount: thisMonth.length,
      total: sumAmt(allEntries),       totalCount: allEntries.length,
      salesCount: sumCnt(allEntries),
      maxAmount: maxAmt,
    }
  }, [allEntries])

  // Filtered + sorted
  const displayed = useMemo(() => {
    let list = [...allEntries]

    list = list.filter(e => periodMatch(e, filterPeriod, customMonth))
    if (filterRep) list = list.filter(e => {
      const rep = reps.find(r => r.id === filterRep)
      return rep ? e.repName === rep.name : true
    })
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.repName.toLowerCase().includes(q) ||
        (e.customerName?.toLowerCase() ?? '').includes(q) ||
        (e.customerCode?.toLowerCase() ?? '').includes(q) ||
        (e.description?.toLowerCase() ?? '').includes(q)
      )
    }

    list.sort((a, b) => {
      let diff = 0
      if (sortKey === 'date')       diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      else if (sortKey === 'amount')     diff = a.amount - b.amount
      else if (sortKey === 'salesCount') diff = a.salesCount - b.salesCount
      return sortDir === 'asc' ? diff : -diff
    })

    return list
  }, [allEntries, filterPeriod, customMonth, filterRep, search, reps, sortKey, sortDir])

  const displayedTotal      = displayed.reduce((s, e) => s + e.amount, 0)
  const displayedSalesCount = displayed.reduce((s, e) => s + e.salesCount, 0)
  const activeFilters = [
    search, filterRep,
    filterPeriod !== 'all' ? filterPeriod : '',
  ].filter(Boolean).length

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 color-text-blue" />
      : <ChevronDown className="w-3 h-3 color-text-blue" />
  }

  function clearFilters() {
    setSearch(''); setFilterRep(''); setFilterPeriod('month')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setFormErr(''); setSaved(false)
    try {
      const res = await fetch('/api/admin/satislar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount), salesCount: Number(form.salesCount) }),
      })
      if (res.ok) {
        setForm(f => ({ ...f, userId: '', customerId: '', amount: '', salesCount: '1', description: '' }))
        setSaved(true)
        load()
        setTimeout(() => { setSaved(false); setShowForm(false) }, 1200)
      } else {
        const d = await res.json()
        setFormErr(d.hata ?? 'Kayıt başarısız')
      }
    } catch { setFormErr('Bağlantı hatası') }
    finally { setSaving(false) }
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

  return (
    <div className="space-y-5">

      {/* ── Summary cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Bu Ay Ciro" icon={TrendingUp} color="blue"
          value={formatCurrency(stats.monthTotal)}
          sub={`${stats.monthCount} kayıt`}
        />
        <StatCard
          title="Toplam Ciro" icon={BarChart3} color="emerald"
          value={formatCurrency(stats.total)}
          sub={`${stats.totalCount} tüm kayıtlar`}
        />
        <StatCard
          title="Satış Adedi" icon={ShoppingCart} color="violet"
          value={stats.salesCount.toLocaleString('tr-TR')}
          sub="toplam gerçekleşen satış"
        />
        <StatCard
          title="En Yüksek Satış" icon={Zap} color="amber"
          value={formatCurrency(stats.maxAmount)}
          sub="tek işlem rekoru"
        />
      </div>

      {/* ── Actions row ──────────────────────────── */}
      <div className="flex flex-wrap gap-2 justify-end">
        <a href="/api/admin/satislar/import?template=true"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Şablon İndir
        </a>
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm hover:bg-emerald-500/10 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" /> Excel Aktar
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </label>
        <button
          onClick={() => { setShowForm(v => !v); setFormErr(''); setSaved(false) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
          <Plus className="w-4 h-4" />
          {showForm ? 'Formu Kapat' : 'Satış Ekle'}
        </button>
      </div>

      {/* Import result */}
      <AnimatePresence>
        {importResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${
              importResult.errors?.length
                ? 'border-red-500/30 bg-red-500/10 text-red-500'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
            {importResult.errors?.length
              ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>
              {importResult.errors?.length
                ? `${importResult.errors.length} satırda hata oluştu`
                : `${importResult.inserted} satış başarıyla aktarıldı`}
            </span>
            <button onClick={() => setImportResult(null)} className="ml-auto p-1 hover:opacity-60 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Yeni Satış Kaydı
              </h3>
              <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-3">
                <select required value={form.userId}
                  onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                  <option value="">Temsilci Seç *</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={form.customerId}
                  onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                  <option value="">Müşteri Seç (opsiyonel)</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
                <input type="number" placeholder="Tutar (₺) *" required min="0" step="0.01"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                <input type="number" placeholder="Satış Adedi" min="1"
                  value={form.salesCount} onChange={e => setForm(f => ({ ...f, salesCount: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                <input type="date" required value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                <input placeholder="Açıklama"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />

                {formErr && (
                  <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    <X className="w-4 h-4 flex-shrink-0" /> {formErr}
                  </div>
                )}
                {saved && (
                  <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Satış başarıyla kaydedildi!
                  </div>
                )}
                <div className="sm:col-span-3 flex gap-3 justify-end pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">İptal</button>
                  <button type="submit" disabled={saving}
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-60 shadow-lg shadow-blue-500/20 transition-all">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ──────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        {/* Row 1: search + rep + clear */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Temsilci, müşteri veya açıklama ara..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <select value={filterRep} onChange={e => setFilterRep(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none min-w-40">
            <option value="">Tüm Temsilciler</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/8 text-red-500 text-sm hover:bg-red-500/15 transition-colors">
              <X className="w-3.5 h-3.5" /> Temizle
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            </button>
          )}
        </div>

        {/* Row 2: period chips + optional month picker */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          {PERIODS.map(p => (
            <Chip key={p.key} active={filterPeriod === p.key} onClick={() => setFilterPeriod(p.key)}>
              {p.label}
            </Chip>
          ))}
          {filterPeriod === 'custom' && (
            <input type="month" value={customMonth} onChange={e => setCustomMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-blue-500" />
          )}
        </div>
      </div>

      {/* ── Result bar ───────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span><span className="font-medium text-foreground">{displayed.length}</span> kayıt</span>
          <span className="text-muted-foreground/40">·</span>
          <span><span className="font-medium text-foreground">{displayedSalesCount.toLocaleString('tr-TR')}</span> satış adedi</span>
          {activeFilters > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
              filtrelendi
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Toplam: </span>
          <span className="font-bold color-text-blue">{formatCurrency(displayedTotal)}</span>
        </div>
      </div>

      {/* ── Table ───────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('date')}
                  >
                    <span className="flex items-center gap-1">Tarih <SortIcon col="date" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Temsilci</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Müşteri</th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('amount')}
                  >
                    <span className="flex items-center justify-end gap-1">Tutar <SortIcon col="amount" /></span>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                    onClick={() => toggleSort('salesCount')}
                  >
                    <span className="flex items-center gap-1">Adet <SortIcon col="salesCount" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {displayed.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: i < 20 ? i * 0.02 : 0 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-medium">
                          {e.repName}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {e.customerName
                          ? <div>
                              <p className="font-medium text-sm">{e.customerName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{e.customerCode}</p>
                            </div>
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold color-text-blue">{formatCurrency(e.amount)}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
                          {e.salesCount} adet
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {e.description
                          ? <span className="text-xs text-muted-foreground max-w-48 truncate block" title={e.description}>
                              {e.description}
                            </span>
                          : <span className="text-xs text-muted-foreground/40">—</span>
                        }
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {displayed.length === 0 && !loading && (
              <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                <Search className="w-8 h-8 opacity-30" />
                <p className="text-sm">Filtrelerle eşleşen satış kaydı bulunamadı</p>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-sm text-blue-500 hover:underline">
                    Filtreleri temizle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
