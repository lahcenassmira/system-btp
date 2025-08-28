import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Purchase from '@/models/Purchase';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard data request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized dashboard access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Dashboard data requested by user:', user.userId);
    await connectDB();

    // Get current date boundaries
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log('Calculating dashboard metrics...');

    // Parallel queries for better performance
    const [
      todaySales,
      weekSales,
      monthSales,
      totalCustomers,
      lowStockProducts,
      recentSales,
      topProducts,
      totalProducts,
      unpaidCredits
    ] = await Promise.all([
      // Today's sales
      Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfDay, $lte: endOfDay },
            isPaid: true
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Week sales
      Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfWeek },
            isPaid: true
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Month sales
      Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfMonth },
            isPaid: true
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Total customers
      Customer.countDocuments({ isActive: true }),

      // Low stock products
      Product.find({
        $expr: { $lte: ['$quantity', '$minStockAlert'] }
      }).select('name quantity minStockAlert unit').limit(10),

      // Recent sales (last 10)
      Sale.find()
        .populate('productId', 'name unit')
        .populate('customerId', 'name')
        .sort({ saleDate: -1 })
        .limit(10),

      // Top selling products this month
      Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfMonth },
            isPaid: true
          }
        },
        {
          $group: {
            _id: '$productId',
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: '$totalAmount' },
            salesCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // Total products
      Product.countDocuments(),

      // Unpaid credits
      Sale.aggregate([
        {
          $match: {
            isPaid: false,
            paymentMethod: 'credit'
          }
        },
        {
          $group: {
            _id: null,
            totalUnpaid: { $sum: '$remainingAmount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate profits (simplified - sales minus estimated costs)
    const todayProfit = todaySales[0] ? todaySales[0].totalSales * 0.3 : 0; // Assuming 30% profit margin
    const weekProfit = weekSales[0] ? weekSales[0].totalSales * 0.3 : 0;
    const monthProfit = monthSales[0] ? monthSales[0].totalSales * 0.3 : 0;

    const dashboardData = {
      metrics: {
        todaySales: {
          amount: todaySales[0]?.totalSales || 0,
          count: todaySales[0]?.count || 0
        },
        weekSales: {
          amount: weekSales[0]?.totalSales || 0,
          count: weekSales[0]?.count || 0
        },
        monthSales: {
          amount: monthSales[0]?.totalSales || 0,
          count: monthSales[0]?.count || 0
        },
        todayProfit,
        weekProfit,
        monthProfit,
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
        unpaidCredits: {
          amount: unpaidCredits[0]?.totalUnpaid || 0,
          count: unpaidCredits[0]?.count || 0
        }
      },
      lowStockProducts,
      recentSales,
      topProducts
    };

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}