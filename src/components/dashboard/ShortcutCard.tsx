import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

type ShortcutAction = {
  label: string
  href: string
  icon?: ReactNode
}

type ShortcutCardProps = {
  title: string
  description?: string
  actions: ShortcutAction[]
}

export function ShortcutCard({ title, description, actions }: ShortcutCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              asChild
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              <Link href={action.href}>
                {action.icon && <span className="h-4 w-4">{action.icon}</span>}
                <span>{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


