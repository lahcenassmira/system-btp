import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { type IUser } from '@/models/User';
import { comparePassword, generateToken, isValidEmail, isValidPhone, normalizePhone } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt initiated');
    await connectDB();

    const body = await request.json();
    const { identifier, password } = body; // Changed from 'email' to 'identifier'

    console.log('Login attempt for identifier:', identifier);

    // Validation
    if (!identifier || !password) {
      console.log('Missing identifier or password');
      return NextResponse.json(
        { error: 'Email/phone and password are required' },
        { status: 400 }
      );
    }

    // Determine if identifier is email or phone
    let user: IUser | null = null;
    if (isValidEmail(identifier)) {
      // It's an email
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      // Try as phone number
      const normalizedPhone = normalizePhone(identifier);
      if (isValidPhone(normalizedPhone)) {
        user = await User.findOne({ phone: normalizedPhone });
      } else {
        console.log('Invalid identifier format:', identifier);
        return NextResponse.json(
          { error: 'Please enter a valid email address or phone number' },
          { status: 400 }
        );
      }
    }

    if (!user) {
      console.log('User not found:', identifier);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', identifier);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User authenticated successfully:', user._id);

    // Generate JWT token
    const token = generateToken({
      userId: (user._id as unknown as string).toString(),
      email: user.email || undefined,
      phone: user.phone || undefined,
      preferredLanguage: user.preferredLanguage,
    });

    // Create response with token in cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone,
          preferredLanguage: user.preferredLanguage,
        },
        token,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie for additional security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('Login response prepared successfully');
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}