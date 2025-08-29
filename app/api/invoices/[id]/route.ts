import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer from '@/models/Customer';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get single invoice by ID
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        console.log('Get invoice request received for ID:', id);

        // Check authentication
        const user = getUserFromRequest(request);
        if (!user) {
            console.log('Unauthorized invoice access attempt');
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
            console.log('Invoice not found:', id);
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Auto-mark overdue if due date passed and not paid
        if (invoice.dueDate && invoice.status !== 'paid' && invoice.dueDate < new Date() && invoice.status !== 'overdue') {
            invoice.status = 'overdue';
            await invoice.save();
        }

        console.log('Invoice found:', invoice.invoiceNumber);

        return NextResponse.json({ invoice });

    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        );
    }
}

// PUT - Update invoice
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        console.log('Update invoice request received for ID:', id);

        // Check authentication
        const user = getUserFromRequest(request);
        if (!user) {
            console.log('Unauthorized invoice update attempt');
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

        // Find existing invoice
        const existingInvoice = await Invoice.findOne({
            _id: id,
            userId: user.userId
        });

        if (!existingInvoice) {
            console.log('Invoice not found for update:', id);
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const {
            customerId,
            customerName,
            customerNameFr,
            customerICE,
            customerPhone,
            customerEmail,
            customerAddress,
            customerAddressFr,
            items,
            discount,
            taxRate,
            paymentMethod,
            paidAmount,
            dueDate,
            notes,
            status,
            shopName,
            shopNameFr,
            shopAddress,
            shopAddressFr,
            shopPhone,
            shopICE,
            shopRC,
            shopIF,
            shopCNSS
        } = body;

        console.log('Invoice update data:', { customerName, itemsCount: items?.length });

        // Validation
        if (customerName !== undefined && !customerName) {
            return NextResponse.json(
                { error: 'Customer name is required' },
                { status: 400 }
            );
        }

        if (items !== undefined) {
            if (!Array.isArray(items) || items.length === 0) {
                return NextResponse.json(
                    { error: 'At least one item is required' },
                    { status: 400 }
                );
            }

            // Validate items
            for (const item of items) {
                if (!item.productId || !item.name || !item.quantity || !item.unitPrice) {
                    return NextResponse.json(
                        { error: 'All item fields (productId, name, quantity, unitPrice) are required' },
                        { status: 400 }
                    );
                }

                if (item.quantity <= 0 || item.unitPrice < 0) {
                    return NextResponse.json(
                        { error: 'Invalid item quantity or price' },
                        { status: 400 }
                    );
                }

                // Verify product exists
                if (mongoose.Types.ObjectId.isValid(item.productId)) {
                    const product = await Product.findById(item.productId);
                    if (!product) {
                        return NextResponse.json(
                            { error: `Product not found: ${item.name}` },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        // Verify customer exists if customerId provided
        let customer: any = null;
        if (customerId !== undefined && customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            customer = await Customer.findById(customerId);
            if (!customer) {
                return NextResponse.json(
                    { error: 'Customer not found' },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData: any = {};

        if (customerId !== undefined) {
            updateData.customerId = customer ? customer._id : undefined;
        }
        if (customerName !== undefined) updateData.customerName = customerName;
        if (customerNameFr !== undefined) updateData.customerNameFr = customerNameFr;
        if (customerICE !== undefined) updateData.customerICE = customerICE;
        if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
        if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
        if (customerAddress !== undefined) updateData.customerAddress = customerAddress;
        if (customerAddressFr !== undefined) updateData.customerAddressFr = customerAddressFr;
        if (items !== undefined) updateData.items = items;
        if (discount !== undefined) updateData.discount = discount;
        if (taxRate !== undefined) updateData.taxRate = taxRate;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (notes !== undefined) updateData.notes = notes;
        if (status !== undefined) updateData.status = status;
        if (shopName !== undefined) updateData.shopName = shopName;
        if (shopNameFr !== undefined) updateData.shopNameFr = shopNameFr;
        if (shopAddress !== undefined) updateData.shopAddress = shopAddress;
        if (shopAddressFr !== undefined) updateData.shopAddressFr = shopAddressFr;
        if (shopPhone !== undefined) updateData.shopPhone = shopPhone;
        if (shopICE !== undefined) updateData.shopICE = shopICE;
        if (shopRC !== undefined) updateData.shopRC = shopRC;
        if (shopIF !== undefined) updateData.shopIF = shopIF;
        if (shopCNSS !== undefined) updateData.shopCNSS = shopCNSS;

        // Update invoice
        Object.assign(existingInvoice, updateData);
        await existingInvoice.save();

        console.log('Invoice updated successfully:', existingInvoice.invoiceNumber);

        return NextResponse.json({
            message: 'Invoice updated successfully',
            invoice: existingInvoice
        });

    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        );
    }
}

// DELETE - Delete invoice
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        console.log('Delete invoice request received for ID:', id);

        // Check authentication
        const user = getUserFromRequest(request);
        if (!user) {
            console.log('Unauthorized invoice deletion attempt');
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

        // Find and delete invoice
        const deletedInvoice = await Invoice.findOneAndDelete({
            _id: id,
            userId: user.userId
        });

        if (!deletedInvoice) {
            console.log('Invoice not found for deletion:', id);
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        console.log('Invoice deleted successfully:', deletedInvoice.invoiceNumber);

        return NextResponse.json({
            message: 'Invoice deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json(
            { error: 'Failed to delete invoice' },
            { status: 500 }
        );
    }
}