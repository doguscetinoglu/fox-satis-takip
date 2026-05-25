'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, TrendingUp, Calendar, CreditCard,
  ChevronDown, ChevronUp, SlidersHorizontal, CheckCircle2, Trash2,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

type Payment = {
  id: string; amount: number; paymentDate: string
  method?: string | null; description?: string | null
  customer: {
    id: string; name: string; code: string
    assignedRepId: string | null
    assignedRep: { id: string; name: string } | null
  }
  recordedBy: { name: string }
}

type Customer = { id: string; name: string; code: string }
type Rep      = { id: string; name: string }

const METHOD_CLS: Record<string, string> = {
  'Havale':        'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
  'EFT':           'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400',
  'Nakit':         'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  'Çek':           'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
  'Kredi Kartı':   'bg-pink-500/10 border-pink-500/20 text-pink-700 dark:text-pink-400',
}

const PERIODS = [
  { key: 'all',       label: 'Tümü' },
  { key: 'today',     label: 'Bugün' },
  { key: 'week',      label: 'Bu Hafta' },
  { key: 'month',     label: 'Bu Ay' },
  { key: 'lastMonth', label: 'Geçen Ay' },
  { key: 'year',      label: 'Bu Yıl' },
]

function periodFilter(p: Payment, period: string): boolean {
  const date = new Date(p.paymentDate)
  const now  = new Date()
  const startOf = (y: number, m: number, d = 1) => new Date(y, m, d)
  switch (period) {
    case 'today':     return date >= startOf(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':      return date >= new Date(Date.now() - 7 * 86400000)
    case 'month':     return date >= startOf(now.getFullYear(), now.getMonth())
    case 'lastMonth': return date >= startOf(now.getFullYear(), now.getMonth() - 1) && date < startOf(now.getFullYear(), now.getMonth())
    case 'year':      return date >= startOf(now.getFullYear(), 0)
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
  icon: typeof TrendingUp; color: 'emerald' | 'blue' | 'violet' | 'amber'
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

type SortKey = 'paymentDate' | 'amount'
type SortDir = 'asc' | 'desc'

export function OdemelerPanel() {
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [customers,   setCustomers]   = useState<Customer[]>([])
  const [reps,        setReps]        = useState<Rep[]>([])
  const [loading,     setLoading]     = useState(true)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    customerId: '', amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: '', description: '',
  })
  const [saving,     setSaving]     = useState(false)
  const [formErr,    setFormErr]    = useState('')
  const [saved,      setSaved]      = useState(false)
  const [confirmId,  setConfirmId]  = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filters
  const [search,       setSearch]       = useState('')
  const [filterRep,    setFilterRep]    = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('all')

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('paymentDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/odemeler').then(r => r.json()),
      fetch('/api/admin/musteriler').then(r => r.json()),
      fetch('/api/admin/temsilciler').then(r => r.json()),
    ]).then(([p, c, r]) => {
      setAllPayments(Array.isArray(p) ? p : [])
      setCustomers(Array.isArray(c) ? c : [])
      setReps(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  // Unique methods from data
  const methods = useMemo(() => {
    const set = new Set(allPayments.map(p => p.method).filter(Boolean) as string[])
    return [...set].sort()
  }, [allPayments])

  // Summary stats (full unfiltered dataset)
  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sum = (arr: Payment[]) => arr.reduce((s, p) => s + p.amount, 0)
    const thisMonth = allPayments.filter(p => new Date(p.paymentDate) >= monthStart)
    const today     = allPayments.filter(p => new Date(p.paymentDate) >= todayStart)
    const total     = sum(allPayments)
    const avg       = allPayments.length ? total / allPayments.length : 0
    return {
      total, totalCount: allPayments.length,
      monthTotal: sum(thisMonth), monthCount: thisMonth.length,
      todayTotal: sum(today),     todayCount: today.length,
      avg,
    }
  }, [allPayments])

  // Filtered + sorted
  const displayed = useMemo(() => {
    let list = [...allPayments]

    if (filterPeriod !== 'all') list = list.filter(p => periodFilter(p, filterPeriod))
    if (filterRep)    list = list.filter(p => p.customer.assignedRepId === filterRep)
    if (filterMethod) list = list.filter(p => p.method === filterMethod)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.customer.name.toLowerCase().includes(q) ||
        p.customer.code.toLowerCase().includes(q) ||
        (p.description?.toLowerCase() ?? '').includes(q)
      )
    }

    list.sort((a, b) => {
      const diff = sortKey === 'amount'
        ? a.amount - b.amount
        : new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
      return sortDir === 'asc' ? diff : -diff
    })

    return list
  }, [allPayments, search, filterRep, filterMethod, filterPeriod, sortKey, sortDir])

  const displayedTotal  = displayed.reduce((s, p) => s + p.amount, 0)
  const activeFilters   = [search, filterRep, filterMethod, filterPeriod !== 'all' ? filterPeriod : ''].filter(Boolean).length

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
    setSearch(''); setFilterRep(''); setFilterMethod(''); setFilterPeriod('all')
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/odemeler/${id}`, { method: 'DELETE' })
      if (res.ok) { setConfirmId(null); load() }
    } finally { setDeletingId(null) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setFormErr(''); setSaved(false)
    try {
      const res = await fetch('/api/admin/odemeler', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (res.ok) {
        setForm(f => ({ ...f, customerId: '', amount: '', method: '', description: '' }))
        setSaved(true)
        load()
        setTimeout(() => { setSaved(false); setShowForm(false) }, 1200)
      } else {
        const text = await res.text()
        let msg = 'Ödeme kaydedilemedi'
        try { msg = JSON.parse(text).hata ?? msg } catch {}
        setFormErr(msg)
      }
    } catch { setFormErr('Bağlantı hatası oluştu') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">

      {/* ── Summary cards ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Toplam Tahsilat" icon={TrendingUp} color="emerald"
          value={formatCurrency(stats.total)}
          sub={`${stats.totalCount} kayıt`}
        />
        <StatCard
          title="Bu Ay" icon={Calendar} color="blue"
          value={formatCurrency(stats.monthTotal)}
          sub={`${stats.monthCount} ödeme`}
        />
        <StatCard
          title="Bugün" icon={CheckCircle2} color="violet"
          value={formatCurrency(stats.todayTotal)}
          sub={`${stats.todayCount} ödeme`}
        />
        <StatCard
          title="Ortalama Ödeme" icon={CreditCard} color="amber"
          value={formatCurrency(stats.avg)}
          sub="her ödeme başına"
        />
      </div>

      {/* ── Ödeme Kaydet butonu + form ───────────── */}
      <div>
        <div className="flex justify-end mb-3">
          <button
            onClick={() => { setShowForm(v => !v); setFormErr(''); setSaved(false) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Formu Kapat' : 'Ödeme Kaydet'}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 mb-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Yeni Ödeme Kaydı
                </h3>
                <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-3">
                  <select required value={form.customerId}
                    onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                    <option value="">Müşteri Seç *</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                  </select>
                  <input type="number" placeholder="Tutar (₺) *" required min={0.01} step="0.01"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                  <input type="date" required value={form.paymentDate}
                    onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                    className="px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                    <option value="">Yöntem Seç</option>
                    {['Havale', 'EFT', 'Nakit', 'Çek', 'Kredi Kartı'].map(m =>
                      <option key={m} value={m}>{m}</option>
                    )}
                  </select>
                  <input placeholder="Açıklama" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" />

                  {formErr && (
                    <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                      <X className="w-4 h-4 flex-shrink-0" /> {formErr}
                    </div>
                  )}
                  {saved && (
                    <div className="sm:col-span-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Ödeme başarıyla kaydedildi!
                    </div>
                  )}

                  <div className="sm:col-span-3 flex gap-3 justify-end pt-1">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                      İptal
                    </button>
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
      </div>

      {/* ── Filters ──────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        {/* Row 1: search + rep + clear */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Müşteri adı, kodu veya açıklama..."
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

        {/* Row 2: period chips + method chips */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            {PERIODS.map(p => (
              <Chip key={p.key} active={filterPeriod === p.key} onClick={() => setFilterPeriod(p.key)}>
                {p.label}
              </Chip>
            ))}
          </div>

          {methods.length > 0 && (
            <>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5 flex-wrap">
                <Chip active={filterMethod === ''} onClick={() => setFilterMethod('')}>Tüm Yöntemler</Chip>
                {methods.map(m => (
                  <Chip key={m} active={filterMethod === m} onClick={() => setFilterMethod(m)}>{m}</Chip>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Result bar ───────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{displayed.length}</span> kayıt
          {activeFilters > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
              filtrelendi
            </span>
          )}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Toplam: </span>
          <span className="font-bold color-text-emerald">{formatCurrency(displayedTotal)}</span>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Müşteri</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Temsilci</th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('amount')}
                  >
                    <span className="flex items-center justify-end gap-1">Tutar <SortIcon col="amount" /></span>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('paymentDate')}
                  >
                    <span className="flex items-center gap-1">Tarih <SortIcon col="paymentDate" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Yöntem</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Açıklama</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Kaydeden</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {displayed.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: i < 20 ? i * 0.02 : 0 }}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Müşteri */}
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.customer.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.customer.code}</p>
                      </td>

                      {/* Temsilci */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {p.customer.assignedRep
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-medium">
                              {p.customer.assignedRep.name}
                            </span>
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </td>

                      {/* Tutar */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-base color-text-emerald">{formatCurrency(p.amount)}</span>
                      </td>

                      {/* Tarih */}
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(p.paymentDate)}
                      </td>

                      {/* Yöntem */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {p.method
                          ? <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${METHOD_CLS[p.method] ?? 'bg-muted border-border text-muted-foreground'}`}>
                              {p.method}
                            </span>
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </td>

                      {/* Açıklama */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {p.description
                          ? <span className="text-xs text-muted-foreground max-w-40 truncate block" title={p.description}>
                              {p.description}
                            </span>
                          : <span className="text-xs text-muted-foreground/40">—</span>
                        }
                      </td>

                      {/* Kaydeden */}
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {p.recordedBy.name}
                      </td>

                      {/* Sil */}
                      <td className="px-2 py-3">
                        {confirmId === p.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                              className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold disabled:opacity-60 transition-colors whitespace-nowrap">
                              {deletingId === p.id ? '...' : 'Evet'}
                            </button>
                            <button onClick={() => setConfirmId(null)}
                              className="px-2 py-1 rounded-lg border border-border text-xs hover:bg-muted transition-colors">
                              Hayır
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmId(p.id)}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {displayed.length === 0 && !loading && (
              <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                <Search className="w-8 h-8 opacity-30" />
                <p className="text-sm">Filtrelerle eşleşen ödeme kaydı bulunamadı</p>
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
