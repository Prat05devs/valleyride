import { NextResponse, type NextRequest } from 'next/server';

/** Must match ACCESS_COOKIE in apps/api/src/modules/auth/tokens.ts. */
const ACCESS_COOKIE = 'vr_access';

/** Protects /account, /admin and the investor portal. Role checks happen in admin/layout.tsx and, authoritatively, in the API. */
export function middleware(req: NextRequest) {
  if (req.cookies.has(ACCESS_COOKIE)) return NextResponse.next();
  const login = new URL('/login', req.url);
  login.searchParams.set('next', req.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = { matcher: ['/account/:path*', '/admin/:path*', '/invest/portal/:path*', '/invest/onboarding'] };
