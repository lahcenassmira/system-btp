import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { data, createBackup = true } = body;

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
      backup: null as any
    };

    // Create backup if requested
    if (createBackup) {
      const existingProducts = await Product.find().lean();
      results.backup = {
        timestamp: new Date(),
        count: existingProducts.length,
        data: existingProducts
      };
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.name || !row.unit || row.buyPrice === undefined || row.sellPrice === undefined) {
          throw new Error('Missing required fields: name, unit, buyPrice, sellPrice');
        }

        // Check if product exists
        const existingProduct = await Product.findOne({
          name: { $regex: new RegExp(`^${row.name}$`, 'i') }
        });

        if (existingProduct) {
          // Update existing product
          await Product.findByIdAndUpdate(existingProduct._id, {
            name: row.name,
            unit: row.unit,
            quantity: row.quantity !== undefined ? Number(row.quantity) : existingProduct.quantity,
            buyPrice: Number(row.buyPrice),
            sellPrice: Number(row.sellPrice),
            minStockAlert: row.minStockAlert !== undefined ? Number(row.minStockAlert) : existingProduct.minStockAlert,
            category: row.category || existingProduct.category,
            description: row.description || existingProduct.description
          });
        } else {
          // Create new product
          const newProduct = new Product({
            name: row.name,
            unit: row.unit,
            quantity: row.quantity ? Number(row.quantity) : 0,
            buyPrice: Number(row.buyPrice),
            sellPrice: Number(row.sellPrice),
            minStockAlert: row.minStockAlert ? Number(row.minStockAlert) : 5,
            category: row.category,
            description: row.description
          });
          await newProduct.save();
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: row,
          error: error.message
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Product import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}