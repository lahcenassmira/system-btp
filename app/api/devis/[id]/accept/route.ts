import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import Chantier from '@/models/Chantier';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/devis/:id/accept - Accept devis and create chantier
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const devis = await Devis.findOne({
      _id: params.id,
      userId: user.userId,
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis not found' }, { status: 404 });
    }

    if (devis.status === 'accepted') {
      return NextResponse.json(
        { error: 'Devis already accepted', chantierId: devis.chantierId },
        { status: 400 }
      );
    }

    if (devis.status === 'rejected') {
      return NextResponse.json(
        { error: 'Cannot accept rejected devis' },
        { status: 400 }
      );
    }

    // Get optional start date from request body
    const body = await request.json().catch(() => ({}));
    const { startDate } = body;

    // Create chantier from devis
    const chantier = new Chantier({
      userId: user.userId,
      devisId: devis._id,
      clientId: devis.clientId,
      clientName: devis.clientName,
      chantierName: devis.chantierName,
      location: devis.location,
      estimatedBudget: devis.totalTTC,
      actualCost: 0,
      status: 'planned',
      startDate: startDate ? new Date(startDate) : undefined,
      notes: devis.notes,
    });

    await chantier.save();

    // Update devis status
    devis.status = 'accepted';
    devis.chantierId = chantier._id;
    await devis.save();

    return NextResponse.json(
      {
        message: 'Devis accepted and chantier created',
        devis,
        chantier,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error accepting devis:', error);
    return NextResponse.json(
      { error: 'Failed to accept devis', details: error.message },
      { status: 500 }
    );
  }
}
