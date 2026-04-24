import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import Settings from '@/models/Settings';
import { getUserFromRequest } from '@/lib/auth';
import { renderToStream } from '@react-pdf/renderer';
import DevisPDF from '@/components/DevisPDF';

// GET /api/devis/:id/pdf - Generate PDF
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

    // Get shop settings
    const settings = await Settings.findOne({ userId: user.userId });

    // Generate PDF
    const stream = await renderToStream(
      DevisPDF({
        devis: JSON.parse(JSON.stringify(devis)),
        settings: settings ? JSON.parse(JSON.stringify(settings)) : null,
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devis-${devis.devisNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
