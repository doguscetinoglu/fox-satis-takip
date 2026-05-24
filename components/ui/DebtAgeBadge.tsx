import { cn, debtAgeBucketColor, getDebtAgeBucket, getDebtAgeDays } from '@/lib/utils'

export function DebtAgeBadge({ dueDate }: { dueDate: Date | string }) {
  const days = getDebtAgeDays(dueDate)
  const bucket = getDebtAgeBucket(days)
  const color = debtAgeBucketColor(bucket)

  if (days === 0) return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-400/10 border-emerald-400/20 text-emerald-400">
      Güncel
    </span>
  )

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border', color)}>
      {days}g gecikmiş
    </span>
  )
}
