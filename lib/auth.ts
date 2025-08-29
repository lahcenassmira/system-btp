import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '../models/User';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  preferredLanguage: 'fr' | 'ar';
  role: UserRole;
  shopId: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  console.log('Hashing password...');
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log('Password hashed successfully');
  return hashedPassword;
}

/**
 * Compare a plain password with hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  console.log('Comparing password...');
  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log('Password comparison result:', isMatch);
  return isMatch;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  console.log('Generating JWT token for user:', payload.userId);
  const token = (jwt as any).sign(
    {
      userId: payload.userId,
      email: payload.email,
      phone: payload.phone,
      preferredLanguage: payload.preferredLanguage,
      role: payload.role,
      shopId: payload.shopId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  console.log('JWT token generated successfully');
  return token;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Get user from request token
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
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Moroccan phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Normalize phone number to standard format
 */
export function normalizePhone(phone: string): string {
  // Remove all spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Convert 0XXXXXXXXX to +212XXXXXXXXX
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+212' + cleaned.substring(1);
  }

  // If already starts with +212, return as is
  if (cleaned.startsWith('+212')) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }

  if (password.length > 50) {
    return { isValid: false, message: 'Password cannot exceed 50 characters' };
  }

  // Add more validation rules as needed
  return { isValid: true };
}

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Role-based authorization middleware
 * Returns a function that can be used in API routes to check user permissions
 */
export function authorizeRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest): Promise<{ authorized: boolean; user?: JWTPayload; error?: string }> => {
    try {
      // Get user from token
      const user = getUserFromRequest(request);
      
      if (!user) {
        return { authorized: false, error: 'Authentication required' };
      }

      // Check if user has required role
      if (!hasRole(user.role, allowedRoles)) {
        return { authorized: false, error: 'Insufficient permissions' };
      }

      return { authorized: true, user };
    } catch (error) {
      console.error('Authorization error:', error);
      return { authorized: false, error: 'Authorization failed' };
    }
  };
}

/**
 * Get authenticated user with full database info
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request);
    
    if (!tokenUser) {
      return null;
    }

    // Fetch full user data from database
    const user = await User.findById(tokenUser.userId).populate('shopId');
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}
