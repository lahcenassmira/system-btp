import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Shop, { type IShop } from '@/models/Shop';
import { hashPassword, isValidEmail, isValidPhone, normalizePhone, validatePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Registration attempt initiated');
    await connectDB();

    const body = await request.json();
    const { email, phone, password, confirmPassword, preferredLanguage, name, shopName, shopAddress, shopCategory, shopPhone, shopDescription } = body;

    console.log('Registration data received:', { email, phone, preferredLanguage, name, shopName, shopAddress, shopCategory });

    // Validation - require either email or phone (but not both), password, and name
    const hasEmail = email && email.trim();
    const hasPhone = phone && phone.trim();

    if (!name || !name.trim() || !password || !password.trim()) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }

    if (!hasEmail && !hasPhone) {
      console.log('Missing email or phone');
      return NextResponse.json(
        { error: 'Please provide either an email address or phone number' },
        { status: 400 }
      );
    }

    // If confirmPassword is provided, check they match. If not provided, use password as confirmPassword
    const actualConfirmPassword = confirmPassword || password;
    if (password !== actualConfirmPassword) {
      console.log('Passwords do not match');
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (hasEmail && !isValidEmail(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    let normalizedPhone: string | null = null;
    if (hasPhone) {
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

    // Validate shop information
    if (!shopName || !shopName.trim() || !shopAddress || !shopAddress.trim() || !shopCategory || !shopPhone || !shopPhone.trim()) {
      console.log('Missing shop required fields');
      return NextResponse.json(
        { error: 'Shop name, address, category, and phone are required' },
        { status: 400 }
      );
    }

    // Validate shop phone
    const normalizedShopPhone = normalizePhone(shopPhone);
    if (!isValidPhone(normalizedShopPhone)) {
      console.log('Invalid shop phone format:', shopPhone);
      return NextResponse.json(
        { error: 'Please enter a valid Moroccan phone number for shop phone' },
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
      name: name.trim(),
      hashedPassword,
      role: 'owner', // Default role for new registrations
      preferredLanguage: preferredLanguage || 'fr',
    };

    // Only set email if it's provided and not empty
    if (hasEmail) {
      userData.email = email.toLowerCase().trim();
    } else {
      userData.email = null;
    }

    // Only set phone if it's provided and normalized
    if (normalizedPhone) {
      userData.phone = normalizedPhone;
    } else {
      userData.phone = null;
    }

    // Create user first (without shopId initially)
    const newUser = new User(userData);
    await newUser.save();
    console.log('User created successfully:', newUser._id);

    // Create shop with ownerId reference
    const shopData = {
      name: shopName.trim(),
      address: shopAddress.trim(),
      category: shopCategory,
      phone: normalizedShopPhone,
      description: shopDescription ? shopDescription.trim() : '',
      ownerId: newUser._id,
    };

    const newShop = new Shop(shopData);
    await newShop.save();
    console.log('Shop created successfully:', newShop._id);

    // Get the shop ID as ObjectId
    const shopId = newShop._id as any;

    // Update user with shopId
    newUser.shopId = shopId;
    await newUser.save();
    console.log('User updated with shopId:', newShop._id);

    return NextResponse.json(
      {
        message: 'User registered successfully with shop',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          preferredLanguage: newUser.preferredLanguage,
          role: newUser.role,
          shopId: (shopId as any).toString(),
        },
        shop: {
          id: (shopId as any).toString(),
          name: newShop.name,
          address: newShop.address,
          category: newShop.category,
          phone: newShop.phone,
          description: newShop.description,
          ownerId: (newShop.ownerId as any).toString(),
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