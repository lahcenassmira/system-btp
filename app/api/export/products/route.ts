import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    console.log('Products export request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const products = await Product.find().sort({ name: 1 });

    // Generate CSV content
    const csvHeaders = [
      'Nom',
      'Unité',
      'Quantité',
      'Prix d\'achat',
      'Prix de vente',
      'Alerte stock',
      'Catégorie',
      'Description',
      'Date création'
    ].join(',');

    const csvRows = products.map(product => [
      `"${product.name}"`,
      `"${product.unit}"`,
      `${product.quantity}`,
      `${product.buyPrice.toFixed(2)}`,
      `${product.sellPrice.toFixed(2)}`,
      `${product.minStockAlert}`,
      `"${product.category || ''}"`,
      `"${product.description || ''}"`,
      format(new Date(product.createdAt), 'dd/MM/yyyy')
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="produits_${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    });

  } catch (error) {
    console.error('Products export error:', error);
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 });
  }
}