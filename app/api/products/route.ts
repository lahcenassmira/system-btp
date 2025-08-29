import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';

// GET - List all products with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    console.log('Products list request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized products access attempt');
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
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    console.log('Products query params:', { search, page, limit, category, lowStock });

    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && !search) {
      query.category = category;
    }

    if (lowStock) {
      query.$expr = { $lte: ['$quantity', '$minStockAlert'] };
    }

    // Execute queries in parallel
    const [products, totalCount, categories] = await Promise.all([
      Product.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      Product.countDocuments(query),
      
      Product.distinct('category', { 
        category: { 
          $nin: [null, '', undefined] 
        } 
      })
    ]);

    console.log(`Products fetched: ${products.length} of ${totalCount} total`);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      categories
    }, { status: 200 });

  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    console.log('Create product request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized product creation attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    console.log('Product creation data:', { name, unit, quantity, buyPrice, sellPrice });

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

    // Check if product name already exists
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingProduct) {
      console.log('Product name already exists:', name);
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 409 }
      );
    }

    const newProduct = new Product({
      name: name.trim(),
      unit,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      minStockAlert: Number(minStockAlert) || 5,
      category: category?.trim() || undefined,
      description: description?.trim() || undefined
    });

    await newProduct.save();
    console.log('Product created successfully:', newProduct._id);

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: newProduct
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}