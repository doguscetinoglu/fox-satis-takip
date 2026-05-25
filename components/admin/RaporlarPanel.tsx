'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, AlertTriangle, Users, FileSearch } from 'lucide-react'
import { CiroTakibiRaporu } from './raporlar/CiroTakibiRaporu'
import { BorcYaslandirmaRaporu } from './raporlar/BorcYaslandirmaRaporu'
import { TemsilciPerformansRaporu } from './raporlar/TemsilciPerformansRaporu'
import { MusteriAnaliziRaporu } from './raporlar/MusteriAnaliziRaporu'

type Rapor = {
  id: string; title: string; subtitle: string
  icon: React.ElementType; color: string
  component: React.ReactNode
}

const RAPORLAR: Rapor[] = [
  {
    id: 'ciro',
    title: 'Ciro Takibi',
    subtitle: 'Hedef & günlük trend',
    icon: TrendingUp,
    color: 'blue',
    component: <CiroTakibiRaporu />,
  },
  {
    id: 'borc',
    title: 'Borç Yaşlandırma',
    subtitle: '0-30 · 30-60 · 60-90 · 90+',
    icon: AlertTriangle,
    color: 'red',
    component: <BorcYaslandirmaRaporu />,
  },
  {
    id: 'temsilci',
    title: 'Temsilci Performansı',
    subtitle: 'Karşılaştırma & sıralama',
    icon: Users,
    color: 'violet',
    component: <TemsilciPerformansRaporu />,
  },
  {
    id: 'musteri',
    title: 'Müşteri Analizi',
    subtitle: 'Ciro & borç dağılımı',
    icon: FileSearch,
    color: 'emerald',
    component: <MusteriAnaliziRaporu />,
  },
]

const COLOR_MAP: Record<string, { grad: string; glow: string; border: string; text: string; icon: string; activeBg: string }> = {
  blue:    { grad: 'from-blue-600 to-blue-800',      glow: 'shadow-blue-500/40',    border: 'border-blue-500/50',    text: 'text-blue-400',    icon: 'text-blue-300',    activeBg: 'bg-blue-500/10' },
  red:     { grad: 'from-red-600 to-red-800',        glow: 'shadow-red-500/40',     border: 'border-red-500/50',     text: 'text-red-400',     icon: 'text-red-300',     activeBg: 'bg-red-500/10' },
  violet:  { grad: 'from-violet-600 to-violet-800',  glow: 'shadow-violet-500/40',  border: 'border-violet-500/50',  text: 'text-violet-400',  icon: 'text-violet-300',  activeBg: 'bg-violet-500/10' },
  emerald: { grad: 'from-emerald-600 to-emerald-800',glow: 'shadow-emerald-500/40', border: 'border-emerald-500/50', text: 'text-emerald-400', icon: 'text-emerald-300', activeBg: 'bg-emerald-500/10' },
}

function RaporCard({ rapor, isActive, onClick }: { rapor: Rapor; isActive: boolean; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const c = COLOR_MAP[rapor.color]
  const Icon = rapor.icon

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setRotate({
      x: -((e.clientY - cy) / (rect.height / 2)) * 9,
      y: ((e.clientX - cx) / (rect.width / 2)) * 9,
    })
  }

  return (
    <div style={{ perspective: '900px' }} onClick={onClick}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setRotate({ x: 0, y: 0 }) }}
        animate={{
          rotateX: hovered ? rotate.x : 0,
          rotateY: hovered ? rotate.y : 0,
          scale: isActive ? 1.04 : hovered ? 1.02 : 1,
          z: isActive ? 12 : hovered ? 6 : 0,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative p-4 rounded-2xl border cursor-pointer select-none transition-shadow duration-300
          ${isActive
            ? `${c.activeBg} ${c.border} shadow-lg ${c.glow}`
            : 'border-border bg-card hover:border-border/60'}`}
      >
        {/* Shine layer */}
        <motion.div
          animate={{ opacity: hovered || isActive ? 1 : 0 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(1px)',
          }}
        />

        <div className="flex items-center gap-3" style={{ transform: 'translateZ(8px)', transformStyle: 'preserve-3d' }}>
          {/* Icon cube */}
          <motion.div
            animate={{ rotateY: isActive ? 360 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center flex-shrink-0 shadow-md`}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>

          <div className="min-w-0">
            <p className={`font-semibold text-sm truncate ${isActive ? c.text : ''}`}>{rapor.title}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{rapor.subtitle}</p>
          </div>
        </div>

        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            layoutId="active-dot"
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-br ${c.grad}`}
          />
        )}
      </motion.div>
    </div>
  )
}

export function RaporlarPanel() {
  const [activeId, setActiveId] = useState<string>('ciro')
  const activeRapor = RAPORLAR.find(r => r.id === activeId)

  return (
    <div className="flex gap-5 min-h-[600px]">
      {/* Left nav */}
      <div className="w-56 flex-shrink-0 space-y-2.5">
        {RAPORLAR.map(rapor => (
          <RaporCard
            key={rapor.id}
            rapor={rapor}
            isActive={activeId === rapor.id}
            onClick={() => setActiveId(rapor.id)}
          />
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {activeRapor && (
            <motion.div
              key={activeId}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold">{activeRapor.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{activeRapor.subtitle}</p>
              </div>
              {activeRapor.component}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
