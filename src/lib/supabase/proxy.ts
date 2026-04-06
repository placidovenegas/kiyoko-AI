import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { normalizeError } from '@/lib/observability/logger';

function withRequestHeaders(response: NextResponse, requestId: string, reason?: string) {
  response.headers.set('x-request-id', requestId);
  if (reason) {
    response.headers.set('x-kiyoko-auth-reason', reason);
  }
  return response;
}

function buildRedirect(request: NextRequest, requestId: string, pathname: string, reason: string, includeNext = false) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  url.searchParams.set('reason', reason);

  if (includeNext) {
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    url.searchParams.set('next', nextPath);
  }

  return withRequestHeaders(NextResponse.redirect(url), requestId, reason);
}

export async function updateSession(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  let supabaseResponse = withRequestHeaders(NextResponse.next({
    request,
  }), requestId);

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
          supabaseResponse = withRequestHeaders(NextResponse.next({
            request,
          }), requestId);
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
  const isStaticAsset =
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$/i.test(pathname);

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/register', '/forgot-password', '/pending', '/blocked', '/auth/callback', '/terms', '/privacy', '/docs', '/share'];
  const isPublicRoute = isStaticAsset || publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/';

  // If no valid claims and trying to access protected route
  if ((claimsError || !claims) && !isPublicRoute) {
    console.warn('[auth/proxy] Missing or invalid claims for protected route', {
      requestId,
      pathname,
      claimsError: claimsError ? normalizeError(claimsError) : null,
    });
    return buildRedirect(request, requestId, '/login', claimsError ? 'session_invalid' : 'session_missing', true);
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
        console.info('[auth/proxy] Authenticated user has no profile yet', {
          requestId,
          pathname,
          userId,
        });
        return supabaseResponse;
      }

      // Redirect based on role
      if (role === 'pending' && pathname !== '/pending') {
        return buildRedirect(request, requestId, '/pending', 'profile_pending');
      }

      if (role === 'blocked' && pathname !== '/blocked') {
        return buildRedirect(request, requestId, '/blocked', 'profile_blocked');
      }

      // Admin-only routes
      if (pathname.startsWith('/admin') && role !== 'admin') {
        console.warn('[auth/proxy] Non-admin user attempted admin route', {
          requestId,
          pathname,
          userId,
          role,
        });
        return buildRedirect(request, requestId, '/dashboard', 'admin_required');
      }
    } catch (error) {
      console.error('[auth/proxy] Failed to resolve profile during session update', {
        requestId,
        pathname,
        userId,
        error: normalizeError(error),
      });
    }
  }

  // Logged in user on login/register pages → redirect to dashboard
  if (claims && ['/login', '/register', '/forgot-password'].some(r => pathname.startsWith(r))) {
    return buildRedirect(request, requestId, '/dashboard', 'already_authenticated');
  }

  return supabaseResponse;
}
