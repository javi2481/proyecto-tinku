import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware: refresca cookies de sesión Supabase en cada request
 * y rutea según role (parent vs student) en el JWT metadata.
 *
 * role se setea al crear el auth.users:
 *   - parent: via admin.createUser({ user_metadata: { role: 'parent' } }) en signup
 *   - student: via signInAnonymously({ options: { data: { role: 'student' } } })
 */
export async function middleware(request: NextRequest) {
  // Fix "Invalid Server Actions request" en entornos con ingress proxy (Emergent preview):
  // el ingress reescribe x-forwarded-host al preview URL pero deja `origin` apuntando
  // al cluster interno. Next.js 14.2 compara ambos literalmente y rechaza la SA.
  // Normalizamos `origin` para que matchee `x-forwarded-host`.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const originHeader = request.headers.get('origin');
  const requestHeaders = new Headers(request.headers);
  if (forwardedHost && originHeader) {
    try {
      const originUrl = new URL(originHeader);
      if (originUrl.host !== forwardedHost) {
        requestHeaders.set('origin', `${originUrl.protocol}//${forwardedHost}`);
      }
    } catch {
      // origin malformado — lo dejamos pasar
    }
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const role = (user?.user_metadata as { role?: string } | undefined)?.role;

  const isParentArea =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/students' ||
    pathname.startsWith('/students/') ||
    pathname === '/account' ||
    pathname.startsWith('/account/');

  const isStudentArea =
    pathname === '/islas' ||
    pathname.startsWith('/islas/') ||
    pathname === '/isla' ||
    pathname.startsWith('/isla/');

  const isParentAuth = pathname === '/signup' || pathname === '/login';
  const isStudentAuth = pathname === '/entrar';

  // Parent area
  if (isParentArea) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (role === 'student') {
      const url = request.nextUrl.clone();
      url.pathname = '/islas';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Student area
  if (isStudentArea) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/entrar';
      return NextResponse.redirect(url);
    }
    if (role !== 'student') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Parent auth pages: si hay sesión parent, enviar al dashboard
  if (isParentAuth && user && role !== 'student') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Student auth page: si hay sesión student, enviar a islas
  if (isStudentAuth && user && role === 'student') {
    const url = request.nextUrl.clone();
    url.pathname = '/islas';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/signup',
    '/login',
    '/verify-email',
    '/entrar',
    '/dashboard/:path*',
    '/students/:path*',
    '/account/:path*',
    '/islas/:path*',
    '/isla/:path*',
  ],
};
