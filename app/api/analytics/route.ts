import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Analytics data request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized analytics access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get('period') || '30');

    // Calculate date ranges
    const today = new Date();
    const currentPeriodStart = subDays(today, periodDays - 1);
    const previousPeriodStart = subDays(today, (periodDays * 2) - 1);
    const previousPeriodEnd = subDays(today, periodDays);

    console.log('Analytics period:', periodDays, 'days from:', currentPeriodStart);

    // Parallel queries for analytics data
    const [
      currentPeriodSales,
      previousPeriodSales,
      topProduct,
      totalCustomers,
      totalProducts
    ] = await Promise.all([
      // Current period sales
      Sale.aggregate([
        { $match: { saleDate: { $gte: currentPeriodStart } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalSales: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),

      // Previous period sales
      Sale.aggregate([
        {
          $match: {
            saleDate: {
              $gte: previousPeriodStart,
              $lt: previousPeriodEnd
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalSales: { $sum: 1 }
          }
        }
      ]),

      // Top selling product
      Sale.aggregate([
        { $match: { saleDate: { $gte: currentPeriodStart } } },
        {
          $group: {
            _id: '$productId',
            totalQuantity: { $sum: '$quantity' }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
      ]),

      // Total customers
      Customer.countDocuments({ isActive: true }),

      // Total products
      Product.countDocuments({ isActive: true })
    ]);

    // Process results
    const currentStats = currentPeriodSales[0] || { totalRevenue: 0, totalSales: 0, totalQuantity: 0 };
    const previousStats = previousPeriodSales[0] || { totalRevenue: 0, totalSales: 0 };
    const topProductData = topProduct[0];

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueGrowth = calculateGrowth(currentStats.totalRevenue, previousStats.totalRevenue);
    const salesGrowth = calculateGrowth(currentStats.totalSales, previousStats.totalSales);
    const customerGrowth = 15.2; // Mock value for now

    // Calculate average order value
    const averageOrderValue = currentStats.totalSales > 0
      ? Math.round(currentStats.totalRevenue / currentStats.totalSales)
      : 0;

    const stats = {
      totalRevenue: currentStats.totalRevenue,
      totalSales: currentStats.totalSales,
      averageOrderValue,
      topSellingProduct: topProductData?.product?.name || 'Aucun produit',
      revenueGrowth,
      salesGrowth,
      customerGrowth,
      productsSold: currentStats.totalQuantity,
      period: periodDays,
      totalCustomers,
      totalProducts
    };

    return NextResponse.json({
      success: true,
      stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}