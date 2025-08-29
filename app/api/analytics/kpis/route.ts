import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Return from '@/models/Return';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('KPIs analytics request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized KPIs analytics access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get the last 30 days
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, 29));

    console.log('Calculating KPIs for the last 30 days');

    // Parallel queries for all KPIs
    const [
      salesData,
      topProduct,
      totalCustomers,
      newCustomers,
      lowStockProducts,
      returnsData
    ] = await Promise.all([
      // Sales data for the period
      Sale.aggregate([
        { $match: { saleDate: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        }
      ]),

      // Top selling product
      Sale.aggregate([
        { $match: { saleDate: { $gte: startDate } } },
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

      // New customers in the period
      Customer.countDocuments({
        createdAt: { $gte: startDate },
        isActive: true
      }),

      // Low stock products
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$quantity', '$minStockAlert'] }
      }),

      // Returns data for the period
      Return.aggregate([
        { $match: { returnDate: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalReturns: { $sum: 1 },
            totalReturnedQuantity: { $sum: '$returnedQuantity' },
            totalRefundAmount: { $sum: '$refundAmount' }
          }
        }
      ])
    ]);

    // Process results
    const sales = salesData[0] || { totalSales: 0, totalOrders: 0, totalQuantity: 0 };
    const topProductData = topProduct[0];
    const returns = returnsData[0] || { totalReturns: 0, totalReturnedQuantity: 0, totalRefundAmount: 0 };

    // Calculate average basket
    const averageBasket = sales.totalOrders > 0
      ? Math.round(sales.totalSales / sales.totalOrders)
      : 0;

    const kpiData = {
      totalSales: sales.totalSales,
      totalOrders: sales.totalOrders,
      totalCustomers,
      averageBasket,
      lowStock: lowStockProducts,
      bestProduct: topProductData?.product?.name || 'Aucun produit',
      newCustomers,
      totalReturns: returns.totalReturns
    };

    console.log('KPIs calculated:', {
      totalSales: kpiData.totalSales,
      totalOrders: kpiData.totalOrders,
      totalCustomers: kpiData.totalCustomers,
      averageBasket: kpiData.averageBasket,
      lowStock: kpiData.lowStock,
      bestProduct: kpiData.bestProduct,
      newCustomers: kpiData.newCustomers,
      totalReturns: kpiData.totalReturns
    });

    return NextResponse.json({
      success: true,
      data: kpiData,
      period: '30 days',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('KPIs analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs data' },
      { status: 500 }
    );
  }
}
