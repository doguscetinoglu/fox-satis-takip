'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, Users, AlertCircle, UserCheck } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import { RepComparisonChart } from '@/components/charts/RepComparisonChart'
import { formatCurrency } from '@/lib/utils'

type Stats = {
  monthlyRevenue: number
  activeCustomers: number
  overdueDebt: number
  repsCount: number
  todayRevenue: number
  repStats: { name: string; revenue: number; target: number }[]
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Genel bakış — {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Aylık Ciro" value={formatCurrency(stats.monthlyRevenue)} subtitle="Bu ay" icon={TrendingUp} color="blue" index={0} />
        <StatsCard title="Bugünkü Ciro" value={formatCurrency(stats.todayRevenue)} subtitle="Bugün" icon={TrendingUp} color="emerald" index={1} />
        <StatsCard title="Aktif Müşteri" value={stats.activeCustomers.toString()} icon={UserCheck} color="violet" index={2} />
        <StatsCard title="Gecikmiş Borç" value={formatCurrency(stats.overdueDebt)} subtitle="Toplam" icon={AlertCircle} color="red" index={3} />
      </div>

      {stats.repStats.length > 0 && (
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Temsilci Performansı</h2>
          <RepComparisonChart data={stats.repStats} />
        </div>
      )}
    </div>
  )
}
