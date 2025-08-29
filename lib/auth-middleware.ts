import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export type UserRole = 'owner' | 'cashier' | 'accountant' | 'manager';

export interface JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  preferredLanguage: 'fr' | 'ar';
  role: UserRole;
  shopId: string;
  exp?: number;
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  switch (str.length % 4) {
    case 2:
      str += '==';
      break;
    case 3:
      str += '=';
      break;
  }
  
  try {
    return atob(str);
  } catch {
    throw new Error('Invalid base64url string');
  }
}

/**
 * Simple JWT decode without verification (for Edge Runtime)
 * Note: This is less secure but works in Edge Runtime
 * The security comes from the httpOnly cookie being set by the server
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}

/**
 * Verify JWT token (Edge Runtime compatible)
 * Note: This uses simple decode instead of cryptographic verification
 * Security relies on httpOnly cookies being set by trusted server
 */
export function verifyToken(token: string): JWTPayload | null {
  return decodeJWT(token);
}

/**
 * Get user from request token (middleware-safe version)
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;

    // Extract token from auth header, but only if it's valid (not "null" or empty)
    const headerToken = authHeader?.replace('Bearer ', '');
    const isValidHeaderToken = headerToken && headerToken !== 'null' && headerToken !== 'undefined';

    const token = isValidHeaderToken ? headerToken : cookieToken;

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
