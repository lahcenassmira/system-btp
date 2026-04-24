import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import { getUserFromRequest } from '@/lib/auth';

// POST /api/devis/:id/send - Mark devis as sent
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

    if (devis.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft devis can be sent' },
        { status: 400 }
      );
    }

    devis.status = 'sent';
    await devis.save();

    return NextResponse.json(
      { message: 'Devis marked as sent', devis },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending devis:', error);
    return NextResponse.json(
      { error: 'Failed to send devis', details: error.message },
      { status: 500 }
    );
  }
}
