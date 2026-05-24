'use client'
import { useEffect, useState } from 'react'
import { Plus, TrendingUp, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

type Rep = {
  id: string; name: string; phone: string; isActive: boolean
  todayRevenue: number; monthRevenue: number; target: number
  salesCountTarget: number; assignedCustomers: number
}

export function TemsilcilerPanel() {
  const [reps, setReps] = useState<Rep[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

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

  async function toggleActive(rep: Rep) {
    await fetch(`/api/admin/temsilciler/${rep.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !rep.isActive }) })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Yeni Temsilci
        </button>
      </div>

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
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">İptal</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reps.map((rep, i) => {
            const pct = rep.target > 0 ? Math.min(100, (rep.monthRevenue / rep.target) * 100) : 0
            return (
              <motion.div key={rep.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{rep.name}</p>
                    <p className="text-xs text-muted-foreground">{rep.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rep.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {rep.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                    <button onClick={() => toggleActive(rep)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {rep.isActive ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

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
                    <p className="text-muted-foreground text-xs">Hedef</p>
                    <p className="font-semibold text-blue-400">{formatCurrency(rep.target)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Müşteri</p>
                    <p className="font-semibold flex items-center gap-1"><Users className="w-3 h-3" />{rep.assignedCustomers}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Hedefe İlerleme</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
