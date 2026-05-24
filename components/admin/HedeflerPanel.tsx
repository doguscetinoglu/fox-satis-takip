'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, getMonthKey } from '@/lib/utils'

type Rep = { id: string; name: string }
type Target = { userId: string; revenueTarget: number; salesCountTarget: number; user: { name: string } }

function getMonthOptions() {
  const opts = []
  const now = new Date()
  for (let i = -2; i <= 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    opts.push({ key, label })
  }
  return opts
}

export function HedeflerPanel() {
  const [monthKey, setMonthKey] = useState(getMonthKey())
  const [reps, setReps] = useState<Rep[]>([])
  const [targets, setTargets] = useState<Target[]>([])
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [values, setValues] = useState<Record<string, { revenue: string; count: string }>>({})

  useEffect(() => {
    fetch('/api/admin/temsilciler').then(r => r.json()).then(setReps)
  }, [])

  useEffect(() => {
    fetch(`/api/admin/hedefler?monthKey=${monthKey}`).then(r => r.json()).then((data: Target[]) => {
      setTargets(data)
      const v: Record<string, { revenue: string; count: string }> = {}
      data.forEach(t => { v[t.userId] = { revenue: String(t.revenueTarget), count: String(t.salesCountTarget) } })
      setValues(v)
    })
  }, [monthKey])

  function getValue(repId: string, key: 'revenue' | 'count') {
    return values[repId]?.[key] ?? ''
  }

  function setValue(repId: string, key: 'revenue' | 'count', val: string) {
    setValues(v => ({ ...v, [repId]: { ...v[repId], [key]: val } }))
  }

  async function save(repId: string) {
    setSaving(s => ({ ...s, [repId]: true }))
    await fetch('/api/admin/hedefler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: repId,
        monthKey,
        revenueTarget: Number(values[repId]?.revenue ?? 0),
        salesCountTarget: Number(values[repId]?.count ?? 0),
      }),
    })
    setSaving(s => ({ ...s, [repId]: false }))
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Ay Seç</label>
        <select value={monthKey} onChange={e => setMonthKey(e.target.value)}
          className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500">
          {getMonthOptions().map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reps.map(rep => (
          <div key={rep.id} className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <p className="font-semibold">{rep.name}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ciro Hedefi (₺)</label>
                <input type="number" min="0" value={getValue(rep.id, 'revenue')}
                  onChange={e => setValue(rep.id, 'revenue', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Satış Adedi Hedefi</label>
                <input type="number" min="0" value={getValue(rep.id, 'count')}
                  onChange={e => setValue(rep.id, 'count', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <button onClick={() => save(rep.id)} disabled={saving[rep.id]}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60 transition-colors">
              {saving[rep.id] ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        ))}
      </div>

      {reps.length === 0 && (
        <p className="text-center py-8 text-muted-foreground text-sm">Henüz temsilci eklenmemiş</p>
      )}
    </div>
  )
}
