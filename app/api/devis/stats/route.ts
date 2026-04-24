import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/devis/stats - Get devis statistics
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const query = { userId: user.userId };

    // Get counts by status
    const [
      totalCount,
      draftCount,
      sentCount,
      acceptedCount,
      rejectedCount,
    ] = await Promise.all([
      Devis.countDocuments(query),
      Devis.countDocuments({ ...query, status: 'draft' }),
      Devis.countDocuments({ ...query, status: 'sent' }),
      Devis.countDocuments({ ...query, status: 'accepted' }),
      Devis.countDocuments({ ...query, status: 'rejected' }),
    ]);

    // Get total amounts
    const acceptedDevis = await Devis.find({ ...query, status: 'accepted' });
    const totalAcceptedAmount = acceptedDevis.reduce((sum, devis) => sum + devis.totalTTC, 0);

    const allDevis = await Devis.find(query);
    const totalPendingAmount = allDevis
      .filter(d => d.status === 'sent' || d.status === 'draft')
      .reduce((sum, devis) => sum + devis.totalTTC, 0);

    // Get recent devis
    const recentDevis = await Devis.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'name company')
      .lean();

    return NextResponse.json({
      stats: {
        total: totalCount,
        draft: draftCount,
        sent: sentCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        totalAcceptedAmount,
        totalPendingAmount,
      },
      recentDevis,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching devis stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devis stats', details: error.message },
      { status: 500 }
    );
  }
}
