import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get all unpaid credit sales
export async function GET(request: NextRequest) {
  try {
    console.log('Credit sales request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized credit access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('Credit query params:', { customerId, page, limit });

    // Build query for unpaid credit sales
    let query: any = {
      paymentMethod: 'credit',
      isPaid: false,
      remainingAmount: { $gt: 0 }
    };

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      query.customerId = customerId;
    }

    // Execute queries in parallel
    const [creditSales, totalCount, customerSummary] = await Promise.all([
      Sale.find(query)
        .populate('productId', 'name unit')
        .populate('customerId', 'name phone')
        .sort({ saleDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      
      Sale.countDocuments(query),

      // Get summary by customer
      Sale.aggregate([
        {
          $match: {
            paymentMethod: 'credit',
            isPaid: false,
            remainingAmount: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$customerId',
            totalDebt: { $sum: '$remainingAmount' },
            salesCount: { $sum: 1 },
            oldestSale: { $min: '$saleDate' }
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $unwind: '$customer'
        },
        {
          $sort: { totalDebt: -1 }
        }
      ])
    ]);

    console.log(`Credit sales fetched: ${creditSales.length} of ${totalCount} total`);

    return NextResponse.json({
      creditSales,
      customerSummary,
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
    console.error('Credit sales fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit sales' },
      { status: 500 }
    );
  }
}