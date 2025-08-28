import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Customers export request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get('format') || 'csv';
    const hasDebt = searchParams.get('hasDebt');

    // Build query
    const query: any = { isActive: true };
    if (hasDebt === 'true') {
      query.totalDebt = { $gt: 0 };
    }

    const customers = await Customer.find(query).sort({ name: 1 });

    if (exportFormat === 'txt') {
      // Generate TXT content for simple client list
      const txtContent = customers.map(customer => 
        `${customer.name}${customer.phone ? ` - ${customer.phone}` : ''}`
      ).join('\n');

      return new NextResponse(txtContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="clients_${format(new Date(), 'yyyy-MM-dd')}.txt"`
        }
      });
    }

    // Generate CSV content
    const csvHeaders = [
      'Nom',
      'Téléphone',
      'Email',
      'Adresse',
      'Dette totale',
      'Achats totaux',
      'Dernier achat',
      'Date création',
      'Notes'
    ].join(',');

    const csvRows = customers.map(customer => [
      `"${customer.name}"`,
      `"${customer.phone || ''}"`,
      `"${customer.email || ''}"`,
      `"${customer.address || ''}"`,
      `${customer.totalDebt.toFixed(2)}`,
      `${customer.totalPurchases.toFixed(2)}`,
      customer.lastPurchaseDate ? format(new Date(customer.lastPurchaseDate), 'dd/MM/yyyy') : '',
      format(new Date(customer.createdAt), 'dd/MM/yyyy'),
      `"${customer.notes || ''}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clients_${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });

  } catch (error) {
    console.error('Customers export error:', error);
    return NextResponse.json({ error: 'Failed to export customers' }, { status: 500 });
  }
}