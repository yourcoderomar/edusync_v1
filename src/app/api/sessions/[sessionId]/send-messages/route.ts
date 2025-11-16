import { NextRequest, NextResponse } from 'next/server'
import { createClient, isAdmin } from '@/lib/supabase/server'
import { getAttendanceBySession } from '@/lib/actions/attendance/get-attendance'
import { getQuizzesBySession } from '@/lib/actions/quizzes/get-quizzes'
import { getSessionById } from '@/lib/actions/sessions/get-sessions'
import { formatDate } from '@/lib/utils/format'

/**
 * API route for sending attendance messages to parents via n8n webhook
 * 
 * @security
 * - Validates user authentication
 * - Only admins can send messages
 * - Uses authenticated client (respects RLS policies)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    
    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only admins can send messages' },
        { status: 403 }
      )
    }

    // Get n8n webhook URL from environment variable
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'N8N webhook URL is not configured' },
        { status: 500 }
      )
    }

    // Fetch session data
    const sessionResult = await getSessionById(sessionId)
    if (!sessionResult.success || !sessionResult.data) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    const session = sessionResult.data
    const classData = session.classes as any

    // Fetch attendance data
    const attendanceResult = await getAttendanceBySession(sessionId)
    if (!attendanceResult.success) {
      return NextResponse.json(
        { success: false, error: attendanceResult.error || 'Failed to fetch attendance' },
        { status: 500 }
      )
    }

    const attendance = attendanceResult.data || []

    // Fetch quizzes for the session
    const quizzesResult = await getQuizzesBySession(sessionId)
    const quizzes = quizzesResult.success ? quizzesResult.data || [] : []

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
      return NextResponse.json(
        { success: false, error: 'No students with parent phone numbers found' },
        { status: 400 }
      )
    }

    // Send table data to n8n webhook as a single request
    // n8n can then split this table using "Split Out Items" node
    try {
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return NextResponse.json({
        success: true,
        message: `Message sent to ${tableData.length} parents`,
        total: tableData.length,
      })
    } catch (error) {
      console.error('Failed to send data to n8n webhook:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to send data to webhook' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send messages' },
      { status: 500 }
    )
  }
}

