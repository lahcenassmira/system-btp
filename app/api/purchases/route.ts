import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - List purchases with filters
export async function GET(request: NextRequest) {
  try {
    console.log('Purchases list request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized purchases access attempt');
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
    const productId = searchParams.get('productId');
    const supplier = searchParams.get('supplier');

    console.log('Purchases query params:', { page, limit, startDate, endDate, productId, supplier });

    // Build query
    let query: any = {};

    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      query.productId = productId;
    }

    if (supplier) {
      query.supplier = { $regex: supplier, $options: 'i' };
    }

    // Execute queries in parallel
    const [purchases, totalCount] = await Promise.all([
      Purchase.find(query)
        .populate('productId', 'name unit category')
        .sort({ purchaseDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Purchase.countDocuments(query)
    ]);

    console.log(`Purchases fetched: ${purchases.length} of ${totalCount} total`);

    return NextResponse.json({
      purchases,
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
    console.error('Purchases fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}

// POST - Create new purchase
export async function POST(request: NextRequest) {
  try {
    console.log('Create purchase request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized purchase creation attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      productId,
      quantity,
      buyPrice,
      supplier,
      invoiceNumber,
      notes,
      updateStock = true
    } = body;

    console.log('Purchase creation data:', { productId, quantity, buyPrice, supplier, updateStock });

    // Validation
    if (!productId || !quantity || !buyPrice) {
      console.log('Missing required purchase fields');
      return NextResponse.json(
        { error: 'Product, quantity, and buy price are required' },
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

    if (quantity <= 0 || buyPrice < 0) {
      console.log('Invalid numeric values');
      return NextResponse.json(
        { error: 'Quantity must be positive and buy price cannot be negative' },
        { status: 400 }
      );
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create purchase
    const quantityNum = Number(quantity);
    const buyPriceNum = Number(buyPrice);
    const totalAmount = quantityNum * buyPriceNum;

    const purchaseData = {
      productId,
      quantity: quantityNum,
      buyPrice: buyPriceNum,
      totalAmount: totalAmount,
      supplier: supplier?.trim() || undefined,
      invoiceNumber: invoiceNumber?.trim() || undefined,
      notes: notes?.trim() || undefined
    };

    console.log('Creating purchase with data:', purchaseData);

    // Create the purchase
    const newPurchase = new Purchase(purchaseData);
    await newPurchase.save();

    console.log('Purchase created successfully:', newPurchase._id);

    // Update product stock and buy price if requested
    if (updateStock) {
      const updateData: any = {
        $inc: { quantity: quantityNum }
      };

      // Update buy price (you might want to calculate weighted average)
      updateData.buyPrice = buyPriceNum;

      console.log('Updating product stock:', {
        productId,
        quantityIncrease: quantityNum,
        newBuyPrice: buyPriceNum
      });

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true }
      );

      if (updatedProduct) {
        console.log('Product stock updated successfully. New quantity:', updatedProduct.quantity);
      } else {
        console.warn('Product update may have failed - product not found after update');
      }
    }

    return NextResponse.json(
      { message: 'Purchase created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Purchase creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}