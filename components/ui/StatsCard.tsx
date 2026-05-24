'use client'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet'
  index?: number
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
  red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-400',
  violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400',
}

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={cn('relative p-5 rounded-2xl border bg-gradient-to-br overflow-hidden', colorMap[color])}
    >
      <div className="shimmer absolute inset-0 pointer-events-none" />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className={cn('p-2 rounded-lg bg-gradient-to-br', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  )
}
