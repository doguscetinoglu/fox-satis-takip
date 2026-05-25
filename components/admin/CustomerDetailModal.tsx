'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Save, User, MapPin, FileText, UserCheck,
  CheckCircle2, AlertCircle, Building2, Loader2,
} from 'lucide-react'

type CustomerFull = {
  id: string; code: string; name: string; type?: string | null
  phone?: string | null; email?: string | null
  taxNumber?: string | null; taxOffice?: string | null
  address?: string | null; district?: string | null
  city?: string | null; postalCode?: string | null
  assignedRepId?: string | null
  assignedRep?: { name: string } | null
}
type Rep = { id: string; name: string }

function Field({ label, value, onChange, type = 'text', textarea, half }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; textarea?: boolean; half?: boolean
}) {
  const cls = `w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all`
  return (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {textarea
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={`${cls} resize-none`} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} />
      }
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <Icon className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

export function CustomerDetailModal({ customer, reps, onClose, onSaved }: {
  customer: CustomerFull; reps: Rep[]; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: customer.name ?? '',
    type: customer.type ?? 'KURUMSAL',
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    taxNumber: customer.taxNumber ?? '',
    taxOffice: customer.taxOffice ?? '',
    address: customer.address ?? '',
    district: customer.district ?? '',
    city: customer.city ?? '',
    postalCode: customer.postalCode ?? '',
    assignedRepId: customer.assignedRepId ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const [errMsg, setErrMsg] = useState('')

  function set(k: keyof typeof form) {
    return (v: string) => setForm(f => ({ ...f, [k]: v }))
  }

  async function save() {
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch(`/api/admin/musteriler/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assignedRepId: form.assignedRepId || null,
          phone: form.phone || null,
          email: form.email || null,
          taxNumber: form.taxNumber || null,
          taxOffice: form.taxOffice || null,
          address: form.address || null,
          district: form.district || null,
          city: form.city || null,
          postalCode: form.postalCode || null,
          type: form.type || null,
        }),
      })
      if (res.ok) { setStatus('ok'); onSaved() }
      else {
        const t = await res.text()
        try { setErrMsg(JSON.parse(t).hata ?? 'Kayıt başarısız') } catch { setErrMsg('Kayıt başarısız') }
        setStatus('err')
      }
    } catch { setErrMsg('Bağlantı hatası'); setStatus('err') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-lg bg-card border-l border-border flex flex-col h-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="min-w-0">
            <h2 className="font-bold text-lg truncate">{customer.name}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{customer.code}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors flex-shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">

          {/* Müşteri Tipi */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'KURUMSAL', label: 'Kurumsal', sub: 'Vergi Kimlik No (10 hane)', icon: Building2 },
              { val: 'BIREYSEL', label: 'Bireysel', sub: 'TC Kimlik No (11 hane)', icon: User },
            ].map(({ val, label, sub, icon: Icon }) => (
              <button key={val} type="button"
                onClick={() => setForm(f => ({ ...f, type: val }))}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all
                  ${form.type === val
                    ? 'border-blue-500 bg-blue-500/8 ring-1 ring-blue-500/20'
                    : 'border-border hover:border-blue-500/40 hover:bg-muted/40'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                  ${form.type === val ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${form.type === val ? 'text-blue-600 dark:text-blue-400' : ''}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Temel Bilgiler */}
          <Section title="Temel Bilgiler" icon={User}>
            <Field label="Müşteri Adı / Ticari Unvan" value={form.name} onChange={set('name')} />
            <Field label="Telefon" value={form.phone} onChange={set('phone')} type="tel" half />
            <Field label="E-posta" value={form.email} onChange={set('email')} type="email" half />
          </Section>

          {/* Vergi / Yasal Bilgiler */}
          <Section title="Vergi / Yasal Bilgiler" icon={FileText}>
            <Field
              label={form.type === 'BIREYSEL' ? 'TC Kimlik No' : 'Vergi Kimlik No (VKN)'}
              value={form.taxNumber} onChange={set('taxNumber')} half
            />
            <Field label="Vergi Dairesi" value={form.taxOffice} onChange={set('taxOffice')} half />
          </Section>

          {/* Adres */}
          <Section title="Adres Bilgileri" icon={MapPin}>
            <Field label="İl / Şehir" value={form.city} onChange={set('city')} half />
            <Field label="İlçe" value={form.district} onChange={set('district')} half />
            <Field label="Posta Kodu" value={form.postalCode} onChange={set('postalCode')} half />
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Açık Adres</label>
              <textarea rows={2} value={form.address} onChange={e => set('address')(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none" />
            </div>
          </Section>

          {/* Temsilci Ataması */}
          <Section title="Satış Temsilcisi" icon={UserCheck}>
            <div className="col-span-2 space-y-2">
              <button
                onClick={() => setForm(f => ({ ...f, assignedRepId: '' }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                  ${!form.assignedRepId
                    ? 'border-amber-500/60 bg-amber-500/8 ring-1 ring-amber-500/20'
                    : 'border-border hover:bg-muted/50'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${!form.assignedRepId ? 'border-amber-500 bg-amber-500' : 'border-border'}`}>
                  {!form.assignedRepId && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${!form.assignedRepId ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                    Atanmamış
                  </p>
                  <p className="text-xs text-muted-foreground">Tüm temsilcilerde görünür</p>
                </div>
              </button>

              {reps.map(r => (
                <button key={r.id}
                  onClick={() => setForm(f => ({ ...f, assignedRepId: r.id }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                    ${form.assignedRepId === r.id
                      ? 'border-blue-500/60 bg-blue-500/8 ring-1 ring-blue-500/20'
                      : 'border-border hover:bg-muted/50'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                    ${form.assignedRepId === r.id ? 'border-blue-500 bg-blue-500' : 'border-border'}`}>
                    {form.assignedRepId === r.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <p className={`text-sm font-medium ${form.assignedRepId === r.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {r.name}
                  </p>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-card space-y-3">
          {status === 'ok' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Değişiklikler kaydedildi
            </div>
          )}
          {status === 'err' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" /> {errMsg}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Kapat
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Kaydet
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
