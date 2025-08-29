import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import { getUserFromRequest } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const paymentMethod = searchParams.get('paymentMethod');

    // Build query
    const query: any = {};
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (customerId) query.customerId = customerId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const sales = await Sale.find(query)
      .populate('productId', 'name unit')
      .populate('customerId', 'name phone')
      .sort({ saleDate: -1 });

    // Generate CSV content
    const csvHeaders = [
      'Date',
      'Produit',
      'Client',
      'Téléphone',
      'Quantité',
      'Prix unitaire',
      'Total',
      'Mode de paiement',
      'Montant payé',
      'Reste à payer',
      'Statut',
      'Notes'
    ].join(',');

    const csvRows = sales.map(sale => [
      format(new Date(sale.saleDate), 'dd/MM/yyyy HH:mm'),
      `"${sale.productId.name}"`,
      `"${sale.customerId?.name || 'Client anonyme'}"`,
      `"${sale.customerId?.phone || ''}"`,
      `${sale.quantity} ${sale.productId.unit}`,
      `${sale.sellPrice.toFixed(2)}`,
      `${sale.totalAmount.toFixed(2)}`,
      sale.paymentMethod === 'cash' ? 'Espèces' :
        sale.paymentMethod === 'card' ? 'Carte' : 'Crédit',
      `${sale.paidAmount.toFixed(2)}`,
      `${sale.remainingAmount.toFixed(2)}`,
      sale.isPaid ? 'Payé' : 'Impayé',
      `"${sale.notes || ''}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ventes_${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });

  } catch (error) {
    console.error('Sales CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export sales' }, { status: 500 });
  }
}