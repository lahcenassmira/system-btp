import { z } from 'zod';
import { UserRole } from '../models/User';

// Phone number validation for Moroccan numbers
const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;

export const registerOwnerSchema = z.object({
  // User fields
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid Moroccan phone number')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password cannot exceed 50 characters'),
  preferredLanguage: z.enum(['fr', 'ar']).default('fr'),

  // Shop fields
  shopName: z.string()
    .min(2, 'Shop name must be at least 2 characters')
    .max(100, 'Shop name cannot exceed 100 characters')
    .trim(),
  shopAddress: z.string()
    .min(5, 'Shop address must be at least 5 characters')
    .max(200, 'Shop address cannot exceed 200 characters')
    .trim(),
  shopCategory: z.string()
    .min(2, 'Shop category must be at least 2 characters')
    .max(50, 'Shop category cannot exceed 50 characters')
    .trim(),
  shopPhone: z.string()
    .regex(phoneRegex, 'Please enter a valid Moroccan phone number for shop'),
  shopDescription: z.string()
    .max(500, 'Shop description cannot exceed 500 characters')
    .optional()
    .default(''),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone number is required',
    path: ['email'],
  }
);

export const createEmployeeSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(phoneRegex, 'Please enter a valid Moroccan phone number')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password cannot exceed 50 characters'),
  role: z.enum(['cashier', 'accountant', 'manager'] as const)
    .refine(val => val !== 'owner', 'Cannot create owner through employee endpoint'),
  preferredLanguage: z.enum(['fr', 'ar']).default('fr'),
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone number is required',
    path: ['email'],
  }
);

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'), // Can be email or phone
  password: z.string().min(1, 'Password is required'),
});

// Type exports for use in components
export type RegisterOwnerData = z.infer<typeof registerOwnerSchema>;
export type CreateEmployeeData = z.infer<typeof createEmployeeSchema>;
export type LoginData = z.infer<typeof loginSchema>;
