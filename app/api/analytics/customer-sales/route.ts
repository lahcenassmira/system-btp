import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Customer sales analytics request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized customer sales analytics access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Get the date range
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days - 1));

    console.log(`Fetching customer sales for last ${days} days`);

    // Get sales by customer
    const customerSales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$customerId',
          customerName: { 
            $first: { 
              $ifNull: ['$customer.name', 'Client anonyme'] 
            } 
          },
          totalAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$saleDate' }
        }
      },
      {
        $project: {
          customerName: 1,
          totalAmount: 1,
          orderCount: 1,
          lastOrderDate: 1,
          _id: 0
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 10 // Top 10 customers
      }
    ]);

    console.log(`Customer sales data: ${customerSales.length} customers`);

    return NextResponse.json({
      success: true,
      data: customerSales,
      summary: {
        totalCustomers: customerSales.length,
        totalAmount: customerSales.reduce((sum, customer) => sum + customer.totalAmount, 0),
        totalOrders: customerSales.reduce((sum, customer) => sum + customer.orderCount, 0),
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Customer sales analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer sales data' },
      { status: 500 }
    );
  }
}
