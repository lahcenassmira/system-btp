import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getUserFromRequest } from '@/lib/auth';

// GET - Get invoice statistics
export async function GET(request: NextRequest) {
  try {
    console.log('Get invoice stats request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized invoice stats access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Base filter
    const baseFilter = { userId: user.userId };
    const periodFilter = {
      ...baseFilter,
      invoiceDate: { $gte: startDate, $lte: endDate }
    };

    // Get overall statistics
    const [
      totalInvoices,
      totalAmount,
      paidInvoices,
      paidAmount,
      overdueInvoices,
      overdueAmount,
      draftInvoices,
      recentInvoices
    ] = await Promise.all([
      // Total invoices count
      Invoice.countDocuments(baseFilter),
      
      // Total amount
      Invoice.aggregate([
        { $match: baseFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Paid invoices
      Invoice.countDocuments({ ...baseFilter, status: 'paid' }),
      
      // Paid amount
      Invoice.aggregate([
        { $match: { ...baseFilter, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Overdue invoices
      Invoice.countDocuments({ 
        ...baseFilter, 
        status: 'overdue',
        dueDate: { $lt: new Date() }
      }),
      
      // Overdue amount
      Invoice.aggregate([
        { $match: { 
          ...baseFilter, 
          status: 'overdue',
          dueDate: { $lt: new Date() }
        }},
        { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
      ]),
      
      // Draft invoices
      Invoice.countDocuments({ ...baseFilter, status: 'draft' }),
      
      // Recent invoices
      Invoice.find(periodFilter)
        .sort({ invoiceDate: -1 })
        .limit(5)
        .populate('customerId', 'name')
        .lean()
    ]);

    // Get monthly revenue trend (last 6 months)
    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          ...baseFilter,
          status: 'paid',
          invoiceDate: { 
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get status distribution
    const statusDistribution = await Invoice.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get top customers by invoice amount
    const topCustomers = await Invoice.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customerName' },
          totalAmount: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 }
    ]);

    const stats = {
      overview: {
        totalInvoices,
        totalAmount: totalAmount[0]?.total || 0,
        paidInvoices,
        paidAmount: paidAmount[0]?.total || 0,
        overdueInvoices,
        overdueAmount: overdueAmount[0]?.total || 0,
        draftInvoices,
        averageInvoiceValue: totalInvoices > 0 ? (totalAmount[0]?.total || 0) / totalInvoices : 0,
        collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
      },
      trends: {
        monthlyRevenue: monthlyRevenue.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          revenue: item.revenue,
          count: item.count
        }))
      },
      distribution: {
        byStatus: statusDistribution.map(item => ({
          status: item._id,
          count: item.count,
          amount: item.amount
        }))
      },
      topCustomers: topCustomers.map(item => ({
        customerId: item._id,
        customerName: item.customerName,
        totalAmount: item.totalAmount,
        invoiceCount: item.invoiceCount
      })),
      recentInvoices: recentInvoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        invoiceDate: invoice.invoiceDate
      }))
    };

    console.log('Invoice stats calculated successfully');

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice statistics' },
      { status: 500 }
    );
  }
}
