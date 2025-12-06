import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const teaches = typeof body.teaches === 'string' ? body.teaches.trim() : ''
    const source = typeof body.source === 'string' ? body.source.trim() : 'landing'

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const supabase = createAdminClient() as any

    const { error } = await supabase.from('waitlist').insert({
      email,
      phone: phone || null,
      teaches: teaches || null,
      source,
    })

    if (error) {
      console.error('Error inserting waitlist entry:', error)
      return NextResponse.json(
        { error: 'Could not join the waitlist right now. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist handler error:', error)
    return NextResponse.json(
      { error: 'Unexpected error. Please try again later.' },
      { status: 500 }
    )
  }
}





