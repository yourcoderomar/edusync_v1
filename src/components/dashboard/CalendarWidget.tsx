import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

export type CalendarSession = {
  id: string
  date: string // ISO date (YYYY-MM-DD)
  startsAt: string | null
  endsAt: string | null
  className: string
}

type CalendarWidgetProps = {
  title?: string
  description?: string
  sessions: CalendarSession[]
}

function sessionsToKeyArray(sessions: CalendarSession[], year: number, month: number) {
  return sessions
    .filter((s) => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    .map((s) => s.date.split('T')[0] ?? s.date)
}

function getMonthDays(date: Date, sessions: CalendarSession[]) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const days: { date: Date; hasSession: boolean }[] = []
  const sessionsByDate = new Set(sessionsToKeyArray(sessions, year, month))

  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const current = new Date(year, month, day)
    const key = current.toISOString().split('T')[0]
    days.push({
      date: current,
      hasSession: sessionsByDate.has(key),
    })
  }

  const startWeekday = firstDayOfMonth.getDay()
  const leadingBlanks = startWeekday === 0 ? 6 : startWeekday - 1

  return { days, leadingBlanks }
}

export function CalendarWidget({ title = 'Class Calendar', description, sessions }: CalendarWidgetProps) {
  const today = new Date()
  const { days, leadingBlanks } = getMonthDays(today, sessions)

  const sessionsByDate = sessions.reduce<Record<string, CalendarSession[]>>((acc, session) => {
    const key = session.date.split('T')[0] ?? session.date
    acc[key] = acc[key] || []
    acc[key].push(session)
    return acc
  }, {})

  const todayKey = today.toISOString().split('T')[0]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">{title}</CardTitle>
        <CardDescription>
          {description || 'Overview of your classes this month'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-1 text-center font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {Array.from({ length: leadingBlanks }).map((_, index) => (
            <div key={`blank-${index}`} />
          ))}
          {days.map(({ date, hasSession }) => {
            const key = date.toISOString().split('T')[0]
            const isToday = key === todayKey

            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'flex h-10 w-full flex-col items-center justify-center rounded-md border text-xs transition-colors',
                  isToday
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  hasSession && !isToday && 'border-teal-100 bg-teal-50/40'
                )}
              >
                <span>{date.getDate()}</span>
                {hasSession && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-teal-500" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4 space-y-2 max-h-52 overflow-y-auto">
          {Object.keys(sessionsByDate).length === 0 ? (
            <p className="text-sm text-gray-500">
              No upcoming sessions scheduled for this month.
            </p>
          ) : (
            Object.entries(sessionsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, daySessions]) => (
                <div key={dateKey} className="border-l-2 border-teal-200 pl-3">
                  <p className="text-xs font-medium text-gray-600">
                    {new Date(dateKey).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {daySessions.map((session) => (
                      <li key={session.id} className="text-xs text-gray-700">
                        <span className="font-medium">{session.className}</span>
                        {session.startsAt && (
                          <span className="ml-1 text-gray-500">
                            at{' '}
                            {new Date(session.startsAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

