import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Sales trend analytics request received');
    
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

    // Get the last 30 days
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, 29));

    console.log('Fetching sales trend from', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));

    // Aggregate sales by date for the last 30 days
    const salesTrend = await Sale.aggregate([
      {
        $match: {
          saleDate: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$saleDate"
            }
          },
          totalAmount: { $sum: "$totalAmount" },
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          amount: "$totalAmount",
          count: "$salesCount",
          _id: 0
        }
      }
    ]);

    console.log(`Sales trend data points: ${salesTrend.length}`);

    // Fill in missing dates with zero values
    const completeData: { date: string; amount: number; count: number; }[] = [];
    for (let i = 0; i < 30; i++) {
      const currentDate = startOfDay(subDays(endDate, 29 - i));
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      const existingData = salesTrend.find(item => item.date === dateStr);
      
      completeData.push({
        date: dateStr,
        amount: existingData?.amount || 0,
        count: existingData?.count || 0
      });
    }

    return NextResponse.json({
      success: true,
      data: completeData,
      summary: {
        totalDays: 30,
        totalSales: completeData.reduce((sum, day) => sum + day.amount, 0),
        totalTransactions: completeData.reduce((sum, day) => sum + day.count, 0),
        averageDaily: completeData.reduce((sum, day) => sum + day.amount, 0) / 30
      }
    });

  } catch (error) {
    console.error('Sales trend analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales trend data' },
      { status: 500 }
    );
  }
}
