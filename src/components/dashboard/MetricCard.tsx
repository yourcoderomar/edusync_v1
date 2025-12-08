import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type MetricCardProps = {
  title: string
  value: number | string
  description?: string
  icon?: ReactNode
  className?: string
}

export function MetricCard({ title, value, description, icon, className }: MetricCardProps) {
  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {icon && <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700">{icon}</span>}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </CardContent>
    </Card>
  )
}








