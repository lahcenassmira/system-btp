import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Sale from '@/models/Sale';
import Purchase from '@/models/Purchase';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Single product request received for ID:', id);

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized product access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid product ID format:', id);
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(id);

    if (!product) {
      console.log('Product not found:', id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Product fetched successfully:', product.name);
    return NextResponse.json({ product }, { status: 200 });

  } catch (error) {
    console.error('Single product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Update product request for ID:', id);

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized product update attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid product ID format:', id);
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      unit,
      quantity,
      buyPrice,
      sellPrice,
      minStockAlert,
      category,
      description
    } = body;

    console.log('Product update data:', { name, unit, quantity, buyPrice, sellPrice });

    // Validation
    if (!name || !unit || quantity == null || !buyPrice || !sellPrice) {
      console.log('Missing required product fields');
      return NextResponse.json(
        { error: 'Name, unit, quantity, buy price, and sell price are required' },
        { status: 400 }
      );
    }

    if (quantity < 0 || buyPrice < 0 || sellPrice < 0) {
      console.log('Invalid numeric values');
      return NextResponse.json(
        { error: 'Quantity and prices cannot be negative' },
        { status: 400 }
      );
    }

    if (sellPrice <= buyPrice) {
      console.log('Sell price must be higher than buy price');
      return NextResponse.json(
        { error: 'Sell price must be higher than buy price' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      console.log('Product not found for update:', id);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another product
    const nameConflict = await Product.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (nameConflict) {
      console.log('Product name conflict during update:', name);
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 409 }
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        unit,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        minStockAlert: Number(minStockAlert) || 5,
        category: category?.trim() || undefined,
        description: description?.trim() || undefined
      },
      { new: true, runValidators: true }
    );

    console.log('Product updated successfully:', updatedProduct?._id);

    return NextResponse.json(
      {
        message: 'Product updated successfully',
        product: updatedProduct
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Delete product request for ID:', id);

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized product deletion attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid product ID format:', id);
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has sales or purchases
    const [salesCount, purchasesCount] = await Promise.all([
      Sale.countDocuments({ productId: id }),
      Purchase.countDocuments({ productId: id })
    ]);

    if (salesCount > 0 || purchasesCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete product that has sales or purchase history. Consider archiving instead.'
        },
        { status: 400 }
      );
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}