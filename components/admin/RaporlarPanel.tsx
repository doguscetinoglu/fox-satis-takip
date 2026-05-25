'use client'
import { useState } from 'react'
import { ChevronRight, TrendingUp, FileText, Users, AlertTriangle } from 'lucide-react'
import { CiroTakibiRaporu } from './raporlar/CiroTakibiRaporu'

type Rapor = {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  component: React.ReactNode
  available: boolean
}

const RAPORLAR: Rapor[] = [
  {
    id: 'ciro',
    title: 'Ciro Takibi',
    description: 'Aylık ciro gerçekleşmeleri, temsilci bazlı hedef karşılaştırması ve günlük trend analizi',
    icon: TrendingUp,
    color: 'blue',
    component: <CiroTakibiRaporu />,
    available: true,
  },
  {
    id: 'borc',
    title: 'Borç Yaşlandırma',
    description: 'Müşteri bazlı vadesi geçmiş borçlar, 0-30, 30-60, 60-90, 90+ gün vade kırılımı',
    icon: AlertTriangle,
    color: 'red',
    component: null,
    available: false,
  },
  {
    id: 'temsilci',
    title: 'Temsilci Performansı',
    description: 'Temsilcilerin aylık bazda karşılaştırmalı ciro, adet ve müşteri portföy analizi',
    icon: Users,
    color: 'violet',
    component: null,
    available: false,
  },
  {
    id: 'musteri',
    title: 'Müşteri Analizi',
    description: 'En çok ciro getiren müşteriler, borç yoğunluğu ve portföy dağılımı',
    icon: FileText,
    color: 'emerald',
    component: null,
    available: false,
  },
]

export function RaporlarPanel() {
  const [openId, setOpenId] = useState<string | null>('ciro')

  function toggle(id: string) {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className="space-y-3">
      {RAPORLAR.map(rapor => {
        const isOpen = openId === rapor.id
        const Icon = rapor.icon

        const colors: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
          blue:    { border: 'border-blue-500/30',    bg: 'bg-blue-500/10',    icon: 'text-blue-400',    badge: 'bg-blue-500/15 text-blue-400' },
          red:     { border: 'border-red-500/30',     bg: 'bg-red-500/10',     icon: 'text-red-400',     badge: 'bg-red-500/15 text-red-400' },
          violet:  { border: 'border-violet-500/30',  bg: 'bg-violet-500/10',  icon: 'text-violet-400',  badge: 'bg-violet-500/15 text-violet-400' },
          emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400' },
        }
        const c = colors[rapor.color]

        return (
          <div key={rapor.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${isOpen ? `${c.border} bg-card` : 'border-border bg-card hover:border-border/80'}`}>
            {/* Header */}
            <button
              onClick={() => rapor.available && toggle(rapor.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${rapor.available ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default opacity-60'}`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{rapor.title}</span>
                  {!rapor.available && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Yakında</span>
                  )}
                  {rapor.available && isOpen && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>Açık</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rapor.description}</p>
              </div>

              {rapor.available && (
                <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
              )}
            </button>

            {/* Content */}
            {isOpen && rapor.component && (
              <div className="px-5 pb-6 border-t border-border/50">
                {rapor.component}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
