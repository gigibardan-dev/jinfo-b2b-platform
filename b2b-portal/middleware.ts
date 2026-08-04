import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── Rute protejate — necesită autentificare
  const protectedPaths = [
    '/dashboard',
    '/circuits',
    '/agency',
    '/admin',
  ]

  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ── Rute auth — redirect la dashboard corect după rol
  if (
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/register')
  ) {
    if (user) {
      // Determinăm rolul userului pentru redirect corect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? 'agency'
      const url = request.nextUrl.clone()

      if (role === 'admin' || role === 'superadmin' || role === 'operator') {
        url.pathname = '/admin/dashboard'
      } else {
        url.pathname = '/agency/dashboard'
      }

      return NextResponse.redirect(url)
    }
  }

  // ── Redirect /dashboard generic → dashboard corect per rol
  if (pathname === '/dashboard') {
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? 'agency'
      const url = request.nextUrl.clone()

      if (role === 'admin' || role === 'superadmin' || role === 'operator') {
        url.pathname = '/admin/dashboard'
      } else {
        url.pathname = '/agency/dashboard'
      }

      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}