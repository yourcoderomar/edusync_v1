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
export const runtime = 'nodejs' // Use Node.js runtime for better compatibility
export const maxDuration = 30 // Maximum execution time in seconds (Vercel Pro plan allows up to 60s)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const debugId = randomUUID()
    const { sessionId } = await params

    console.log('[send-messages] request start', { debugId, sessionId })
    
    // Check if user is admin
    let canSendMessages: boolean
    try {
      canSendMessages = await isAdminOrInstructor()
    } catch (error) {
      console.error('[send-messages] error checking permissions', { debugId, error })
      return NextResponse.json(
        { success: false, error: 'Failed to verify permissions', debugId },
        { status: 500 }
      )
    }
    
    if (!canSendMessages) {
      console.warn('[send-messages] unauthorized attempt', { debugId, sessionId })
      return NextResponse.json(
        { success: false, error: 'Only admins or instructors can send messages' },
        { status: 403 }
      )
    }

    // Get n8n webhook URL from environment variable
    // Check both N8N_WEBHOOK_URL and NEXT_PUBLIC_N8N_WEBHOOK_URL for flexibility
    const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    console.log('[send-messages] webhook url resolved', { 
      debugId, 
      hasUrl: !!webhookUrl,
      env: process.env.NODE_ENV,
      // Don't log the actual URL for security
    })
    if (!webhookUrl) {
      console.error('[send-messages] missing webhook URL', { 
        debugId,
        availableEnvVars: Object.keys(process.env).filter(k => k.includes('N8N') || k.includes('WEBHOOK'))
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N webhook URL is not configured. Please set N8N_WEBHOOK_URL environment variable in Vercel.', 
          debugId 
        },
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
    
    // Validate session data
    if (!session.session_date) {
      console.error('[send-messages] session missing session_date', { debugId, sessionId })
      return NextResponse.json(
        { success: false, error: 'Session is missing required date information', debugId },
        { status: 500 }
      )
    }
    
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
    let tableData: any[]
    try {
      tableData = attendance
        .filter((record: any) => {
          const student = record.student as any
          return student?.parent_phone_number
        })
        .map((record: any) => {
          const student = record.student as any
          const status = record.status || 'unknown'
          
          // Safely format the date
          let formattedDate: string
          try {
            formattedDate = formatDate(session.session_date)
          } catch (dateError) {
            console.error('[send-messages] date formatting error', { debugId, sessionDate: session.session_date })
            formattedDate = new Date(session.session_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          }
          
          return {
            phone: student.parent_phone_number,
            parent_phone_number: student.parent_phone_number,
            studentName: student.full_name || 'Unknown',
            sessionDate: formattedDate,
            className: classData?.name || 'Unknown',
            attendanceStatus: status, // Send raw status (present, absent, late, excused)
            attendanceStatusFormatted: status.charAt(0).toUpperCase() + status.slice(1),
            quizGrade: record.quiz_grade !== null && record.quiz_grade !== undefined ? record.quiz_grade : null,
            quizTitles: quizzes.length > 0 ? quizzes.map((q: any) => q.title).filter(Boolean) : [],
            quizTitlesString: quizzes.length > 0 ? quizzes.map((q: any) => q.title).filter(Boolean).join(', ') : null,
            notes: record.notes || null,
            hasQuizGrade: record.quiz_grade !== null && record.quiz_grade !== undefined,
            hasNotes: !!record.notes,
            hasQuizzes: quizzes.length > 0,
          }
        })
    } catch (error) {
      console.error('[send-messages] error processing table data', { debugId, error })
      return NextResponse.json(
        { success: false, error: 'Failed to process attendance data', debugId },
        { status: 500 }
      )
    }

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
      
      // Safely format the date for the webhook payload
      let formattedSessionDate: string
      try {
        formattedSessionDate = formatDate(session.session_date)
      } catch (dateError) {
        formattedSessionDate = new Date(session.session_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      // Add timeout for fetch (25 seconds to stay under 30s maxDuration)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Alemni/1.0',
          },
          body: JSON.stringify({
            data: tableData, // Send as array/table
            total: tableData.length,
            sessionId: sessionId,
            sessionDate: formattedSessionDate,
            className: classData?.name || 'Unknown',
          }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
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
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout: Webhook took too long to respond')
        }
        throw fetchError
      }

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
    console.error('[send-messages] unhandled error', { 
      debugId: randomUUID(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    })
    
    // Handle specific error types
    if (error instanceof Error) {
      // Check if it's a ForbiddenError or similar
      if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        )
      }
      
      // Check if it's a NotFoundError
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send messages',
        debugId: randomUUID()
      },
      { status: 500 }
    )
  }
}

