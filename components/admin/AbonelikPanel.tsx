'use client'
import { useEffect, useState } from 'react'
import { Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDate, getMonthKey } from '@/lib/utils'

type AbonelikData = {
  planStatus: string
  trialDaysRemaining: number
  trialEndsAt: string
  subscriptionEndsAt: string | null
  iban: string
  ibanName: string
  payments: { id: string; period: string; amount: number; status: string; ibanRef?: string; createdAt: string }[]
}

const statusMap: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  TRIAL: { label: 'Deneme', color: 'text-blue-400', icon: Clock },
  ACTIVE: { label: 'Aktif', color: 'text-emerald-400', icon: CheckCircle },
  SUSPENDED: { label: 'Askıya Alındı', color: 'text-red-400', icon: XCircle },
  CANCELLED: { label: 'İptal Edildi', color: 'text-muted-foreground', icon: XCircle },
}

export function AbonelikPanel() {
  const [data, setData] = useState<AbonelikData | null>(null)
  const [form, setForm] = useState({ period: getMonthKey(), ibanRef: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch('/api/admin/abonelik').then(r => r.json()).then(setData)
  }, [])

  async function sendPaymentNotice(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    await fetch('/api/admin/abonelik', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSending(false)
    setSent(true)
    fetch('/api/admin/abonelik').then(r => r.json()).then(setData)
  }

  if (!data) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const st = statusMap[data.planStatus] ?? statusMap.SUSPENDED
  const StatusIcon = st.icon

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status card */}
      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <StatusIcon className={`w-6 h-6 ${st.color}`} />
          <div>
            <p className="font-semibold">Abonelik Durumu: <span className={st.color}>{st.label}</span></p>
            {data.planStatus === 'TRIAL' && (
              <p className="text-sm text-muted-foreground">{data.trialDaysRemaining} gün kaldı · {formatDate(data.trialEndsAt)} tarihine kadar</p>
            )}
            {data.planStatus === 'ACTIVE' && data.subscriptionEndsAt && (
              <p className="text-sm text-muted-foreground">Sonraki ödeme: {formatDate(data.subscriptionEndsAt)}</p>
            )}
          </div>
        </div>
      </div>

      {/* IBAN info */}
      <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Ödeme Bilgileri</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miktar</span>
            <span className="font-semibold">100 ₺/ay</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alıcı</span>
            <span className="font-semibold">{data.ibanName || 'Fox Yazılım'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">IBAN</span>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{data.iban || 'Lütfen iletişime geçin'}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Ödemeyi yaptıktan sonra aşağıdaki formu doldurun. 1 iş günü içinde aktifleştirilir.</p>
      </div>

      {/* Payment notification form */}
      {!sent ? (
        <form onSubmit={sendPaymentNotice} className="p-5 rounded-2xl border border-border bg-card space-y-4">
          <h3 className="font-semibold">Ödeme Bildirimi Gönder</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dönem</label>
              <input type="month" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">IBAN Referans/Açıklama</label>
              <input placeholder="İşlem referans no" value={form.ibanRef} onChange={e => setForm(f => ({ ...f, ibanRef: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
            </div>
          </div>
          <button type="submit" disabled={sending}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-60 transition-colors">
            {sending ? 'Gönderiliyor...' : 'Ödeme Bildir'}
          </button>
        </form>
      ) : (
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm">Ödeme bildiriminiz alındı. 1 iş günü içinde aboneliğiniz aktifleştirilecektir.</p>
        </div>
      )}

      {/* Payment history */}
      {data.payments.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Ödeme Geçmişi</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Dönem', 'Tutar', 'Referans', 'Durum', 'Tarih'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.payments.map(p => {
                const cls = { PENDING: 'text-amber-400', CONFIRMED: 'text-emerald-400', REJECTED: 'text-red-400' }[p.status] ?? ''
                const lbl = { PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', REJECTED: 'Reddedildi' }[p.status] ?? p.status
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{p.period}</td>
                    <td className="px-4 py-3 font-semibold">{p.amount} ₺</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.ibanRef ?? '-'}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${cls}`}>{lbl}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(p.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
