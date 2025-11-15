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
  const { supabaseResponse, user, supabase } = await updateSession(request)
  
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/signin', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // If user is not authenticated
  if (!user) {
    // Allow access to public routes
    if (isPublicRoute) {
      return supabaseResponse
    }
    
    // Redirect to sign in for protected routes
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // User is authenticated - get their profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = profile?.role === 'admin' 
      ? '/admin/dashboard' 
      : '/student/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based route protection
  const isAdminRoute = pathname.startsWith('/admin')
  const isStudentRoute = pathname.startsWith('/student')

  // Protect admin routes
  if (isAdminRoute && profile?.role !== 'admin') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/student/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Protect student routes
  if (isStudentRoute && profile?.role !== 'student') {
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

