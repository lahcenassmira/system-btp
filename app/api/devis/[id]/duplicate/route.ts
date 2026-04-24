import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/devis/:id/duplicate - Duplicate devis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const originalDevis = await Devis.findOne({
      _id: id,
      userId: user.userId,
    });

    if (!originalDevis) {
      return NextResponse.json({ error: 'Devis not found' }, { status: 404 });
    }

    // Create new devis with same data
    const newDevis = new Devis({
      userId: originalDevis.userId,
      clientId: originalDevis.clientId,
      clientName: originalDevis.clientName,
      clientCompany: originalDevis.clientCompany,
      clientPhone: originalDevis.clientPhone,
      clientEmail: originalDevis.clientEmail,
      clientAddress: originalDevis.clientAddress,
      chantierName: `${originalDevis.chantierName} (Copie)`,
      location: originalDevis.location,
      items: originalDevis.items,
      tvaRate: originalDevis.tvaRate,
      notes: originalDevis.notes,
      status: 'draft',
    });

    await newDevis.save();

    return NextResponse.json(
      { message: 'Devis duplicated successfully', devis: newDevis },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error duplicating devis:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate devis', details: error.message },
      { status: 500 }
    );
  }
}
