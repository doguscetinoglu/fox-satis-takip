'use client'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getTrialUrgency } from '@/lib/subscription'

export function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const [closed, setClosed] = useState(false)
  if (closed || daysRemaining <= 0) return null

  const urgency = getTrialUrgency(daysRemaining)
  const bg = {
    safe: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    critical: 'bg-red-500/10 border-red-500/30 text-red-300 alarm-pulse',
  }[urgency]

  return (
    <div className={cn('flex items-center justify-between px-4 py-2.5 border-b text-sm', bg)}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          Deneme süreniz <strong>{daysRemaining} gün</strong> içinde bitiyor.{' '}
          <Link href="/admin/abonelik" className="underline underline-offset-2 hover:opacity-80">
            Aboneliği aktifleştirin
          </Link>
        </span>
      </div>
      <button onClick={() => setClosed(true)} className="p-1 hover:opacity-70 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
