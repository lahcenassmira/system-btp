import { NextRequest, NextResponse } from 'next/server';
import { getMessages, getLocaleFromString } from '@/lib/i18n';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Settings from '@/models/Settings';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';
import PDFDocument from '@react-pdf/pdfkit';
import fs from 'fs';
import path from 'path';

// Types for header customization
import type { CustomizationPayload } from '@/types/customization';


// Helper functions - moved to top to avoid hoisting issues
function getStatusText(status: string, t: (k: string) => string): string {
    const statusMap: { [key: string]: string } = {
        'draft': t('invoices.draft'),
        'sent': t('invoices.sent'),
        'paid': t('invoices.paid'),
        'overdue': t('invoices.overdue'),
        'cancelled': t('invoices.cancelled')
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

function getPaymentMethodText(method: string, t: (k: string) => string): string {
    const methodMap: { [key: string]: string } = {
        'cash': t('invoices.cash'),
        'credit': t('invoices.credit'),
        'card': t('invoices.card'),
        'partial': t('invoices.partialPayment') || 'Partial',
        'cheque': t('invoices.cheque'),
        'bank_transfer': t('invoices.bankTransfer')
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

        // Parse optional customization from query string
        let customization = parseCustomizationFromUrl(request.url);

        // Prefill customization with user's saved settings logo if missing
        try {
            const settings = await Settings.findOne({ userId: user.userId }).lean() as { logoUrl?: string } | null;
            if (settings?.logoUrl && (!customization || !customization.logoUrl)) {
                customization = { ...(customization || {}), logoUrl: settings.logoUrl };
            }
        } catch (e) {
            console.warn('Failed to load user settings for PDF customization. Continuing without it.');
        }

        // Create PDF document with CDN font registration and robust fallbacks
        const doc = await createPDFWithCDNFonts();
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));

        // Resolve locale from query param
        const urlObj = new URL(request.url);
        const langParam = urlObj.searchParams.get('lang') || '';
        const locale = getLocaleFromString(langParam);
        const m = getMessages(locale);
        const t = (key: string, params?: Record<string, any>) => {
            const parts = key.split('.');
            let val: any = m;
            for (const p of parts) {
                if (val && typeof val === 'object' && p in val) val = val[p]; else return key;
            }
            if (typeof val === 'string' && params) {
                return val.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
            }
            return typeof val === 'string' ? val : key;
        };

        // Generate PDF content with i18n
        await generateInvoicePDF(doc, invoice, customization, t, locale);

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

// Helper function to fetch a font from CDN and return as Buffer
async function fetchFontBuffer(fontUrl: string): Promise<Buffer> {
    const response = await fetch(fontUrl, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Failed to fetch font from CDN: ${fontUrl} (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Helper function to create PDF document with CDN fonts and graceful fallbacks
async function createPDFWithCDNFonts(): Promise<PDFKit.PDFDocument> {
    // Preferred CDN sources (use raw.githubusercontent.com to avoid auth pages)
    const regularFontCdn = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf';
    const boldFontCdn = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Bold.ttf';

    // Local fallbacks (if present)
    const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
    const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

    const doc = new PDFDocument({
        margin: 50,
        bufferPages: true
    });

    try {
        // Try CDN first
        const [regularFontBuf, boldFontBuf] = await Promise.all([
            fetchFontBuffer(regularFontCdn),
            fetchFontBuffer(boldFontCdn)
        ]);

        doc.registerFont('Roboto-Regular', regularFontBuf);
        doc.registerFont('Roboto-Bold', boldFontBuf);
        (doc as any)._customFontsLoaded = true;
        doc.font('Roboto-Regular');
        console.log('Custom fonts registered from CDN');
        return doc;
    } catch (cdnError) {
        console.warn('CDN font loading failed, trying local fonts if available...', cdnError);
        try {
            if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
                doc.registerFont('Roboto-Regular', regularFontPath);
                doc.registerFont('Roboto-Bold', boldFontPath);
                (doc as any)._customFontsLoaded = true;
                doc.font('Roboto-Regular');
                console.log('Custom fonts registered from local files');
                return doc;
            }
            // Fall through to Helvetica when local fonts missing
            throw new Error('Local font files not found');
        } catch (localError) {
            console.error('Local font registration failed, falling back to built-in fonts.', localError);
            // Final fallback to built-in fonts (Helvetica family)
            (doc as any)._customFontsLoaded = false;
            doc.font('Helvetica');
            return doc;
        }
    }
}

function parseCustomizationFromUrl(url: string): CustomizationPayload | undefined {
    try {
        const { searchParams } = new URL(url);
        const raw = searchParams.get('customization');
        if (!raw) return undefined;
        try {
            return JSON.parse(raw);
        } catch {
            return JSON.parse(decodeURIComponent(raw));
        }
    } catch {
        return undefined;
    }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.warn('Failed to fetch logo image:', e);
        return null;
    }
}
async function generateInvoicePDF(doc: PDFKit.PDFDocument, invoice: any, customization: CustomizationPayload | undefined, t: (k: string, params?: Record<string, any>) => string, locale: string) {
    const hasCustomFonts = (doc as any)._customFontsLoaded === true;
    const regularFontName = hasCustomFonts ? 'Roboto-Regular' : 'Helvetica';
    const boldFontName = hasCustomFonts ? 'Roboto-Bold' : 'Helvetica-Bold';
    
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;

    // Modern color palette for Moroccan invoices
    const colors = {
        primary: '#1e40af',      // Modern blue
        secondary: '#059669',    // Green for paid status
        danger: '#dc2626',       // Red for overdue
        warning: '#d97706',      // Orange for pending
        dark: '#111827',         // Dark text
        medium: '#374151',       // Medium gray
        light: '#6b7280',        // Light gray
        lighter: '#9ca3af',      // Very light gray
        background: '#f8fafc',   // Light background
        border: '#e5e7eb'        // Border color
    };

    let yPosition = margin;

    // === HEADER SECTION ===
    await renderHeader();
    
    // === INVOICE METADATA ===
    await renderInvoiceMetadata();
    
    // === CLIENT INFORMATION ===
    await renderClientInfo();
    
    // === ITEMS TABLE ===
    await renderItemsTable();
    
    // === TOTALS SECTION ===
    await renderTotals();
    
    // === NOTES SECTION ===
    if (invoice.notes) {
        await renderNotes();
    }
    
    // === FOOTER ===
    await renderFooter();

    // Helper function to render header
    async function renderHeader() {
        const headerHeight = 120;
        
        // Draw subtle background for header
        doc.rect(margin, yPosition, contentWidth, headerHeight)
           .fillColor(colors.background)
           .fill()
           .strokeColor(colors.border)
           .lineWidth(0.5)
           .stroke();

        // Company logo (left side)
        const logoX = margin + 20;
        const logoY = yPosition + 20;
        const logoWidth = 80;
        const logoHeight = 80;
        
        if (customization?.logoUrl) {
            try {
                const logoBuffer = await fetchImageBuffer(customization.logoUrl);
                if (logoBuffer) {
                    doc.image(logoBuffer, logoX, logoY, { 
                        width: logoWidth, 
                        height: logoHeight,
                        fit: [logoWidth, logoHeight],
                        align: 'center'
                    });
                } else {
                    renderLogoPlaceholder(logoX, logoY, logoWidth, logoHeight);
                }
            } catch (error) {
                console.warn('Logo loading failed:', error);
                renderLogoPlaceholder(logoX, logoY, logoWidth, logoHeight);
            }
        } else {
            renderLogoPlaceholder(logoX, logoY, logoWidth, logoHeight);
        }

        // Company information (center-left)
        const companyInfoX = logoX + logoWidth + 30;
        const companyInfoY = logoY;
        
        const businessName = customization?.companyName || invoice.shopName || invoice.shopNameFr || t('invoices.companyName');
        
        doc.font(boldFontName)
           .fontSize(18)
           .fillColor(colors.primary)
           .text(businessName, companyInfoX, companyInfoY, { width: 250 });

        let infoY = companyInfoY + 25;
        doc.font(regularFontName)
           .fontSize(9)
           .fillColor(colors.medium);

        const businessInfo = [
            customization?.address || invoice.shopAddress || invoice.shopAddressFr,
            customization?.phone ? `${t('invoices.phone')}: ${customization.phone}` : (invoice.shopPhone ? `${t('invoices.phone')}: ${invoice.shopPhone}` : null),
            customization?.email ? `Email: ${customization.email}` : (invoice.companyEmail || invoice.shopEmail ? `Email: ${invoice.companyEmail || invoice.shopEmail}` : null),
            customization?.website || invoice.shopWebsite ? `Web: ${customization?.website || invoice.shopWebsite}` : null
        ].filter(Boolean);

        businessInfo.forEach(info => {
            if (infoY < logoY + logoHeight - 10) {
                doc.text(info, companyInfoX, infoY, { width: 250 });
                infoY += 12;
            }
        });

        // Registration numbers (right side)
        const regInfoX = pageWidth - margin - 150;
        const regInfoY = logoY;
        
        doc.font(boldFontName)
           .fontSize(12)
           .fillColor(colors.primary)
           .text(t('invoices.legalInfo') || 'INFORMATIONS', regInfoX, regInfoY - 15, { width: 140, align: 'center' });

        let regY = regInfoY + 20;
        doc.font(regularFontName)
           .fontSize(9)
           .fillColor(colors.medium);

        const registrationInfo = [
            customization?.rcNumber || invoice.shopRC ? `${t('invoices.rc')}: ${customization?.rcNumber || invoice.shopRC}` : null,
            customization?.iceNumber || invoice.shopICE ? `${t('invoices.ice')}: ${customization?.iceNumber || invoice.shopICE}` : null,
            customization?.ifNumber || invoice.shopIF ? `IF: ${customization?.ifNumber || invoice.shopIF}` : null,
            customization?.tpNumber ? `TP: ${customization.tpNumber}` : null
        ].filter((info): info is string => info !== null);

        registrationInfo.forEach(info => {
            doc.text(info, regInfoX, regY, { width: 140, align: 'center' });
            regY += 12;
        });

        yPosition += headerHeight + 30;
    }

    function renderLogoPlaceholder(x: number, y: number, width: number, height: number) {
        doc.rect(x, y, width, height)
           .fillColor('#f3f4f6')
           .fill()
           .strokeColor(colors.border)
           .lineWidth(1)
           .stroke();
        
        doc.font(regularFontName)
           .fontSize(10)
           .fillColor(colors.light)
           .text('Logo non\ndisponible', x, y + height/2 - 10, { 
               width: width, 
               align: 'center' 
           });
    }

    async function renderInvoiceMetadata() {
        // Invoice title
        doc.font(boldFontName)
           .fontSize(28)
           .fillColor(colors.primary)
           .text(t('invoices.invoiceTitle'), margin, yPosition, { align: 'center', width: contentWidth });
        
        yPosition += 50;

        // Invoice metadata in two columns
        const leftColX = margin;
        const rightColX = pageWidth - margin - 200;
        const metadataY = yPosition;

        // Left column
        doc.font(boldFontName)
           .fontSize(11)
           .fillColor(colors.dark);
        
        const nfLocale = locale === 'ar' ? 'ar-MA' : (locale === 'fr' ? 'fr-FR' : 'en-US');
        doc.text(`${t('invoices.invoiceNumber')}: ${invoice.invoiceNumber}`, leftColX, metadataY);
        doc.text(`${t('invoices.date')}: ${new Date(invoice.invoiceDate).toLocaleDateString(nfLocale)}`, leftColX, metadataY + 18);
        
        if (invoice.dueDate) {
            doc.text(`${t('invoices.dueDate')}: ${new Date(invoice.dueDate).toLocaleDateString(nfLocale)}`, leftColX, metadataY + 36);
        }

        // Right column - Status
        const statusText = getStatusText(invoice.status, t);
        const statusColor = getStatusColor(invoice.status);
        
        // Status badge
        const statusBadgeX = rightColX;
        const statusBadgeY = metadataY;
        const statusBadgeWidth = 120;
        const statusBadgeHeight = 25;
        
        doc.rect(statusBadgeX, statusBadgeY, statusBadgeWidth, statusBadgeHeight)
           .fillColor(statusColor)
           .fill()
           .strokeColor(statusColor)
           .stroke();
        
        doc.font(boldFontName)
           .fontSize(10)
           .fillColor('#ffffff')
           .text(statusText.toUpperCase(), statusBadgeX, statusBadgeY + 8, {
               width: statusBadgeWidth,
               align: 'center'
           });

        yPosition += 70;
    }

    async function renderClientInfo() {
        // Client information section
        doc.font(boldFontName)
           .fontSize(14)
           .fillColor(colors.primary)
           .text(t('invoices.billedTo'), margin, yPosition);
        
        yPosition += 25;

        // Client info box
        const clientBoxHeight = 80;
        doc.rect(margin, yPosition, contentWidth, clientBoxHeight)
           .fillColor('#f9fafb')
           .fill()
           .strokeColor(colors.border)
           .lineWidth(0.5)
           .stroke();

        const clientInfoX = margin + 20;
        const clientInfoY = yPosition + 15;

        // Client name
        const clientName = invoice.invoiceType === 'company' 
            ? (invoice.companyName || t('invoices.companyName')) 
            : (invoice.customerName || t('invoices.customer'));
        
        doc.font(boldFontName)
           .fontSize(12)
           .fillColor(colors.dark)
           .text(clientName, clientInfoX, clientInfoY);

        // Client details
        let clientY = clientInfoY + 18;
        doc.font(regularFontName)
           .fontSize(10)
           .fillColor(colors.medium);

        const clientAddress = invoice.invoiceType === 'company' ? invoice.companyAddress : invoice.customerAddress;
        const clientPhone = invoice.invoiceType === 'company' ? invoice.companyPhone : invoice.customerPhone;
        const clientEmail = invoice.invoiceType === 'company' ? invoice.companyEmail : invoice.customerEmail;

        const clientDetails = [
            clientAddress,
            clientPhone ? `${t('invoices.phone')}: ${clientPhone}` : null,
            clientEmail ? `Email: ${clientEmail}` : null,
            invoice.customerICE ? `${t('invoices.ice')}: ${invoice.customerICE}` : null
        ].filter(Boolean);

        clientDetails.forEach(detail => {
            if (clientY < yPosition + clientBoxHeight - 10) {
                doc.text(detail, clientInfoX, clientY, { width: contentWidth - 40 });
                clientY += 12;
            }
        });

        yPosition += clientBoxHeight + 30;
    }

    async function renderItemsTable() {
        // Table header
        const tableHeaders = [
            t('invoices.product') || 'Description',
            t('invoices.quantity') || 'Qté',
            `${t('invoices.unitPrice')} (MAD)`,
            t('invoices.discount') || 'Remise',
            `${t('invoices.total')} (MAD)`
        ];
        const columnWidths = [
            contentWidth * 0.40,  // Description
            contentWidth * 0.10,  // Quantity
            contentWidth * 0.18,  // Unit Price
            contentWidth * 0.12,  // Discount
            contentWidth * 0.20   // Total
        ];

        // Header background
        const headerHeight = 35;
        doc.rect(margin, yPosition, contentWidth, headerHeight)
           .fillColor(colors.primary)
           .fill();

        // Header text
        let currentX = margin + 10;
        doc.font(boldFontName)
           .fontSize(10)
           .fillColor('#ffffff');

        tableHeaders.forEach((header, index) => {
            const align = index === 0 ? 'left' : (index >= 2 ? 'center' : 'center');
            doc.text(header, currentX, yPosition + 12, { 
                width: columnWidths[index] - 10, 
                align: align 
            });
            currentX += columnWidths[index];
        });

        yPosition += headerHeight;

        // Table rows
        let isAlternate = false;
        doc.font(regularFontName)
           .fontSize(10)
           .fillColor(colors.dark);

        invoice.items.forEach((item: any, itemIndex: number) => {
            // Check for page break
            if (yPosition > pageHeight - 200) {
                doc.addPage();
                yPosition = margin;
                
                // Redraw header on new page
                doc.rect(margin, yPosition, contentWidth, headerHeight)
                   .fillColor(colors.primary)
                   .fill();

                let headerX = margin + 10;
                doc.font(boldFontName)
                   .fontSize(10)
                   .fillColor('#ffffff');

                tableHeaders.forEach((header, index) => {
                    const align = index === 0 ? 'left' : (index >= 2 ? 'center' : 'center');
                    doc.text(header, headerX, yPosition + 12, { 
                        width: columnWidths[index] - 10, 
                        align: align 
                    });
                    headerX += columnWidths[index];
                });

                yPosition += headerHeight;
                isAlternate = false;
            }

            const rowHeight = 30;
            
            // Alternating row background
            if (isAlternate) {
                doc.rect(margin, yPosition, contentWidth, rowHeight)
                   .fillColor('#f8f9fa')
                   .fill();
            }

            // Row border
            doc.rect(margin, yPosition, contentWidth, rowHeight)
               .strokeColor(colors.border)
               .lineWidth(0.3)
               .stroke();

            // Row data
            currentX = margin + 10;
            const rowY = yPosition + 10;
            
            doc.font(regularFontName)
               .fontSize(9)
               .fillColor(colors.dark);

            // Description
            doc.text(item.name, currentX, rowY, { 
                width: columnWidths[0] - 10, 
                align: 'left' 
            });
            currentX += columnWidths[0];

            // Quantity
            doc.text(item.quantity.toString(), currentX, rowY, { 
                width: columnWidths[1] - 10, 
                align: 'center' 
            });
            currentX += columnWidths[1];

            // Unit Price
            doc.text(`${item.unitPrice.toFixed(2)}`, currentX, rowY, { 
                width: columnWidths[2] - 10, 
                align: 'center' 
            });
            currentX += columnWidths[2];

            // Discount
            doc.text(item.discount ? `${item.discount}%` : '-', currentX, rowY, { 
                width: columnWidths[3] - 10, 
                align: 'center' 
            });
            currentX += columnWidths[3];

            // Total
            doc.text(`${item.totalPrice.toFixed(2)}`, currentX, rowY, { 
                width: columnWidths[4] - 10, 
                align: 'center' 
            });

            yPosition += rowHeight;
            isAlternate = !isAlternate;
        });

        yPosition += 20;
    }

    async function renderTotals() {
        const totalsBoxWidth = 280;
        const totalsBoxX = pageWidth - margin - totalsBoxWidth;
        const totalsBoxY = yPosition;
        
        // Totals background
        const totalsHeight = calculateTotalsHeight();
        doc.rect(totalsBoxX, totalsBoxY, totalsBoxWidth, totalsHeight)
           .fillColor('#f8fafc')
           .fill()
           .strokeColor(colors.border)
           .lineWidth(0.5)
           .stroke();

        let totalsY = totalsBoxY + 15;
        const labelX = totalsBoxX + 20;
        const valueX = totalsBoxX + totalsBoxWidth - 20;

        doc.font(regularFontName)
           .fontSize(10)
           .fillColor(colors.medium);

        // Subtotal
        doc.text(`${t('invoices.subtotal')}:`, labelX, totalsY);
        doc.text(`${invoice.subtotal.toFixed(2)} MAD`, valueX - 80, totalsY, { 
            width: 80, 
            align: 'right' 
        });
        totalsY += 18;

        // Discount
        if (invoice.discount && invoice.discount > 0) {
            doc.text(`${t('invoices.discount')} (${invoice.discount}%):`, labelX, totalsY);
            doc.text(`-${invoice.discountAmount.toFixed(2)} MAD`, valueX - 80, totalsY, { 
                width: 80, 
                align: 'right' 
            });
            totalsY += 18;
        }

        // Tax
        doc.text(`${t('invoices.tax')} (${invoice.taxRate}%):`, labelX, totalsY);
        doc.text(`${invoice.taxAmount.toFixed(2)} MAD`, valueX - 80, totalsY, { 
            width: 80, 
            align: 'right' 
        });
        totalsY += 25;

        // Total line
        doc.moveTo(labelX, totalsY - 5)
           .lineTo(valueX, totalsY - 5)
           .strokeColor(colors.border)
           .lineWidth(1)
           .stroke();

        // Total
        doc.font(boldFontName)
           .fontSize(14)
           .fillColor(colors.primary)
           .text(`${t('invoices.total')}:`, labelX, totalsY);
        
        doc.text(`${invoice.totalAmount.toFixed(2)} MAD`, valueX - 100, totalsY, { 
            width: 100, 
            align: 'right' 
        });
        totalsY += 25;

        // Payment info if applicable
        if (invoice.paidAmount > 0) {
            doc.font(regularFontName)
               .fontSize(10)
               .fillColor(colors.secondary);
            
            doc.text(`${t('invoices.paidAmount')}: ${invoice.paidAmount.toFixed(2)} MAD`, labelX, totalsY);
            totalsY += 15;
            
            if (invoice.remainingAmount > 0) {
                doc.fillColor(colors.danger)
                   .text(`${t('invoices.remainingAmountLabel') || 'Reste à payer'}: ${invoice.remainingAmount.toFixed(2)} MAD`, labelX, totalsY);
                totalsY += 15;
            }
        }

        // Payment method
        doc.fillColor(colors.medium)
           .text(`${t('invoices.paymentMethod')}: ${getPaymentMethodText(invoice.paymentMethod, t)}`, labelX, totalsY);

        yPosition = totalsBoxY + totalsHeight + 30;
    }

    function calculateTotalsHeight(): number {
        let height = 120; // Base height
        if (invoice.discount && invoice.discount > 0) height += 18;
        if (invoice.paidAmount > 0) height += 15;
        if (invoice.remainingAmount > 0) height += 15;
        return height;
    }

    async function renderNotes() {
        doc.font(boldFontName)
           .fontSize(12)
           .fillColor(colors.dark)
           .text('NOTES:', margin, yPosition);
        
        yPosition += 20;

        doc.rect(margin, yPosition, contentWidth, 60)
           .fillColor('#f9fafb')
           .fill()
           .strokeColor(colors.border)
           .lineWidth(0.5)
           .stroke();

        doc.font(regularFontName)
           .fontSize(10)
           .fillColor(colors.medium)
           .text(invoice.notes, margin + 15, yPosition + 15, { 
               width: contentWidth - 30 
           });

        yPosition += 80;
    }

    async function renderFooter() {
        const footerY = pageHeight - 80;
        const footerHeight = 60;

        // Footer background
        doc.rect(margin, footerY, contentWidth, footerHeight)
           .fillColor(colors.background)
           .fill()
           .strokeColor(colors.border)
           .lineWidth(0.5)
           .stroke();

        // Footer content
        const businessRIB = customization?.rib || invoice.shopRIB;
        const businessWebsite = customization?.website || invoice.shopWebsite;
        const businessAddress = customization?.address || invoice.shopAddress || invoice.shopAddressFr;
        const paymentTerms = customization?.paymentTerms || invoice.paymentTerms;
        const paymentDelayDays = customization?.paymentDelayDays ?? invoice.paymentDelayDays;
        
        const footerInfo = [
            businessRIB ? `RIB: ${businessRIB}` : null,
            businessWebsite ? `Web: ${businessWebsite}` : null,
            paymentTerms || null,
            invoice.dueDate ? `${t('invoices.dueDate')}: ${new Date(invoice.dueDate).toLocaleDateString(locale)}` : null,
            typeof paymentDelayDays === 'number' ? `${t('invoices.paymentDelayDays')}: ${paymentDelayDays}` : null,
        
        ].filter(Boolean);

        const footerText = footerInfo.length > 0 
            ? footerInfo.join(' • ') 
            : t('invoices.thankYouFooter');

        doc.font(regularFontName)
           .fontSize(8)
           .fillColor(colors.light)
           .text(footerText, margin + 15, footerY + 20, { 
               align: 'center', 
               width: contentWidth - 30 
           });

        // Add page numbers for multi-page invoices
        const pageCount = doc.bufferedPageRange().count;
        if (pageCount > 1) {
            doc.font(regularFontName)
               .fontSize(8)
               .fillColor(colors.lighter)
               .text(t('invoices.pageOf', { current: doc.bufferedPageRange().start + 1, total: pageCount }), 
                     pageWidth - margin - 80, footerY + footerHeight - 20, {
                         align: 'right',
                         width: 80
                     });
        }
    }
}


