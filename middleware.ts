import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getUserFromRequest, hasRole, UserRole } from './lib/auth-middleware';

// Define role-based route permissions
const routePermissions: Record<string, string[]> = {
  '/dashboard/employees': ['owner'],
  '/api/employees': ['owner'],
  '/dashboard': ['owner', 'manager', 'accountant', 'cashier'],
  '/dashboard/sales': ['owner', 'manager', 'cashier'],
  '/dashboard/purchases': ['owner', 'manager', 'cashier'],
  '/dashboard/invoices': ['owner', 'manager', 'accountant', 'cashier'],
  '/dashboard/analytics': ['owner', 'accountant'],
  '/api/dashboard': ['owner', 'manager', 'accountant', 'cashier'],
  '/api/sales': ['owner', 'manager', 'cashier'],
  '/api/purchases': ['owner', 'manager', 'cashier'],
  '/api/invoices': ['owner', 'manager', 'accountant', 'cashier'],
  '/api/analytics': ['owner', 'accountant'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout'
  ];

  // Skip middleware for static files and Next.js internal routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    publicRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Get user from request token
  const user = getUserFromRequest(request);
  
  if (!user) {
    // No valid token found
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check role-based permissions
  const requiredRoles = routePermissions[pathname];
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    // User doesn't have required role
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    } else {
      // Redirect to dashboard with error
      return NextResponse.redirect(new URL('/dashboard?error=insufficient-permissions', request.url));
    }
  }

  // Add user info to request headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-shop-id', user.shopId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
