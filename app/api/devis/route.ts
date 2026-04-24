import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/devis - List all devis with filters
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
    const search = searchParams.get('search');

    const query: any = { userId: user.userId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    if (search) {
      query.$or = [
        { devisNumber: { $regex: search, $options: 'i' } },
        { chantierName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const devisList = await Devis.find(query)
      .populate('clientId', 'name company phone email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ devis: devisList }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching devis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devis', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/devis - Create new devis
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
      chantierName,
      location,
      items,
      tvaRate,
      notes,
      validUntil,
    } = body;

    // Validate required fields
    if (!clientId || !chantierName || !location || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client information
    const client = await Customer.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create devis
    const devis = new Devis({
      userId: user.userId,
      clientId,
      clientName: client.name,
      clientCompany: client.company,
      clientPhone: client.phone,
      clientEmail: client.email,
      clientAddress: client.address,
      chantierName,
      location,
      items,
      tvaRate: tvaRate || 20,
      notes,
      validUntil,
      status: 'draft',
    });

    await devis.save();

    return NextResponse.json(
      { message: 'Devis created successfully', devis },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating devis:', error);
    return NextResponse.json(
      { error: 'Failed to create devis', details: error.message },
      { status: 500 }
    );
  }
}
