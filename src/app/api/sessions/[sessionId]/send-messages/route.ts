import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, isAdminOrInstructor } from '@/lib/supabase/server'
import { getAttendanceBySession } from '@/lib/actions/attendance/get-attendance'
import { getQuizzesBySession } from '@/lib/actions/quizzes/get-quizzes'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { formatDate } from '@/lib/utils/format'

/**
 * API route for sending attendance messages to parents via n8n webhook
 * 
 * @security
 * - Validates user authentication
 * - Only admins or instructors can send messages
 * - Uses authenticated client (respects RLS policies)
 */
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const debugId = randomUUID()
    const { sessionId } = await params

    console.log('[send-messages] request start', { debugId, sessionId })
    
    // Check if user is admin
    const canSendMessages = await isAdminOrInstructor()
    if (!canSendMessages) {
      console.warn('[send-messages] unauthorized attempt', { debugId, sessionId })
      return NextResponse.json(
        { success: false, error: 'Only admins or instructors can send messages' },
        { status: 403 }
      )
    }

    // Get n8n webhook URL from environment variable
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    console.log('[send-messages] webhook url resolved', { debugId, hasUrl: !!webhookUrl })
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'N8N webhook URL is not configured', debugId },
        { status: 500 }
      )
    }

    // Fetch session data
    const sessionResult = await getSessionById(sessionId)
    console.log('[send-messages] session lookup result', { debugId, success: sessionResult.success })
    if (!sessionResult.success || !sessionResult.data) {
      return NextResponse.json(
        { success: false, error: 'Session not found', debugId },
        { status: 404 }
      )
    }

    const session = sessionResult.data
    const classData = session.classes as any

    // Fetch attendance data
    const attendanceResult = await getAttendanceBySession(sessionId)
    console.log('[send-messages] attendance result', { debugId, success: attendanceResult.success })
    if (!attendanceResult.success) {
      return NextResponse.json(
        { success: false, error: attendanceResult.error || 'Failed to fetch attendance', debugId },
        { status: 500 }
      )
    }

    const attendance = attendanceResult.data || []

    // Fetch quizzes for the session
    const quizzesResult = await getQuizzesBySession(sessionId)
    const quizzes = quizzesResult.success ? quizzesResult.data || [] : []
    console.log('[send-messages] quiz result', { debugId, quizCount: quizzes.length, quizSuccess: quizzesResult.success })

    // Prepare table data for each student with parent phone
    // Send as individual variables so n8n can format the message
    const tableData = attendance
      .filter((record: any) => {
        const student = record.student as any
        return student?.parent_phone_number
      })
      .map((record: any) => {
        const student = record.student as any
        
        return {
          phone: student.parent_phone_number,
          parent_phone_number: student.parent_phone_number,
          studentName: student.full_name,
          sessionDate: formatDate(session.session_date),
          className: classData?.name || 'Unknown',
          attendanceStatus: record.status, // Send raw status (present, absent, late, excused)
          attendanceStatusFormatted: record.status.charAt(0).toUpperCase() + record.status.slice(1),
          quizGrade: record.quiz_grade !== null && record.quiz_grade !== undefined ? record.quiz_grade : null,
          quizTitles: quizzes.length > 0 ? quizzes.map((q: any) => q.title) : [],
          quizTitlesString: quizzes.length > 0 ? quizzes.map((q: any) => q.title).join(', ') : null,
          notes: record.notes || null,
          hasQuizGrade: record.quiz_grade !== null && record.quiz_grade !== undefined,
          hasNotes: !!record.notes,
          hasQuizzes: quizzes.length > 0,
        }
      })

    if (tableData.length === 0) {
      console.warn('[send-messages] no parent phone numbers', { debugId })
      return NextResponse.json(
        { success: false, error: 'No students with parent phone numbers found', debugId },
        { status: 400 }
      )
    }

    // Send table data to n8n webhook as a single request
    // n8n can then split this table using "Split Out Items" node
    try {
      console.log('[send-messages] sending payload to webhook', { debugId, total: tableData.length })
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: tableData, // Send as array/table
          total: tableData.length,
          sessionId: sessionId,
          sessionDate: formatDate(session.session_date),
          className: classData?.name || 'Unknown',
        }),
      })

      if (!response.ok) {
        const webhookText = await response.text().catch(() => 'Unable to read body')
        throw new Error(`HTTP error! status: ${response.status}; body: ${webhookText}`)
      }

      return NextResponse.json({
        success: true,
        message: `Message sent to ${tableData.length} parents`,
        total: tableData.length,
        debugId,
      })
    } catch (error) {
      console.error('[send-messages] webhook error', { debugId, error })
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to send data to webhook',
          debugId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[send-messages] unhandled error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send messages' },
      { status: 500 }
    )
  }
}

