import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import User from '../../../../models/User';
import Shop from '../../../../models/Shop';
import { hashPassword, generateToken, normalizePhone } from '../../../../lib/auth';
import { registerOwnerSchema } from '../../../../lib/validations';

export async function POST(request: NextRequest) {
  try {
    console.log('Owner registration attempt initiated');
    await connectDB();

    const body = await request.json();
    
    // Validate input data
    const validationResult = registerOwnerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Normalize phone numbers
    const userPhone = data.phone ? normalizePhone(data.phone) : undefined;
    const shopPhone = normalizePhone(data.shopPhone);

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        ...(data.email ? [{ email: data.email }] : []),
        ...(userPhone ? [{ phone: userPhone }] : [])
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create owner user first
    const user = new User({
      name: data.name,
      email: data.email || undefined,
      phone: userPhone || undefined,
      hashedPassword,
      preferredLanguage: data.preferredLanguage || 'fr',
      role: 'owner',
      shopId: null, // Will be updated after shop creation
    });

    const savedUser = await user.save();

    // Create shop with the correct owner ID
    const shop = new Shop({
      name: data.shopName,
      address: data.shopAddress,
      category: data.shopCategory,
      phone: shopPhone,
      description: data.shopDescription || '',
      ownerId: savedUser._id,
    });

    const savedShop = await shop.save();

    // Update user with correct shop ID
    await User.findByIdAndUpdate(savedUser._id, {
      shopId: savedShop._id
    });

    // Generate JWT token
    const token = generateToken({
      userId: savedUser._id.toString(),
      email: savedUser.email,
      phone: savedUser.phone,
      preferredLanguage: savedUser.preferredLanguage,
      role: savedUser.role,
      shopId: savedShop._id.toString(),
    });

    // Create response with token in cookie
    const response = NextResponse.json({
      message: 'Owner and shop registered successfully',
      userId: savedUser._id,
      shopId: savedShop._id,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        preferredLanguage: savedUser.preferredLanguage,
      },
      shop: {
        id: savedShop._id,
        name: savedShop.name,
        address: savedShop.address,
        category: savedShop.category,
        phone: savedShop.phone,
        description: savedShop.description,
      },
    }, { status: 201 });

    // Set HTTP-only cookie for security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
