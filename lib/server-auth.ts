import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, type JWTPayload } from '@/lib/auth';

/**
 * Get the authenticated user from server-side cookies
 * Returns null if no valid authentication is found
 */
export async function getAuthenticatedUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Require authentication for a server component or page
 * Redirects to login if not authenticated
 * @param redirectPath - The path to redirect back to after login (optional)
 */
export async function requireAuth(redirectPath?: string): Promise<JWTPayload> {
  const user = await getAuthenticatedUser();

  if (!user) {
    const loginUrl = redirectPath
      ? `/login?redirect=${encodeURIComponent(redirectPath)}`
      : '/login';
    redirect(loginUrl);
  }

  return user;
}

/**
 * Check if user is authenticated without redirecting
 * Useful for conditional rendering in server components
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}

/**
 * Get user data with fallback for unauthenticated users
 * Returns null if not authenticated, doesn't redirect
 */
export async function getOptionalUser(): Promise<JWTPayload | null> {
  return await getAuthenticatedUser();
}

/**
 * Redirect to login with the current path as redirect parameter
 * @param currentPath - The current path to redirect back to
 */
export function redirectToLogin(currentPath: string): never {
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
  redirect(loginUrl);
}

/**
 * Check if the user has a specific role or permission
 * This is a placeholder for future role-based access control
 * @param user - The authenticated user
 * @param permission - The permission to check
 */
export function hasPermission(user: JWTPayload, permission: string): boolean {
  // TODO: Implement role-based access control
  // For now, all authenticated users have all permissions
  return true;
}

/**
 * Require specific permission for a server component or page
 * Redirects to login if not authenticated, or shows error if no permission
 * @param permission - The required permission
 * @param redirectPath - The path to redirect back to after login (optional)
 */
export async function requirePermission(
  permission: string,
  redirectPath?: string
): Promise<JWTPayload> {
  const user = await requireAuth(redirectPath);

  if (!hasPermission(user, permission)) {
    // TODO: Redirect to access denied page or show error
    throw new Error(`Access denied: Missing permission '${permission}'`);
  }

  return user;
}
