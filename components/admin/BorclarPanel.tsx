'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, AlertCircle, Clock, TrendingDown, Flame,
  ChevronDown, ChevronUp, SlidersHorizontal, X,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DebtAgeBadge } from '@/components/ui/DebtAgeBadge'

type Debt = {
  id: string; amount: number
  dueDate: string; documentDate: string
  documentNo?: string; description?: string
  status: string; ageDays: number; ageBucket: string
  customer: {
    id: string; name: string; code: string; phone?: string | null
    assignedRepId: string | null
    assignedRep: { id: string; name: string } | null
  }
}

type Rep = { id: string; name: string }

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Bekliyor', cls: 'status-pending border' },
  PARTIAL:  { label: 'Kısmi',   cls: 'status-partial border' },
  OVERDUE: { label: 'Gecikmiş', cls: 'status-overdue border' },
  PAID:    { label: 'Ödendi',   cls: 'status-paid border' },
}

const BUCKETS = [
  { key: 'all',   label: 'Tüm Vadeler' },
  { key: '0-30',  label: '0-30 Gün' },
  { key: '30-60', label: '30-60 Gün' },
  { key: '60-90', label: '60-90 Gün' },
  { key: '90+',   label: '90+ Gün' },
]

const STATUSES = [
  { key: 'all',     label: 'Tüm Durumlar' },
  { key: 'PENDING', label: 'Bekliyor' },
  { key: 'PARTIAL', label: 'Kısmi Ödendi' },
  { key: 'OVERDUE', label: 'Gecikmiş' },
]

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
  icon: typeof AlertCircle; color: 'blue' | 'red' | 'amber' | 'violet'
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

type SortKey = 'dueDate' | 'amount' | 'ageDays'
type SortDir = 'asc' | 'desc'

