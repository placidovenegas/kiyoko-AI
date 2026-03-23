import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getClaims() instead of getUser()/getSession() for secure JWT validation.
  // getClaims() validates the JWT signature against the project's published public keys.
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const pathname = request.nextUrl.pathname;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/forgot-password', '/pending', '/blocked', '/auth/callback', '/terms', '/privacy', '/docs', '/share'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';

  // If no valid claims and trying to access protected route
  if ((claimsError || !claims) && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user exists, check role
  if (claims && !isPublicRoute) {
    const userId = claims.sub;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const role = profile?.role;

      // No profile yet (trigger may not have fired) — allow through
      if (!role) {
        return supabaseResponse;
      }

      // Redirect based on role
      if (role === 'pending' && pathname !== '/pending') {
        const url = request.nextUrl.clone();
        url.pathname = '/pending';
        return NextResponse.redirect(url);
      }

      if (role === 'blocked' && pathname !== '/blocked') {
        const url = request.nextUrl.clone();
        url.pathname = '/blocked';
        return NextResponse.redirect(url);
      }

      // Admin-only routes
      if (pathname.startsWith('/admin') && role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    } catch {
      // Profile query failed, allow through
    }
  }

  // Logged in user on login/register pages → redirect to dashboard
  if (claims && ['/login', '/register', '/forgot-password'].some(r => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
