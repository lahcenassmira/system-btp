/**
 * Client-side authentication utilities
 * These functions run in the browser and help with cookie-based authentication
 */

/**
 * Get a cookie value by name (client-side only)
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

/**
 * Get the auth token from cookies (client-side)
 * This replaces localStorage.getItem('auth-token')
 */
export function getAuthToken(): string | null {
  return getCookie('auth-token');
}

/**
 * Remove auth cookie (logout)
 */
export function removeAuthCookie(): void {
  if (typeof document === 'undefined') {
    return; // Server-side
  }
  
  document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * Create authenticated fetch headers with cookie token
 * This replaces the pattern of adding localStorage token to headers
 */
export function createAuthHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  // Only add Authorization header if we have a token
  // The server will also check the cookie automatically
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Authenticated fetch wrapper that automatically includes auth headers
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = createAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
    credentials: 'include', // Important: include cookies in requests
  });
}
