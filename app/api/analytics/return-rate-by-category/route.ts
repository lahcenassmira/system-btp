import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Return from '@/models/Return';
import Sale from '@/models/Sale';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Return rate by category analytics request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized return rate analytics access attempt');
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

    console.log(`Fetching return rate by category for last ${days} days`);

    // Get returns by category
    const returnsByCategory = await Return.aggregate([
      {
        $match: {
          returnDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          totalReturns: { $sum: 1 },
          totalReturnedQuantity: { $sum: '$returnedQuantity' },
          totalRefundAmount: { $sum: '$refundAmount' }
        }
      },
      {
        $project: {
          category: { $ifNull: ['$_id', 'Uncategorized'] },
          totalReturns: 1,
          totalReturnedQuantity: 1,
          totalRefundAmount: 1,
          _id: 0
        }
      },
      {
        $sort: { totalReturns: -1 }
      }
    ]);

    // Get sales by category for the same period to calculate return rates
    const salesByCategory = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: '$product.category',
          totalSales: { $sum: 1 },
          totalSoldQuantity: { $sum: '$quantity' },
          totalSalesAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          category: { $ifNull: ['$_id', 'Uncategorized'] },
          totalSales: 1,
          totalSoldQuantity: 1,
          totalSalesAmount: 1,
          _id: 0
        }
      }
    ]);

    // Combine returns and sales data to calculate return rates
    const categoryData: Array<{
      category: string;
      totalReturns: number;
      totalReturnedQuantity: number;
      totalRefundAmount: number;
      totalSales: number;
      totalSoldQuantity: number;
      totalSalesAmount: number;
      returnRate: number;
      quantityReturnRate: number;
    }> = [];
    const salesMap = new Map();
    
    // Create a map of sales data by category
    salesByCategory.forEach(sale => {
      salesMap.set(sale.category, sale);
    });

    // Process returns data and calculate rates
    returnsByCategory.forEach(returnData => {
      const salesData = salesMap.get(returnData.category) || {
        totalSales: 0,
        totalSoldQuantity: 0,
        totalSalesAmount: 0
      };

      const returnRate = salesData.totalSales > 0 
        ? (returnData.totalReturns / salesData.totalSales) * 100 
        : 0;

      const quantityReturnRate = salesData.totalSoldQuantity > 0
        ? (returnData.totalReturnedQuantity / salesData.totalSoldQuantity) * 100
        : 0;

      categoryData.push({
        category: returnData.category,
        totalReturns: returnData.totalReturns,
        totalReturnedQuantity: returnData.totalReturnedQuantity,
        totalRefundAmount: returnData.totalRefundAmount,
        totalSales: salesData.totalSales,
        totalSoldQuantity: salesData.totalSoldQuantity,
        totalSalesAmount: salesData.totalSalesAmount,
        returnRate: Math.round(returnRate * 100) / 100, // Round to 2 decimal places
        quantityReturnRate: Math.round(quantityReturnRate * 100) / 100
      });
    });

    // Add categories with sales but no returns
    salesByCategory.forEach(salesData => {
      if (!categoryData.find(item => item.category === salesData.category)) {
        categoryData.push({
          category: salesData.category,
          totalReturns: 0,
          totalReturnedQuantity: 0,
          totalRefundAmount: 0,
          totalSales: salesData.totalSales,
          totalSoldQuantity: salesData.totalSoldQuantity,
          totalSalesAmount: salesData.totalSalesAmount,
          returnRate: 0,
          quantityReturnRate: 0
        });
      }
    });

    // Sort by return rate descending
    categoryData.sort((a, b) => b.returnRate - a.returnRate);

    console.log(`Return rate by category data: ${categoryData.length} categories`);

    return NextResponse.json({
      success: true,
      data: categoryData,
      summary: {
        totalCategories: categoryData.length,
        totalReturns: categoryData.reduce((sum, cat) => sum + cat.totalReturns, 0),
        totalSales: categoryData.reduce((sum, cat) => sum + cat.totalSales, 0),
        overallReturnRate: categoryData.length > 0 
          ? categoryData.reduce((sum, cat) => sum + cat.returnRate, 0) / categoryData.length 
          : 0,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Return rate by category analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return rate by category data' },
      { status: 500 }
    );
  }
}
