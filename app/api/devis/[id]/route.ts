import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/devis/:id - Get single devis
export async function GET(
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
    }).populate('clientId', 'name company phone email address');

    if (!devis) {
      return NextResponse.json({ error: 'Devis not found' }, { status: 404 });
    }

    return NextResponse.json({ devis }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching devis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devis', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/devis/:id - Update devis
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      status,
    } = body;

    // Find existing devis
    const devis = await Devis.findOne({
      _id: params.id,
      userId: user.userId,
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis not found' }, { status: 404 });
    }

    // Check if devis can be edited
    if (devis.status === 'accepted' && status !== 'accepted') {
      return NextResponse.json(
        { error: 'Cannot edit accepted devis' },
        { status: 400 }
      );
    }

    // Update client info if clientId changed
    if (clientId && clientId !== devis.clientId.toString()) {
      const client = await Customer.findById(clientId);
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      devis.clientId = clientId;
      devis.clientName = client.name;
      devis.clientCompany = client.company;
      devis.clientPhone = client.phone;
      devis.clientEmail = client.email;
      devis.clientAddress = client.address;
    }

    // Update fields
    if (chantierName) devis.chantierName = chantierName;
    if (location) devis.location = location;
    if (items) devis.items = items;
    if (tvaRate !== undefined) devis.tvaRate = tvaRate;
    if (notes !== undefined) devis.notes = notes;
    if (validUntil !== undefined) devis.validUntil = validUntil;
    if (status) devis.status = status;

    await devis.save();

    return NextResponse.json(
      { message: 'Devis updated successfully', devis },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating devis:', error);
    return NextResponse.json(
      { error: 'Failed to update devis', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/devis/:id - Delete devis
export async function DELETE(
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

    // Prevent deletion of accepted devis
    if (devis.status === 'accepted') {
      return NextResponse.json(
        { error: 'Cannot delete accepted devis' },
        { status: 400 }
      );
    }

    await Devis.deleteOne({ _id: params.id });

    return NextResponse.json(
      { message: 'Devis deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting devis:', error);
    return NextResponse.json(
      { error: 'Failed to delete devis', details: error.message },
      { status: 500 }
    );
  }
}
