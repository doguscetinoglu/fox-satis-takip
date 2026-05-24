'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

type Tenant = {
  id: string; companyName: string; ownerName: string; phone: string
  planStatus: string; effectiveStatus: string; trialEndsAt: string
  _count: { users: number; customers: number }
  subscriptionPayments: { status: string; period: string; createdAt: string }[]
}

const statusColors: Record<string, string> = {
  TRIAL: 'text-blue-400 bg-blue-400/10',
  ACTIVE: 'text-emerald-400 bg-emerald-400/10',
  SUSPENDED: 'text-red-400 bg-red-400/10',
  CANCELLED: 'text-muted-foreground bg-muted',
}

export function PlatformDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch('/api/platform/tenantlar').then(r => r.json()).then(d => { setTenants(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function changeStatus(id: string, planStatus: string) {
    await fetch(`/api/platform/tenantlar/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planStatus }) })
    load()
  }

  async function confirmPayment(paymentId: string, action: 'confirm' | 'reject') {
    await fetch(`/api/platform/abonelik/${paymentId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    load()
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-muted-foreground text-sm">{tenants.length} aktif firma</p>
      </div>

      {tenants.map(t => {
        const st = statusColors[t.effectiveStatus] ?? statusColors.CANCELLED
        const pendingPayment = t.subscriptionPayments.find(p => p.status === 'PENDING')
        return (
          <div key={t.id} className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{t.companyName}</p>
                <p className="text-sm text-muted-foreground">{t.ownerName} · {t.phone}</p>
                <p className="text-xs text-muted-foreground">{t._count.users} temsilci · {t._count.customers} müşteri</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${st}`}>{t.effectiveStatus}</span>
                <select value={t.planStatus} onChange={e => changeStatus(t.id, e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg bg-background border border-border focus:outline-none">
                  <option value="TRIAL">TRIAL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {pendingPayment && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                <span className="text-amber-400">Bekleyen ödeme: {pendingPayment.period}</span>
                <div className="flex gap-2">
                  <button onClick={() => confirmPayment(pendingPayment.id, 'confirm')} className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium">Onayla</button>
                  <button onClick={() => confirmPayment(pendingPayment.id, 'reject')} className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium">Reddet</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
