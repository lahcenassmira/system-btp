import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// DEBUG VERSION - Generate PDF for invoice with detailed logging
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        console.log('=== PDF DEBUG SESSION START ===');
        console.log('Generate PDF request received for invoice ID:', id);

        // Debug: Check current working directory and available paths
        console.log('Current working directory:', process.cwd());
        console.log('Node environment:', process.env.NODE_ENV);
        
        // Debug: Check if public/fonts directory exists
        const fontsDir = path.join(process.cwd(), 'public', 'fonts');
        console.log('Fonts directory path:', fontsDir);
        console.log('Fonts directory exists:', fs.existsSync(fontsDir));
        
        if (fs.existsSync(fontsDir)) {
            const fontFiles = fs.readdirSync(fontsDir);
            console.log('Available font files:', fontFiles);
        }

        // Debug: Check PDFKit default font paths
        console.log('Attempting to create PDFDocument with default settings...');
        
        const user = getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
        }

        const invoice = await Invoice.findOne({
            _id: id,
            userId: user.userId
        }).populate('customerId', 'name phone email address');

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        console.log('Creating PDFDocument...');
        
        // This is where the error likely occurs
        const doc = new PDFDocument({ margin: 50 });
        console.log('PDFDocument created successfully!');
        
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Test basic text rendering
        console.log('Testing basic text rendering...');
        doc.fontSize(12).text('Test PDF Generation', 50, 50);
        console.log('Basic text rendered successfully!');

        doc.end();

        await new Promise((resolve) => {
            doc.on('end', resolve);
        });

        const pdfBuffer = Buffer.concat(chunks);
        console.log('PDF generated successfully! Buffer size:', pdfBuffer.length);
        console.log('=== PDF DEBUG SESSION END ===');

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename=debug-test.pdf`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('=== PDF DEBUG ERROR ===');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Additional debugging for file system errors
        if (error instanceof Error && error.message.includes('ENOENT')) {
            console.error('File not found error detected!');
            console.error('This confirms the font file issue.');
        }
        
        console.error('=== PDF DEBUG ERROR END ===');

        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : 'Unknown error',
                debugInfo: {
                    errorType: error?.constructor?.name,
                    isFileError: error instanceof Error && error.message.includes('ENOENT')
                }
            },
            { status: 500 }
        );
    }
}