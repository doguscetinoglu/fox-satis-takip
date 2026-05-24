'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export function RepComparisonChart({ data }: { data: { name: string; revenue: number; target: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
        <Legend />
        <Bar dataKey="revenue" name="Ciro" fill="#0071E3" radius={[4, 4, 0, 0]} />
        <Bar dataKey="target" name="Hedef" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.5} />
      </BarChart>
    </ResponsiveContainer>
  )
}
