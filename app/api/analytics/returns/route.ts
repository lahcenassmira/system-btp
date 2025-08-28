import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Return from '@/models/Return';
import { getUserFromRequest } from '@/lib/auth';
import { startOfDay, subDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    console.log('Returns analytics request received');

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized returns analytics access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get the last 30 days
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, 29));

    console.log('Fetching returns data from', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));

    // Aggregate returns by date for the last 30 days
    const returnsData = await Return.aggregate([
      {
        $match: {
          returnDate: {
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
              date: "$returnDate"
            }
          },
          returns: { $sum: 1 },
          totalRefundAmount: { $sum: "$refundAmount" },
          totalReturnedQuantity: { $sum: "$returnedQuantity" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          returns: 1,
          totalRefundAmount: 1,
          totalReturnedQuantity: 1,
          _id: 0
        }
      }
    ]);

    // Fill in missing dates with zero returns
    const completeData: Array<{
      date: string;
      returns: number;
      totalRefundAmount: number;
      totalReturnedQuantity: number;
      formattedDate: string;
    }> = [];
    for (let i = 0; i < 30; i++) {
      const currentDate = startOfDay(subDays(endDate, 29 - i));
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const existingData = returnsData.find(item => item.date === dateStr);

      completeData.push({
        date: dateStr,
        returns: existingData?.returns || 0,
        totalRefundAmount: existingData?.totalRefundAmount || 0,
        totalReturnedQuantity: existingData?.totalReturnedQuantity || 0,
        formattedDate: format(currentDate, 'dd MMM', { locale: fr })
      });
    }

    console.log(`Returns data points: ${completeData.length}`);

    return NextResponse.json({
      success: true,
      data: completeData,
      summary: {
        totalDays: 30,
        totalReturns: completeData.reduce((sum, day) => sum + day.returns, 0),
        totalRefundAmount: completeData.reduce((sum, day) => sum + day.totalRefundAmount, 0),
        totalReturnedQuantity: completeData.reduce((sum, day) => sum + day.totalReturnedQuantity, 0),
        averageDaily: completeData.reduce((sum, day) => sum + day.returns, 0) / 30
      }
    });

  } catch (error) {
    console.error('Returns analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns data' },
      { status: 500 }
    );
  }
}
