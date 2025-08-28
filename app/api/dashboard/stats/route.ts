import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard stats request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized dashboard stats access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const monthStart = startOfMonth(now);

    console.log('Calculating dashboard statistics...');

    // Parallel queries for better performance
    const [
      todaySalesData,
      totalSalesData,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      totalDebtData
    ] = await Promise.all([
      // Today's sales
      Sale.aggregate([
        { $match: { saleDate: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Total sales (all time)
      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalSales: { $sum: 1 }
          }
        }
      ]),

      // Total customers
      Customer.countDocuments({ isActive: true }),

      // Total products
      Product.countDocuments({ isActive: true }),

      // Low stock products
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$quantity', '$minStockAlert'] }
      }),

      // Total debt
      Sale.aggregate([
        {
          $match: {
            paymentMethod: 'credit',
            isPaid: false
          }
        },
        {
          $group: {
            _id: null,
            totalDebt: { $sum: '$remainingAmount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Process results
    const todayStats = todaySalesData[0] || { totalAmount: 0, count: 0 };
    const totalStats = totalSalesData[0] || { totalRevenue: 0, totalSales: 0 };
    const debtStats = totalDebtData[0] || { totalDebt: 0, count: 0 };

    const stats = {
      todaySales: todayStats.totalAmount,
      totalRevenue: totalStats.totalRevenue,
      totalSales: totalStats.totalSales,
      totalCustomers,
      totalProducts,
      pendingOrders: 0, // This would need an orders collection
      lowStockItems: lowStockProducts,
      totalDebt: debtStats.totalDebt,
      unpaidCredits: debtStats.count
    };

    return NextResponse.json({
      success: true,
      stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
