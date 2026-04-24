import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Devis from '@/models/Devis';
import Settings from '@/models/Settings';
import { getUserFromRequest } from '@/lib/auth';
import { renderToStream } from '@react-pdf/renderer';
import DevisPDF from '@/components/DevisPDF';

// Sanitize function to remove Mongoose metadata and non-serializable data
function sanitizeForPDF(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForPDF(item));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const key in obj) {
      // Skip Mongoose internal properties and functions
      if (
        key.startsWith('_') && key !== '_id' ||
        key.startsWith('$') ||
        key === 'isNew' ||
        key === 'errors' ||
        key === '$__' ||
        typeof obj[key] === 'function'
      ) {
        continue;
      }

      // Convert _id to string
      if (key === '_id') {
        sanitized[key] = obj[key].toString();
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForPDF(obj[key]);
    }
    
    return sanitized;
  }

  // Return primitive values as-is
  return obj;
}

// GET /api/devis/:id/pdf - Generate PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Await params in Next.js 15
    const { id } = await params;

    const devis = await Devis.findOne({
      _id: id,
      userId: user.userId,
    }).populate('clientId', 'name company phone email address').lean();

    if (!devis) {
      return NextResponse.json({ error: 'Devis not found' }, { status: 404 });
    }

    // Get shop settings
    const settings = await Settings.findOne({ userId: user.userId }).lean();

    // Sanitize data to remove Mongoose metadata and non-serializable objects
    const sanitizedDevis = sanitizeForPDF(devis);
    const sanitizedSettings = settings ? sanitizeForPDF(settings) : null;

    // Generate PDF
    const stream = await renderToStream(
      <DevisPDF
        devis={sanitizedDevis}
        settings={sanitizedSettings}
      />
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="devis-${sanitizedDevis.devisNumber}.pdf"`,
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
