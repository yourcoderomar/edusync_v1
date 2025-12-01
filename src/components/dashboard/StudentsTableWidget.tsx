import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type StudentRiskRow = {
  id: string
  name: string | null
  phone: string | null
  className?: string | null
  metric: string
  metricValue?: string
}

type StudentsTableWidgetProps = {
  title: string
  description?: string
  emptyMessage: string
  rows: StudentRiskRow[]
}

export function StudentsTableWidget({
  title,
  description,
  emptyMessage,
  rows,
}: StudentsTableWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden sm:table-cell">Class</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>{'Status / Metric'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.name || 'Unknown student'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row.className || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{row.metric}</span>
                      {row.metricValue && (
                        <span className="ml-1 text-gray-500">({row.metricValue})</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}


