import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Helper functions - moved to top to avoid hoisting issues
function getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
        'draft': 'Brouillon',
        'sent': 'Envoyée',
        'paid': 'Payée',
        'overdue': 'En retard',
        'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
}

function getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
        'draft': '#6b7280',
        'sent': '#2563eb',
        'paid': '#16a34a',
        'overdue': '#dc2626',
        'cancelled': '#6b7280'
    };
    return colorMap[status] || '#6b7280';
}

function getPaymentMethodText(method: string): string {
    const methodMap: { [key: string]: string } = {
        'cash': 'Espèces',
        'credit': 'Crédit',
        'card': 'Carte bancaire',
        'partial': 'Paiement partiel',
        'cheque': 'Chèque',
        'bank_transfer': 'Virement bancaire'
    };
    return methodMap[method] || method;
}

// FIXED VERSION - Generate PDF for invoice using custom TTF fonts
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params to fix Next.js 15+ requirement
        const { id } = await params;
        console.log('Generate PDF request received for invoice ID:', id);

        // Check authentication
        const user = getUserFromRequest(request);
        if (!user) {
            console.log('Unauthorized PDF generation attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        // Validate invoice ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid invoice ID' },
                { status: 400 }
            );
        }

        // Find invoice
        const invoice = await Invoice.findOne({
            _id: id,
            userId: user.userId
        }).populate('customerId', 'name phone email address');

        if (!invoice) {
            console.log('Invoice not found for PDF generation:', id);
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        console.log('Generating PDF for invoice:', invoice.invoiceNumber);

        // Create PDF document with custom font registration
        const doc = await createPDFWithCustomFonts();
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));

        // Generate PDF content
        await generateInvoicePDF(doc, invoice);

        // End the document
        doc.end();

        // Wait for PDF generation to complete
        await new Promise((resolve) => {
            doc.on('end', resolve);
        });

        // Combine chunks into final buffer
        const pdfBuffer = Buffer.concat(chunks);

        console.log('PDF generated successfully for invoice:', invoice.invoiceNumber);

        // Return PDF response with correct headers
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename=invoice-${invoice.invoiceNumber}.pdf`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Error generating PDF:', error);

        // Enhanced error handling for PDF generation
        if (error instanceof Error) {
            console.error('PDF Generation Error Details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }

        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Helper function to create PDF document with custom fonts
async function createPDFWithCustomFonts(): Promise<PDFKit.PDFDocument> {
    // Get font paths
    const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

    // Verify font files exist
    if (!fs.existsSync(regularFontPath)) {
        throw new Error(`Regular font file not found at: ${regularFontPath}`);
    }
    if (!fs.existsSync(boldFontPath)) {
        throw new Error(`Bold font file not found at: ${boldFontPath}`);
    }

    console.log('Loading custom fonts from:', { regularFontPath, boldFontPath });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Register custom fonts
    doc.registerFont('Roboto-Regular', regularFontPath);
    doc.registerFont('Roboto-Bold', boldFontPath);

    // Set default font to our custom font
    doc.font('Roboto-Regular');

    console.log('Custom fonts registered successfully');
    return doc;
}

// Helper function to generate PDF content with custom fonts
async function generateInvoicePDF(doc: PDFKit.PDFDocument, invoice: any) {
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Colors
    const primaryColor = '#2563eb';
    const grayColor = '#6b7280';
    const darkColor = '#1f2937';

    let yPosition = margin;

    // Header with company info - using bold font
    doc.font('Roboto-Bold')
        .fontSize(24)
        .fillColor(primaryColor)
        .text('FACTURE', margin, yPosition, { align: 'center' });

    yPosition += 40;

    // Company information (left side) - using regular font
    doc.font('Roboto-Regular');
    
    if (invoice.shopName || invoice.shopNameFr) {
        doc.font('Roboto-Bold')
            .fontSize(16)
            .fillColor(darkColor)
            .text(invoice.shopName || invoice.shopNameFr || 'Nom de l\'entreprise', margin, yPosition);
        yPosition += 20;
    }

    doc.font('Roboto-Regular');
    if (invoice.shopAddress || invoice.shopAddressFr) {
        doc.fontSize(10)
            .fillColor(grayColor)
            .text(invoice.shopAddress || invoice.shopAddressFr, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.shopPhone) {
        doc.text(`Tél: ${invoice.shopPhone}`, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.shopICE) {
        doc.text(`ICE: ${invoice.shopICE}`, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.shopRC) {
        doc.text(`RC: ${invoice.shopRC}`, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.shopIF) {
        doc.text(`IF: ${invoice.shopIF}`, margin, yPosition);
        yPosition += 15;
    }

    // Invoice details (right side)
    const rightColumnX = pageWidth - margin - 200;
    let rightYPosition = margin + 40;

    doc.fontSize(12)
        .fillColor(darkColor)
        .text(`N° Facture: ${invoice.invoiceNumber}`, rightColumnX, rightYPosition);
    rightYPosition += 20;

    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}`, rightColumnX, rightYPosition);
    rightYPosition += 20;

    if (invoice.dueDate) {
        doc.text(`Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, rightColumnX, rightYPosition);
        rightYPosition += 20;
    }

    // Status badge
    const statusText = getStatusText(invoice.status);
    const statusColor = getStatusColor(invoice.status);
    doc.fillColor(statusColor)
        .text(`Statut: ${statusText}`, rightColumnX, rightYPosition);

    yPosition = Math.max(yPosition, rightYPosition) + 40;

    // Customer information
    doc.font('Roboto-Bold')
        .fontSize(14)
        .fillColor(primaryColor)
        .text('FACTURÉ À:', margin, yPosition);
    yPosition += 25;

    doc.font('Roboto-Regular')
        .fontSize(12)
        .fillColor(darkColor)
        .text(invoice.customerName, margin, yPosition);
    yPosition += 15;

    if (invoice.customerAddress) {
        doc.fillColor(grayColor)
            .text(invoice.customerAddress, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.customerPhone) {
        doc.text(`Tél: ${invoice.customerPhone}`, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.customerEmail) {
        doc.text(`Email: ${invoice.customerEmail}`, margin, yPosition);
        yPosition += 15;
    }

    if (invoice.customerICE) {
        doc.text(`ICE: ${invoice.customerICE}`, margin, yPosition);
        yPosition += 15;
    }

    yPosition += 30;

    // Items table header
    const tableTop = yPosition;
    const tableHeaders = ['Description', 'Qté', 'Prix Unit.', 'Remise', 'Total'];
    const columnWidths = [contentWidth * 0.4, contentWidth * 0.1, contentWidth * 0.15, contentWidth * 0.15, contentWidth * 0.2];
    let currentX = margin;

    // Draw table header with bold font
    doc.font('Roboto-Bold')
        .fontSize(10)
        .fillColor(primaryColor);

    tableHeaders.forEach((header, index) => {
        doc.text(header, currentX, tableTop, { width: columnWidths[index], align: 'left' });
        currentX += columnWidths[index];
    });

    // Draw header line
    yPosition += 20;
    doc.moveTo(margin, yPosition)
        .lineTo(pageWidth - margin, yPosition)
        .strokeColor(grayColor)
        .stroke();

    yPosition += 10;

    // Items - using regular font
    doc.font('Roboto-Regular')
        .fillColor(darkColor);
    
    invoice.items.forEach((item: any) => {
        currentX = margin;

        // Check if we need a new page
        if (yPosition > doc.page.height - 150) {
            doc.addPage();
            yPosition = margin;
        }

        // Item description
        doc.text(item.name, currentX, yPosition, { width: columnWidths[0] });
        currentX += columnWidths[0];

        // Quantity
        doc.text(item.quantity.toString(), currentX, yPosition, { width: columnWidths[1], align: 'center' });
        currentX += columnWidths[1];

        // Unit price
        doc.text(`${item.unitPrice.toFixed(2)} DH`, currentX, yPosition, { width: columnWidths[2], align: 'right' });
        currentX += columnWidths[2];

        // Discount
        const discountText = item.discount ? `${item.discount}%` : '-';
        doc.text(discountText, currentX, yPosition, { width: columnWidths[3], align: 'center' });
        currentX += columnWidths[3];

        // Total
        doc.text(`${item.totalPrice.toFixed(2)} DH`, currentX, yPosition, { width: columnWidths[4], align: 'right' });

        yPosition += 25;
    });

    // Draw line after items
    yPosition += 10;
    doc.moveTo(margin, yPosition)
        .lineTo(pageWidth - margin, yPosition)
        .strokeColor(grayColor)
        .stroke();

    yPosition += 20;

    // Totals section
    const totalsX = pageWidth - margin - 200;

    // Subtotal
    doc.fontSize(10)
        .fillColor(grayColor)
        .text('Sous-total:', totalsX, yPosition)
        .text(`${invoice.subtotal.toFixed(2)} DH`, totalsX + 100, yPosition, { align: 'right' });
    yPosition += 20;

    // Global discount if any
    if (invoice.discount && invoice.discount > 0) {
        doc.text(`Remise (${invoice.discount}%):`, totalsX, yPosition)
            .text(`-${invoice.discountAmount.toFixed(2)} DH`, totalsX + 100, yPosition, { align: 'right' });
        yPosition += 20;
    }

    // Tax
    doc.text(`TVA (${invoice.taxRate}%):`, totalsX, yPosition)
        .text(`${invoice.taxAmount.toFixed(2)} DH`, totalsX + 100, yPosition, { align: 'right' });
    yPosition += 20;

    // Total - using bold font
    doc.font('Roboto-Bold')
        .fontSize(12)
        .fillColor(primaryColor)
        .text('TOTAL:', totalsX, yPosition)
        .text(`${invoice.totalAmount.toFixed(2)} DH`, totalsX + 100, yPosition, { align: 'right' });
    yPosition += 30;

    // Payment information - back to regular font
    doc.font('Roboto-Regular');
    if (invoice.paidAmount > 0) {
        doc.fontSize(10)
            .fillColor(grayColor)
            .text(`Montant payé: ${invoice.paidAmount.toFixed(2)} DH`, totalsX, yPosition);
        yPosition += 15;

        if (invoice.remainingAmount > 0) {
            doc.fillColor('#dc2626')
                .text(`Reste à payer: ${invoice.remainingAmount.toFixed(2)} DH`, totalsX, yPosition);
            yPosition += 15;
        }
    }

    // Payment method
    doc.fillColor(grayColor)
        .text(`Mode de paiement: ${getPaymentMethodText(invoice.paymentMethod)}`, totalsX, yPosition);
    yPosition += 30;

    // Notes
    if (invoice.notes) {
        doc.fontSize(10)
            .fillColor(darkColor)
            .text('Notes:', margin, yPosition);
        yPosition += 15;

        doc.fillColor(grayColor)
            .text(invoice.notes, margin, yPosition, { width: contentWidth });
        yPosition += 30;
    }

    // Footer
    const footerY = doc.page.height - 100;
    doc.fontSize(8)
        .fillColor(grayColor)
        .text('Merci pour votre confiance !', margin, footerY, { align: 'center', width: contentWidth });
}
