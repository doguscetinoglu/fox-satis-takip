'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Target, AlertCircle, Users } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatCurrency } from '@/lib/utils'

type Stats = {
  todayRevenue: number; monthRevenue: number; revenueTarget: number
  salesCountTarget: number; daysInMonth: number; daysElapsed: number
  daysRemaining: number; pace: number; requiredPace: number
  overdueCount: number; assignedCount: number
}

export function TemsilciDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/temsilci/stats').then(r => r.json()).then(setStats)
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const pct = stats.revenueTarget > 0 ? Math.min(100, (stats.monthRevenue / stats.revenueTarget) * 100) : 0
  const remaining = Math.max(0, stats.revenueTarget - stats.monthRevenue)
  const onTrack = stats.pace >= stats.requiredPace

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hoş Geldiniz</h1>
        <p className="text-muted-foreground text-sm mt-1">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Bugünkü Ciro" value={formatCurrency(stats.todayRevenue)} icon={TrendingUp} color="emerald" index={0} />
        <StatsCard title="Aylık Ciro" value={formatCurrency(stats.monthRevenue)} subtitle={`${pct.toFixed(0)}% hedefe ulaşıldı`} icon={TrendingUp} color="blue" index={1} />
        <StatsCard title="Müşterim" value={stats.assignedCount.toString()} icon={Users} color="violet" index={2} />
        <StatsCard title="Gecikmiş Borç" value={stats.overdueCount.toString()} subtitle="müşteri" icon={AlertCircle} color={stats.overdueCount > 0 ? 'red' : 'emerald'} index={3} />
      </div>

      {/* Target progress */}
      <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4" /> Aylık Hedef</h2>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${onTrack ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {onTrack ? 'Hedefe Uygun' : 'Hızlanma Gerekiyor'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Gerçekleşen</span>
              <span className="font-semibold">{formatCurrency(stats.monthRevenue)} / {formatCurrency(stats.revenueTarget)}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-muted-foreground text-xs mb-1">Hedefe Kalan</p>
              <p className="font-bold text-amber-400">{formatCurrency(remaining)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-muted-foreground text-xs mb-1">Günlük Hız</p>
              <p className="font-bold">{formatCurrency(stats.pace)}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-muted-foreground text-xs mb-1">Gereken Hız</p>
              <p className={`font-bold ${onTrack ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(stats.requiredPace)}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {stats.daysRemaining} gün kaldı · Günde {formatCurrency(stats.requiredPace)} satış yapmanız gerekiyor
          </p>
        </div>
      </div>
    </div>
  )
}