export function BorclarPanel() {
  const [allDebts, setAllDebts] = useState<Debt[]>([])
  const [reps, setReps]     = useState<Rep[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search,       setSearch]       = useState('')
  const [filterRep,    setFilterRep]    = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBucket, setFilterBucket] = useState('all')
  const [showPaid,     setShowPaid]     = useState(false)

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('dueDate')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // UI
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/borclar?showPaid=${showPaid}`).then(r => r.json()),
      fetch('/api/admin/temsilciler').then(r => r.json()),
    ]).then(([d, r]) => {
      setAllDebts(Array.isArray(d) ? d : [])
      setReps(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [showPaid])

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id)
    await fetch(`/api/admin/borclar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setAllDebts(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    setUpdatingId(null)
  }

  // Summary stats (always from full non-paid set, ignores filters)
  const stats = useMemo(() => {
    const open     = allDebts.filter(d => d.status !== 'PAID')
    const overdue  = open.filter(d => d.ageDays > 0)
    const critical = open.filter(d => d.ageBucket === '90+')
    const now = Date.now()
    const soon = open.filter(d => {
      const due = new Date(d.dueDate).getTime()
      return due > now && due <= now + 30 * 86400000
    })
    const sum = (arr: Debt[]) => arr.reduce((s, d) => s + d.amount, 0)
    return {
      openTotal: sum(open), openCount: open.length,
      overdueTotal: sum(overdue), overdueCount: overdue.length,
      soonTotal: sum(soon), soonCount: soon.length,
      criticalTotal: sum(critical), criticalCount: critical.length,
    }
  }, [allDebts])

  // Client-side filtering + sorting
  const displayed = useMemo(() => {
    let list = [...allDebts]

    if (!showPaid) list = list.filter(d => d.status !== 'PAID')
    if (filterBucket !== 'all') list = list.filter(d => d.ageBucket === filterBucket)
    if (filterStatus !== 'all') list = list.filter(d => d.status === filterStatus)
    if (filterRep) list = list.filter(d => d.customer.assignedRepId === filterRep)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.customer.name.toLowerCase().includes(q) ||
        d.customer.code.toLowerCase().includes(q) ||
        (d.documentNo?.toLowerCase() ?? '').includes(q) ||
        (d.customer.phone ?? '').includes(q)
      )
    }

    list.sort((a, b) => {
      let diff = 0
      if (sortKey === 'dueDate') diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      else if (sortKey === 'amount') diff = a.amount - b.amount
      else if (sortKey === 'ageDays') diff = a.ageDays - b.ageDays
      return sortDir === 'asc' ? diff : -diff
    })

    return list
  }, [allDebts, search, filterRep, filterStatus, filterBucket, showPaid, sortKey, sortDir])

  const displayedTotal = displayed.reduce((s, d) => s + d.amount, 0)
  const activeFilters  = [
    search, filterRep, filterStatus !== 'all' ? filterStatus : '',
    filterBucket !== 'all' ? filterBucket : '',
  ].filter(Boolean).length

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-muted-foreground/40" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 color-text-blue" />
      : <ChevronDown className="w-3 h-3 color-text-blue" />
  }

  function clearFilters() {
    setSearch(''); setFilterRep(''); setFilterStatus('all'); setFilterBucket('all')
  }

  return (
    <div className="space-y-5">

      {/* ── Summary cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Toplam Açık Borç" icon={TrendingDown} color="blue"
          value={formatCurrency(stats.openTotal)}
          sub={`${stats.openCount} kayıt`}
        />
        <StatCard
          title="Gecikmiş" icon={AlertCircle} color="red"
          value={formatCurrency(stats.overdueTotal)}
          sub={`${stats.overdueCount} kayıt vadesi geçti`}
        />
        <StatCard
          title="30 Gün İçinde Vadesi Bitiyor" icon={Clock} color="amber"
          value={formatCurrency(stats.soonTotal)}
          sub={`${stats.soonCount} borç yaklaşıyor`}
        />
        <StatCard
          title="Kritik (90+ Gün)" icon={Flame} color="violet"
          value={formatCurrency(stats.criticalTotal)}
          sub={`${stats.criticalCount} kritik kayıt`}
        />
      </div>

      {/* ── Filters ──────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
        {/* Row 1: search + rep + paid toggle */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Müşteri adı, kodu, belge no..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={filterRep} onChange={e => setFilterRep(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none min-w-40"
          >
            <option value="">Tüm Temsilciler</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted text-sm transition-colors select-none">
            <input
              type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)}
              className="rounded"
            />
            Ödendi dahil
          </label>

          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/8 text-red-500 text-sm hover:bg-red-500/15 transition-colors">
              <X className="w-3.5 h-3.5" /> Filtreleri Temizle
              <span className="ml-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            </button>
          )}
        </div>

        {/* Row 2: bucket chips + status chips */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            {BUCKETS.map(b => (
              <Chip key={b.key} active={filterBucket === b.key} onClick={() => setFilterBucket(b.key)}>
                {b.label}
              </Chip>
            ))}
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUSES.map(s => (
              <Chip key={s.key} active={filterStatus === s.key} onClick={() => setFilterStatus(s.key)}>
                {s.label}
              </Chip>
            ))}
          </div>
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
          <span className="font-bold">{formatCurrency(displayedTotal)}</span>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Belge</th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('amount')}
                  >
                    <span className="flex items-center justify-end gap-1">Tutar <SortIcon col="amount" /></span>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                    onClick={() => toggleSort('dueDate')}
                  >
                    <span className="flex items-center gap-1">Vade <SortIcon col="dueDate" /></span>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => toggleSort('ageDays')}
                  >
                    <span className="flex items-center gap-1">Gecikme <SortIcon col="ageDays" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {displayed.map((d, i) => {
                    const st = STATUS_MAP[d.status] ?? STATUS_MAP.PENDING
                    const isUpdating = updatingId === d.id
                    return (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: i < 20 ? i * 0.02 : 0 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Müşteri */}
                        <td className="px-4 py-3">
                          <p className="font-medium">{d.customer.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{d.customer.code}</p>
                          {d.customer.phone && (
                            <p className="text-xs text-muted-foreground hidden md:block">{d.customer.phone}</p>
                          )}
                        </td>

                        {/* Temsilci */}
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {d.customer.assignedRep
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-medium">{d.customer.assignedRep.name}</span>
                            : <span className="text-xs text-muted-foreground/60">—</span>
                          }
                        </td>

                        {/* Belge */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="font-mono text-xs">{d.documentNo ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(d.documentDate)}</p>
                          {d.description && (
                            <p className="text-xs text-muted-foreground/70 max-w-32 truncate" title={d.description}>
                              {d.description}
                            </p>
                          )}
                        </td>

                        {/* Tutar */}
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${d.ageDays > 0 ? 'color-text-red' : 'color-text-blue'}`}>
                            {formatCurrency(d.amount)}
                          </span>
                        </td>

                        {/* Vade */}
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                          {formatDate(d.dueDate)}
                        </td>

                        {/* Gecikme */}
                        <td className="px-4 py-3">
                          {d.ageDays > 0
                            ? <DebtAgeBadge dueDate={d.dueDate} />
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">Güncel</span>
                          }
                        </td>

                        {/* Durum badge */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>

                        {/* Durum değiştir */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={d.status}
                              disabled={isUpdating}
                              onChange={e => updateStatus(d.id, e.target.value)}
                              className={`text-xs px-2 py-1.5 pr-6 rounded-lg border bg-background border-border focus:outline-none focus:ring-1 focus:ring-blue-500/30 appearance-none cursor-pointer transition-opacity ${isUpdating ? 'opacity-40' : ''}`}
                            >
                              <option value="PENDING">Bekliyor</option>
                              <option value="PARTIAL">Kısmi</option>
                              <option value="OVERDUE">Gecikmiş</option>
                              <option value="PAID">Ödendi</option>
                            </select>
                            {isUpdating && (
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {displayed.length === 0 && !loading && (
              <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                <Search className="w-8 h-8 opacity-30" />
                <p className="text-sm">Filtrelerle eşleşen borç kaydı bulunamadı</p>
                {activeFilters > 0 && (
                  <button onClick={clearFilters}
                    className="text-sm text-blue-500 hover:underline">
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
