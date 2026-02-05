import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // API routes should be handled separately
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages (but allow home page)
  if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Redirect non-logged-in users to login for protected routes
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
