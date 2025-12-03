import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js Middleware for authentication and route protection
 * 
 * @security
 * - Validates session on every request
 * - Protects routes based on authentication status
 * - Protects routes based on user role
 * - Refreshes auth tokens automatically
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Normalize pathname (remove trailing slash for consistent matching)
  const normalizedPathname = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname

  // Allow attendance scan page for both authenticated and unauthenticated users
  // This must be checked FIRST, even before calling updateSession
  if (normalizedPathname === '/attendance/scan' || normalizedPathname.startsWith('/attendance/scan')) {
    // Still need to update session for auth cookies, but don't block on errors
    try {
      const { supabaseResponse } = await updateSession(request)
      return supabaseResponse
    } catch (error) {
      // If session update fails, still allow access to scan page
      return NextResponse.next()
    }
  }

  // For all other routes, update session normally
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // Public routes that don't require authentication (excluding attendance/scan which is handled above)
  // Include:
  // - '/' landing page so marketing site is accessible without sign-in
  // - 'reset-password' so recovery links can be opened without being redirected to /signin
  const publicRoutes = ['/', '/signin', '/signup', '/reset-password']
  const isPublicRoute = publicRoutes.includes(normalizedPathname)
  
  // If user is not authenticated
  if (!user) {
    // Allow access to public routes
    if (isPublicRoute) {
      return supabaseResponse
    }
    
    // Redirect to sign in for protected routes
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    redirectUrl.searchParams.set('redirectTo', normalizedPathname)
    return NextResponse.redirect(redirectUrl)
  }

  // User is authenticated - get their profile to check role and profile picture
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_picture_url')
    .eq('id', user.id)
    .single()

  // Allow access to profile setup page
  const isProfileSetupRoute = normalizedPathname === '/profile/setup'
  
  // Type assertion for profile_picture_url which exists in actual database
  type ProfileWithPicture = { role: 'admin' | 'student' | 'instructor'; profile_picture_url: string | null }
  const typedProfile = profile as ProfileWithPicture | null

  // Check if profile picture is missing - redirect to setup (except if already on setup page or attendance scan)
  const isAttendanceScan = normalizedPathname === '/attendance/scan' || normalizedPathname.startsWith('/attendance/scan')
  if (typedProfile && !typedProfile.profile_picture_url && !isProfileSetupRoute && !isAttendanceScan) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/profile/setup'
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated user tries to access auth pages (signin/signup), redirect to dashboard
  if (isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    if (typedProfile?.role === 'admin') {
      redirectUrl.pathname = '/admin/dashboard'
    } else if (typedProfile?.role === 'instructor') {
      redirectUrl.pathname = '/instructor/dashboard'
    } else {
      redirectUrl.pathname = '/student/dashboard'
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based route protection
  const isAdminRoute = normalizedPathname.startsWith('/admin')
  const isStudentRoute = normalizedPathname.startsWith('/student')
  const adminOnlyRoutes = ['/admin/students']
  const isAdminOnlyRoute = adminOnlyRoutes.some(route => 
    normalizedPathname === route || normalizedPathname.startsWith(`${route}/`)
  )

  // Protect admin routes
  if (isAdminRoute) {
    if (typedProfile?.role === 'student') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/student/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    if (isAdminOnlyRoute && typedProfile?.role !== 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect student routes
  if (isStudentRoute && typedProfile?.role !== 'student') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handle auth separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}

