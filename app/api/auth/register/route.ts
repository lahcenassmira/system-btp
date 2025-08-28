import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword, isValidEmail, isValidPhone, normalizePhone, validatePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Registration attempt initiated');
    await connectDB();

    const body = await request.json();
    const { email, phone, password, confirmPassword, preferredLanguage } = body;

    console.log('Registration data received:', { email, phone, preferredLanguage });

    // Validation - require either email or phone
    if ((!email && !phone) || !password || !confirmPassword) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Either email or phone number, password, and confirm password are required' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    let normalizedPhone: string | null = null;
    if (phone) {
      normalizedPhone = normalizePhone(phone);
      if (!isValidPhone(normalizedPhone)) {
        console.log('Invalid phone format:', phone);
        return NextResponse.json(
          { error: 'Please enter a valid Moroccan phone number (06XXXXXXXX or +212XXXXXXXXX)' },
          { status: 400 }
        );
      }
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      console.log('Password validation failed:', passwordValidation.message);
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery: Array<Record<string, any>> = [];
    if (email) {
      existingUserQuery.push({ email: email.toLowerCase() });
    }
    if (normalizedPhone) {
      existingUserQuery.push({ phone: normalizedPhone });
    }

    const existingUser = existingUserQuery.length > 0 ? await User.findOne({ $or: existingUserQuery }) : null;
    if (existingUser) {
      const identifier = existingUser.email || existingUser.phone;
      console.log('User already exists:', identifier);
      return NextResponse.json(
        { error: 'User with this email or phone number already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);

    const userData: any = {
      hashedPassword,
      preferredLanguage: preferredLanguage || 'fr',
    };

    // Only set email if it's provided and not empty
    if (email && email.trim()) {
      userData.email = email.toLowerCase();
    } else {
      userData.email = null;
    }

    // Only set phone if it's provided and normalized
    if (normalizedPhone) {
      userData.phone = normalizedPhone;
    } else {
      userData.phone = null;
    }

    const newUser = new User(userData);
    await newUser.save();
    console.log('User created successfully:', newUser._id);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          phone: newUser.phone,
          preferredLanguage: newUser.preferredLanguage,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}