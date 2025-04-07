import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is authenticated
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // API routes that don't require authentication
  const publicApiRoutes = ['/api/register'];
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

  // Auth API routes should be accessible
  const isAuthRoute = pathname.startsWith('/api/auth');

  // Check if the route is an API route
  const isApiRoute = pathname.startsWith('/api');

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute && !isPublicApiRoute && !isAuthRoute) {
    // For API routes, return 401 Unauthorized
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
