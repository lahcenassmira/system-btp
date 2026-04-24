import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Return from '@/models/Return';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// Ensure models are registered
const ensureModelsLoaded = () => {
  // This ensures all models are loaded before queries
  Customer;
  Product;
  Sale;
};

// GET - List returns with filters
export async function GET(request: NextRequest) {
  try {
    console.log('Returns list request received');
    
    // Ensure models are loaded
    ensureModelsLoaded();
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized returns access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');

    console.log('Returns query params:', { page, limit, status, startDate, endDate, customerId, productId });

    // Build query
    const query: any = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.returnDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      query.customerId = customerId;
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }

    // Execute queries in parallel
    const [returns, totalCount] = await Promise.all([
      Return.find(query)
        .populate('productId', 'name unit category')
        .populate('customerId', 'name phone')
        .populate('saleId', 'saleDate paymentMethod')
        .sort({ returnDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      Return.countDocuments(query)
    ]);

    console.log(`Returns fetched: ${returns.length} of ${totalCount} total`);

    return NextResponse.json({
      returns,
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
    console.error('Returns fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// POST - Create new return
export async function POST(request: NextRequest) {
  try {
    console.log('Create return request received');
    
    // Ensure models are loaded
    ensureModelsLoaded();
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized return creation attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      saleId,
      productId,
      returnedQuantity,
      returnReason,
      notes
    } = body;

    console.log('Return creation data:', { saleId, productId, returnedQuantity, returnReason });

    // Validate required fields
    if (!saleId || !productId || !returnedQuantity) {
      return NextResponse.json(
        { error: 'Sale ID, Product ID, and returned quantity are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(saleId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: 'Invalid Sale ID or Product ID' },
        { status: 400 }
      );
    }

    // Find the original sale
    const sale = await Sale.findById(saleId).populate('productId');
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Verify the product matches the sale
    if (sale.productId._id.toString() !== productId) {
      return NextResponse.json(
        { error: 'Product does not match the sale' },
        { status: 400 }
      );
    }

    // Check if returned quantity is valid
    if (returnedQuantity <= 0 || returnedQuantity > sale.quantity) {
      return NextResponse.json(
        { error: 'Invalid returned quantity' },
        { status: 400 }
      );
    }

    // Check for existing returns for this sale to prevent over-returning
    const existingReturns = await Return.find({ 
      saleId, 
      status: { $in: ['pending', 'approved'] } 
    });
    
    const totalReturnedQuantity = existingReturns.reduce((sum, ret) => sum + ret.returnedQuantity, 0);
    
    if (totalReturnedQuantity + returnedQuantity > sale.quantity) {
      return NextResponse.json(
        { error: 'Total returned quantity would exceed original sale quantity' },
        { status: 400 }
      );
    }

    // Create the return
    const newReturn = new Return({
      saleId,
      productId,
      customerId: sale.customerId,
      returnedQuantity,
      originalQuantity: sale.quantity,
      originalSellPrice: sale.sellPrice,
      returnReason,
      notes,
      processedBy: user.email
    });

    await newReturn.save();

    // Populate the return for response
    const populatedReturn = await Return.findById(newReturn._id)
      .populate('productId', 'name unit category')
      .populate('customerId', 'name phone')
      .populate('saleId', 'saleDate paymentMethod');

    console.log('Return created successfully:', newReturn._id);

    return NextResponse.json({
      message: 'Return created successfully',
      return: populatedReturn
    }, { status: 201 });

  } catch (error) {
    console.error('Return creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create return' },
      { status: 500 }
    );
  }
}
