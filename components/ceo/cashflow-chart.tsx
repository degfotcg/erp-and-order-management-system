'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const config = {
  received: { label: 'Client receipts', color: 'var(--chart-1)' },
  disbursed: { label: 'Disbursements', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function CashflowChart({ data }: { data: { month: string; received: number; disbursed: number }[] }) {
  if (data.every((d) => d.received === 0 && d.disbursed === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Cash flow appears once payments are verified.
      </div>
    )
  }
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="received" fill="var(--color-received)" radius={4} />
        <Bar dataKey="disbursed" fill="var(--color-disbursed)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
