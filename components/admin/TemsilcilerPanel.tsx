'use client'
import { useEffect, useState, useRef } from 'react'
import {
  Plus, TrendingUp, Users, ChevronDown, ChevronUp,
  Pencil, X, Check, Eye, EyeOff, AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

type Rep = {
  id: string; name: string; phone: string; isActive: boolean
  todayRevenue: number; monthRevenue: number; target: number
  salesCountTarget: number; assignedCustomers: number
}

type EditForm = {
  name: string; phone: string
  revenueTarget: string; salesCountTarget: string
  password: string; confirmPassword: string
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b'
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full" style={{ background: color }} />
    </div>
  )
}

function RepEditDrawer({ rep, onClose, onSaved }: { rep: Rep; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<EditForm>({
    name: rep.name,
    phone: rep.phone,
    revenueTarget: rep.target > 0 ? String(rep.target) : '',
    salesCountTarget: rep.salesCountTarget > 0 ? String(rep.salesCountTarget) : '',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current === e.target) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function set(k: keyof EditForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }
    if (form.password && form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {}
    if (form.name !== rep.name) payload.name = form.name
    if (form.phone !== rep.phone) payload.phone = form.phone
    const rt = Number(form.revenueTarget) || 0
    const sc = Number(form.salesCountTarget) || 0
    if (rt !== rep.target) payload.revenueTarget = rt
    if (sc !== rep.salesCountTarget) payload.salesCountTarget = sc
    if (form.password) payload.password = form.password

    if (Object.keys(payload).length === 0) { setSaving(false); onClose(); return }

    const res = await fetch(`/api/admin/temsilciler/${rep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { onSaved(); onClose() }, 900)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.hata ?? 'Bir hata oluştu')
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 transition-colors'
  const labelCls = 'block text-xs font-medium text-muted-foreground mb-1.5'

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">Temsilci Düzenle</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{rep.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Temel Bilgiler */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temel Bilgiler</h3>
            <div>
              <label className={labelCls}>Ad Soyad</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ad Soyad" required minLength={2} />
            </div>
            <div>
              <label className={labelCls}>Telefon</label>
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="05XX XXX XX XX" type="tel" />
            </div>
          </section>

          {/* Hedef Bilgileri */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bu Ay Hedefleri</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ciro Hedefi (₺)</label>
                <input className={inputCls} value={form.revenueTarget} onChange={e => set('revenueTarget', e.target.value)}
                  placeholder="0" type="number" min="0" step="1" />
              </div>
              <div>
                <label className={labelCls}>Satış Adedi Hedefi</label>
                <input className={inputCls} value={form.salesCountTarget} onChange={e => set('salesCountTarget', e.target.value)}
                  placeholder="0" type="number" min="0" step="1" />
              </div>
            </div>
          </section>

          {/* Şifre */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Şifre Değiştir</h3>
            <p className="text-xs text-muted-foreground -mt-2">Boş bırakılırsa mevcut şifre korunur.</p>
            <div>
              <label className={labelCls}>Yeni Şifre</label>
              <div className="relative">
                <input className={inputCls + ' pr-10'} value={form.password} onChange={e => set('password', e.target.value)}
                  type={showPw ? 'text' : 'password'} placeholder="En az 6 karakter" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {form.password && (
              <div>
                <label className={labelCls}>Şifre Tekrar</label>
                <input className={inputCls} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  type={showPw ? 'text' : 'password'} placeholder="Şifreyi tekrar girin" />
              </div>
            )}
          </section>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl border color-card-red text-sm color-text-red">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button onClick={handleSave as unknown as React.MouseEventHandler}
            disabled={saving || success}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
            {success
              ? <><Check className="w-4 h-4" /> Kaydedildi</>
              : saving
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Kaydediliyor...</>
                : 'Değişiklikleri Kaydet'
            }
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function TemsilcilerPanel() {
  const [reps, setReps] = useState<Rep[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editRep, setEditRep] = useState<Rep | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/temsilciler').then(r => r.json()).then(d => { setReps(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/admin/temsilciler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { setForm({ name: '', phone: '', password: '' }); setShowForm(false); load() }
    else { const d = await res.json(); alert(d.hata) }
  }

  async function toggleActive(rep: Rep, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/admin/temsilciler/${rep.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !rep.isActive }) })
    load()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Yeni Temsilci
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
            <h3 className="font-semibold mb-4">Yeni Temsilci Ekle</h3>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-4">
              {[
                { k: 'name', p: 'Ad Soyad', t: 'text' },
                { k: 'phone', p: 'Telefon', t: 'tel' },
                { k: 'password', p: 'Şifre (min 6)', t: 'password' },
              ].map(({ k, p, t }) => (
                <input key={k} type={t} placeholder={p} required value={form[k as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500" />
              ))}
              <div className="sm:col-span-3 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">İptal</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rep cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reps.map((rep, i) => {
            const pct = rep.target > 0 ? Math.min(100, (rep.monthRevenue / rep.target) * 100) : 0
            return (
              <motion.div key={rep.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-card space-y-4">

                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{rep.name}</p>
                    <p className="text-xs text-muted-foreground">{rep.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rep.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {rep.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <button onClick={(e) => toggleActive(rep, e)}
                      title={rep.isActive ? 'Pasife Al' : 'Aktife Al'}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      {rep.isActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditRep(rep)}
                      title="Düzenle"
                      className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors text-muted-foreground hover:text-blue-400">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Bugün</p>
                    <p className="font-semibold text-emerald-400">{formatCurrency(rep.todayRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Bu Ay</p>
                    <p className="font-semibold">{formatCurrency(rep.monthRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ciro Hedefi</p>
                    <p className="font-semibold text-blue-400">
                      {rep.target > 0 ? formatCurrency(rep.target) : <span className="text-muted-foreground text-xs">—</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Müşteri</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3" />{rep.assignedCustomers}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Hedefe İlerleme</span>
                    <span>{rep.target > 0 ? `%${pct.toFixed(0)}` : 'Hedef yok'}</span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Edit drawer */}
      <AnimatePresence>
        {editRep && (
          <RepEditDrawer
            key={editRep.id}
            rep={editRep}
            onClose={() => setEditRep(null)}
            onSaved={() => { setEditRep(null); load() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
