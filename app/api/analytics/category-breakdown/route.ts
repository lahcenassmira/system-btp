import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Category breakdown analytics request received');

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

    // Get URL parameters for date filtering (optional)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`Fetching category breakdown for last ${days} days`);

    // Aggregate sales by product category
    const categoryBreakdown = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate }
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
          totalRevenue: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $project: {
          name: { $ifNull: ['$_id', 'Non catégorisé'] },
          value: '$totalRevenue',
          quantity: '$totalQuantity',
          salesCount: '$salesCount',
          _id: 0
        }
      }
    ]);



    // Calculate total for percentages
    const totalRevenue = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);

    // Add percentage to each category
    const dataWithPercentages = categoryBreakdown.map(category => ({
      ...category,
      percentage: totalRevenue > 0 ? Math.round((category.value / totalRevenue) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: dataWithPercentages,
      summary: {
        totalCategories: categoryBreakdown.length,
        totalRevenue,
        period: `${days} jours`
      }
    });

  } catch (error) {
    console.error('Category breakdown analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category breakdown data' },
      { status: 500 }
    );
  }
}
