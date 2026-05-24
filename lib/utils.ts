import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-\(\)]/g, '').trim()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getDebtAgeDays(dueDate: Date | string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diff = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function getDebtAgeBucket(ageDays: number): '0-30' | '30-60' | '60-90' | '90+' {
  if (ageDays <= 30) return '0-30'
  if (ageDays <= 60) return '30-60'
  if (ageDays <= 90) return '60-90'
  return '90+'
}

export function debtAgeBucketColor(bucket: string): string {
  switch (bucket) {
    case '0-30': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
    case '30-60': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    case '60-90': return 'text-red-400 bg-red-400/10 border-red-400/20'
    case '90+': return 'text-red-500 bg-red-500/20 border-red-500/30'
    default: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  }
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getWorkingDaysElapsed(): number {
  const now = new Date()
  return now.getDate()
}
