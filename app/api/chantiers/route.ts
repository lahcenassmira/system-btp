import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Chantier from '@/models/Chantier';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/chantiers - List all chantiers
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const query: any = { userId: user.userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    const chantiers = await Chantier.find(query)
      .populate('clientId', 'name company phone')
      .populate('devisId', 'devisNumber')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ chantiers }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching chantiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chantiers', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/chantiers - Create new chantier
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      clientId,
      clientName,
      chantierName,
      location,
      estimatedBudget,
      startDate,
      notes,
      devisId,
    } = body;

    if (!clientId || !clientName || !chantierName || !location || estimatedBudget === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const chantier = new Chantier({
      userId: user.userId,
      clientId,
      clientName,
      chantierName,
      location,
      estimatedBudget,
      startDate,
      notes,
      devisId,
      status: 'planned',
    });

    await chantier.save();

    return NextResponse.json(
      { message: 'Chantier created successfully', chantier },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating chantier:', error);
    return NextResponse.json(
      { error: 'Failed to create chantier', details: error.message },
      { status: 500 }
    );
  }
}
