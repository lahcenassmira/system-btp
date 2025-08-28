import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - List sales with filters
export async function GET(request: NextRequest) {
  try {
    console.log('Sales list request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized sales access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');
    const paymentMethod = searchParams.get('paymentMethod');
    const isPaid = searchParams.get('isPaid');

    console.log('Sales query params:', { page, limit, startDate, endDate, customerId, paymentMethod, isPaid });

    // Build query
    let query: any = {};
    
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      query.customerId = customerId;
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (isPaid !== null && isPaid !== undefined) {
      query.isPaid = isPaid === 'true';
    }

    // Execute queries in parallel
    const [sales, totalCount] = await Promise.all([
      Sale.find(query)
        .populate('productId', 'name unit category')
        .populate('customerId', 'name phone')
        .sort({ saleDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      Sale.countDocuments(query)
    ]);

    console.log(`Sales fetched: ${sales.length} of ${totalCount} total`);

    return NextResponse.json({
      sales,
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
    console.error('Sales fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST - Create new sale
export async function POST(request: NextRequest) {
  try {
    console.log('Create sale request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized sale creation attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { 
      productId, 
      customerId, 
      quantity, 
      sellPrice, 
      paymentMethod, 
      paidAmount,
      notes 
    } = body;

    console.log('Sale creation data:', { productId, customerId, quantity, sellPrice, paymentMethod });

    // Validation
    if (!productId || !quantity || !sellPrice || !paymentMethod) {
      console.log('Missing required sale fields');
      return NextResponse.json(
        { error: 'Product, quantity, sell price, and payment method are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('Invalid product ID:', productId);
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    if (quantity <= 0 || sellPrice <= 0) {
      console.log('Invalid numeric values');
      return NextResponse.json(
        { error: 'Quantity and sell price must be positive' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'credit' && (!customerId || !mongoose.Types.ObjectId.isValid(customerId))) {
      console.log('Credit sales require valid customer');
      return NextResponse.json(
        { error: 'Credit sales must have a valid customer' },
        { status: 400 }
      );
    }

    // Check product exists and has sufficient stock
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.quantity < quantity) {
      console.log('Insufficient stock:', { available: product.quantity, requested: quantity });
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.quantity} ${product.unit}` },
        { status: 400 }
      );
    }

    // Check customer exists if provided
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        console.log('Customer not found:', customerId);
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
    }

    // Create sale without transaction for standalone MongoDB
    const totalAmount = Number(quantity) * Number(sellPrice);
    const paidAmountValue = paymentMethod === 'credit' ? Number(paidAmount || 0) : totalAmount;
    const remainingAmountValue = paymentMethod === 'credit' ? totalAmount - paidAmountValue : 0;

    const saleData = {
      productId,
      customerId: customerId || undefined,
      quantity: Number(quantity),
      sellPrice: Number(sellPrice),
      totalAmount: totalAmount,
      paymentMethod,
      paidAmount: paidAmountValue,
      remainingAmount: remainingAmountValue,
      isPaid: paymentMethod !== 'credit' || remainingAmountValue <= 0,
      notes: notes?.trim() || undefined
    };

    // Create sale
    const newSale = new Sale(saleData);
    await newSale.save();

    // Update product stock
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { quantity: -quantity } }
    );

    // Update customer stats if applicable
    if (customer) {
      const updateData: any = {
        $inc: { 
          totalPurchases: newSale.totalAmount 
        },
        lastPurchaseDate: new Date()
      };

      // If it's credit, add to debt
      if (paymentMethod === 'credit') {
        updateData.$inc.totalDebt = newSale.remainingAmount;
      }

      await Customer.findByIdAndUpdate(
        customerId,
        updateData
      );
    }

    console.log('Sale created successfully:', newSale._id);

    return NextResponse.json(
      { message: 'Sale created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Sale creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
