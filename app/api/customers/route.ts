import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

// GET - List all customers with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    console.log('Customers list request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized customers access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const hasDebt = searchParams.get('hasDebt') === 'true';
    const isActive = searchParams.get('isActive');

    console.log('Customers query params:', { search, page, limit, hasDebt, isActive });

    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (hasDebt) {
      query.totalDebt = { $gt: 0 };
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      // Default to active customers only
      query.isActive = true;
    }

    // Execute queries in parallel
    const [customers, totalCount] = await Promise.all([
      Customer.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      Customer.countDocuments(query)
    ]);

    console.log(`Customers fetched: ${customers.length} of ${totalCount} total`);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Customers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    console.log('Create customer request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized customer creation attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, company, ice, phone, email, address, notes } = body;

    console.log('Customer creation data:', { name, phone, email });

    // Validation
    if (!name) {
      console.log('Missing required customer name');
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Check if customer with same name already exists
    const existingCustomer = await Customer.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    });
    
    if (existingCustomer) {
      console.log('Customer name already exists:', name);
      return NextResponse.json(
        { error: 'A customer with this name already exists' },
        { status: 409 }
      );
    }

    // Check if phone number already exists (if provided)
    if (phone) {
      const phoneExists = await Customer.findOne({ 
        phone: phone.trim(),
        isActive: true
      });
      
      if (phoneExists) {
        console.log('Phone number already exists:', phone);
        return NextResponse.json(
          { error: 'A customer with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    const newCustomer = new Customer({
      name: name.trim(),
      company: company?.trim() || undefined,
      ice: ice?.trim() || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined
    });

    await newCustomer.save();
    console.log('Customer created successfully:', newCustomer._id);

    return NextResponse.json(
      {
        message: 'Customer created successfully',
        customer: newCustomer
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Customer creation error:', error);
    
    // Handle mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}