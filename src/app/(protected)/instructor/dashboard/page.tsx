import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ClipboardList, Users, AlertTriangle, BookOpen } from 'lucide-react'

import { createClient, getUserProfile } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ShortcutCard } from '@/components/dashboard/ShortcutCard'
import { StudentsTableWidget, type StudentRiskRow } from '@/components/dashboard/StudentsTableWidget'
import { CalendarWidget, type CalendarSession } from '@/components/dashboard/CalendarWidget'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Instructor Dashboard',
  description: 'Overview of your students, classes, attendance, and performance.',
}

export default async function InstructorDashboardPage() {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  const typedProfile = profile as { id: string; role: 'admin' | 'student' | 'instructor' }

  if (typedProfile.role !== 'instructor' && typedProfile.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-gray-600">
            You do not have instructor access. Please sign in with an instructor account.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            If you believe this is an error, contact your administrator.
          </p>
        </CardContent>
      </Card>
    )
  }

  const instructorId = typedProfile.id

  // Fetch classes taught by this instructor
  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name, description')
    .eq('teacher_id', instructorId)

  const classes = (classesData || []) as Array<{ id: string; name: string; description: string | null }>
  const classIds = classes.map((c) => c.id)

  // Metrics: total students with this instructor, total classes, upcoming sessions
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // We only want sessions in the next 2 days (future only)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0]

  const [
    instructorStudentsResult,
    classesCountResult,
    upcomingSessionsResult,
    latestCreatedSessionResult,
  ] = await Promise.all([
    supabase
      .from('instructor_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructorId)
      .eq('status', 'approved'),
    supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', instructorId),
    classIds.length > 0
      ? supabase
          .from('class_sessions')
          .select('id, class_id, session_date, starts_at, ends_at')
          .in('class_id', classIds)
          // Only future sessions in the next 2 days
          .gte('session_date', tomorrowStr)
          .lte('session_date', dayAfterTomorrowStr)
          .order('session_date', { ascending: true })
          .order('starts_at', { ascending: true })
      : { data: [] },
    classIds.length > 0
      ? supabase
          .from('class_sessions')
          .select('id, class_id, session_date, starts_at, ends_at, created_at')
          .in('class_id', classIds)
          .gte('session_date', todayStr)
          .lte('session_date', dayAfterTomorrowStr)
          .order('created_at', { ascending: false })
          .limit(1)
      : { data: [] },
  ])

  const totalStudents = instructorStudentsResult.count || 0
  const totalClasses = classesCountResult.count || 0
  const upcomingSessions =
    ((upcomingSessionsResult as any).data || []) as Array<{
      id: string
      class_id: string
      session_date: string
      starts_at: string | null
      ends_at: string | null
    }>

  const upcomingClassesCount = upcomingSessions.length
  const nextSession = upcomingSessions[0]
  const nextSessionClass = nextSession ? classes.find((c) => c.id === nextSession.class_id) : null

  // Determine a session for quick attendance: prefer the most recently created upcoming session
  const latestCreatedSessions =
    ((latestCreatedSessionResult as any).data || []) as Array<{
      id: string
      class_id: string
      session_date: string
      starts_at: string | null
      ends_at: string | null
    }>

  // 1) Most recently created upcoming session (usually the one you just created)
  let quickAttendanceSession: (typeof latestCreatedSessions)[number] | (typeof upcomingSessions)[number] | null =
    latestCreatedSessions[0] || null

  // 2) If none in that window, fall back to the earliest upcoming session in the 2‑day window
  if (!quickAttendanceSession && upcomingSessions.length > 0) {
    quickAttendanceSession = upcomingSessions[0]
  }

  // Attendance: last 3 sessions per instructor (across classes)
  let studentsMissedLastThree: StudentRiskRow[] = []
  if (classIds.length > 0) {
    const { data: recentSessionsData } = await supabase
      .from('class_sessions')
      .select('id, class_id, session_date')
      .in('class_id', classIds)
      .order('session_date', { ascending: false })
      .limit(3)

    const recentSessions =
      (recentSessionsData || []) as Array<{ id: string; class_id: string; session_date: string }>
    const sessionIds = recentSessions.map((s) => s.id)

    if (sessionIds.length > 0) {
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(
          `
            id,
            session_id,
            student_id,
            status,
            marked_at,
            student:profiles!attendance_student_id_fkey (
              id,
              full_name,
              phone
            ),
            session:class_sessions!inner (
              id,
              class_id,
              session_date,
              classes!inner (
                id,
                name
              )
            )
          `
        )
        .in('session_id', sessionIds)
        .eq('status', 'absent')

      type AttendanceRow = {
        id: string
        session_id: string
        student_id: string
        status: 'present' | 'absent' | 'late'
        marked_at: string
        student: { id: string; full_name: string | null; phone: string | null } | null
        session: {
          id: string
          class_id: string
          session_date: string
          classes: { id: string; name: string } | null
        } | null
      }

      const typedAttendance = (attendanceData || []) as AttendanceRow[]

      const absentCounts = new Map<
        string,
        { count: number; student: AttendanceRow['student']; classes: Set<string> }
      >()

      for (const row of typedAttendance) {
        const key = row.student_id
        const existing = absentCounts.get(key)
        const className = row.session?.classes?.name

        if (!existing) {
          const classesSet = new Set<string>()
          if (className) classesSet.add(className)
          absentCounts.set(key, { count: 1, student: row.student, classes: classesSet })
        } else {
          existing.count += 1
          if (className) existing.classes.add(className)
        }
      }

      studentsMissedLastThree = Array.from(absentCounts.entries())
        .filter(([_, value]) => value.count >= 3)
        .map(([studentId, value]) => ({
          id: studentId,
          name: value.student?.full_name || null,
          phone: value.student?.phone || null,
          className: Array.from(value.classes).join(', ') || null,
          metric: 'Absent in last 3 sessions',
          metricValue: `${value.count} / 3`,
        }))
        .slice(0, 10)
    }
  }

  // Students with bad grades (using attendance.quiz_grade as source of per-session grade)
  let studentsWithBadGrades: StudentRiskRow[] = []
  const gradeThreshold = 60

  if (classIds.length > 0) {
    const { data: lowGradeAttendanceData } = await supabase
      .from('attendance')
      .select(
        `
          id,
          session_id,
          student_id,
          quiz_grade,
          student:profiles!attendance_student_id_fkey (
            id,
            full_name,
            phone
          ),
          session:class_sessions!inner (
            id,
            class_id,
            session_date,
            classes!inner (
              id,
              name
            )
          )
        `
      )
      .lt('quiz_grade', gradeThreshold)
      .not('quiz_grade', 'is', null)

    type LowGradeRow = {
      id: string
      session_id: string
      student_id: string
      quiz_grade: number | null
      student: { id: string; full_name: string | null; phone: string | null } | null
      session: {
        id: string
        class_id: string
        session_date: string
        classes: { id: string; name: string } | null
      } | null
    }

    const typedLowGrades = (lowGradeAttendanceData || []) as LowGradeRow[]

    const gradeSummary = new Map<
      string,
      { count: number; avg: number; student: LowGradeRow['student']; classes: Set<string> }
    >()

    for (const row of typedLowGrades) {
      if (row.quiz_grade == null) continue
      const key = row.student_id
      const existing = gradeSummary.get(key)
      const className = row.session?.classes?.name

      if (!existing) {
        const classesSet = new Set<string>()
        if (className) classesSet.add(className)
        gradeSummary.set(key, { count: 1, avg: row.quiz_grade, student: row.student, classes: classesSet })
      } else {
        const newCount = existing.count + 1
        const newAvg = (existing.avg * existing.count + row.quiz_grade) / newCount
        existing.count = newCount
        existing.avg = newAvg
        if (className) existing.classes.add(className)
      }
    }

    studentsWithBadGrades = Array.from(gradeSummary.entries())
      .map(([studentId, value]) => ({
        id: studentId,
        name: value.student?.full_name || null,
        phone: value.student?.phone || null,
        className: Array.from(value.classes).join(', ') || null,
        metric: 'Low quiz performance',
        metricValue: `${Math.round(value.avg)}% avg (${value.count} attempts)`,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.metricValue?.split('%')[0] || '0', 10)
        const bNum = parseInt(b.metricValue?.split('%')[0] || '0', 10)
        return aNum - bNum
      })
      .slice(0, 10)
  }

  // Calendar sessions for this instructor (next 2 days, future only)
  let calendarSessions: CalendarSession[] = []
  if (classIds.length > 0) {
    const { data: calendarSessionsData } = await supabase
      .from('class_sessions')
      .select(
        `
          id,
          class_id,
          session_date,
          starts_at,
          ends_at,
          classes!inner (
            id,
            name
          )
        `
      )
      .in('class_id', classIds)
      // Same 2-day future window as the metric
      .gte('session_date', tomorrowStr)
      .lte('session_date', dayAfterTomorrowStr)
      .order('session_date', { ascending: true })
      .order('starts_at', { ascending: true })

    type SessionRow = {
      id: string
      class_id: string
      session_date: string
      starts_at: string | null
      ends_at: string | null
      classes: { id: string; name: string } | null
    }

    const typedCalendarSessions = (calendarSessionsData || []) as SessionRow[]

    calendarSessions = typedCalendarSessions.map((session) => ({
      id: session.id,
      date: session.session_date,
      startsAt: session.starts_at,
      endsAt: session.ends_at,
      className: session.classes?.name || 'Class session',
    }))
  }

  const stats = [
    {
      title: 'My Students',
      value: totalStudents,
      description: 'Students enrolled with you as their instructor',
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: 'My Classes',
      value: totalClasses,
      description: 'Active classes you are teaching',
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      title: 'Upcoming Sessions',
      value: upcomingClassesCount,
      description: nextSession
        ? `Next: ${nextSessionClass?.name || 'Class'} on ${formatDate(nextSession.session_date)}`
        : 'No upcoming sessions scheduled',
      icon: <CalendarDays className="h-4 w-4" />,
    },
  ]

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">Instructor Dashboard</h1>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Get a quick overview of your classes, attendance, and student performance.
        </p>
      </header>

      <section aria-labelledby="stats-heading" className="mb-8">
        <h2 id="stats-heading" className="sr-only">
          Dashboard Statistics
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <MetricCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="widgets-heading" className="space-y-8">
        <h2 id="widgets-heading" className="sr-only">
          Instructor tools and insights
        </h2>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ShortcutCard
              title="Quick Actions"
              description="Create new sessions and manage attendance for your classes."
              actions={[
                {
                  label: 'Create Session',
                  // Go to classes list first so the instructor can choose which class
                  href: '/admin/classes',
                  icon: <BookOpen className="h-4 w-4" />,
                },
                {
                  label: 'Take Attendance',
                  href: quickAttendanceSession
                    ? `/admin/classes/${quickAttendanceSession.class_id}/sessions/${quickAttendanceSession.id}/attendance/mark`
                    : '/admin/classes',
                  icon: <ClipboardList className="h-4 w-4" />,
                },
              ]}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <StudentsTableWidget
                title="Students Absent in Last 3 Sessions"
                description="Students who missed the last 3 sessions across your classes."
                emptyMessage="No students have missed all of the last 3 sessions."
                rows={studentsMissedLastThree}
              />

              <StudentsTableWidget
                title="Students With Low Grades"
                description={`Students with quiz grades below ${gradeThreshold}%.`}
                emptyMessage="No students with low quiz grades at the moment."
                rows={studentsWithBadGrades}
              />
            </div>
          </div>

          <div className="space-y-6">
            <CalendarWidget
              title="Upcoming Class Calendar"
              description="Sessions for your classes over the next 2 days."
              sessions={calendarSessions}
            />
          </div>
        </div>
      </section>
    </>
  )
}


