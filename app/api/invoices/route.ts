import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import Customer, { ICustomer } from '@/models/Customer';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';

// GET - List invoices with filtering and pagination
export async function GET(request: NextRequest) {
    try {
        console.log('Get invoices request received');

        // Check authentication
        const user = getUserFromRequest(request);
        if (!user) {
            console.log('Unauthorized invoices access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const customerId = searchParams.get('customerId') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';
        const sortBy = searchParams.get('sortBy') || 'invoiceDate';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build filter query
        const filter: any = { userId: user.userId };

        // Search filter
        if (search) {
            filter.$or = [
                { invoiceNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerNameFr: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { companyNameFr: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status) {
            filter.status = status;
        }

        // Customer filter
        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            filter.customerId = customerId;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.invoiceDate = {};
            if (startDate) {
                filter.invoiceDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.invoiceDate.$lte = new Date(endDate);
            }
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        console.log('Invoice filter:', filter);
        console.log('Invoice sort:', sort);

        // Get invoices with pagination
        const [invoices, totalCount] = await Promise.all([
            Invoice.find(filter)
                .populate('customerId', 'name phone email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Invoice.countDocuments(filter)
        ]);

        console.log(`Found ${invoices.length} invoices out of ${totalCount} total`);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return NextResponse.json({
            invoices,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage,
                hasPrevPage,
                limit
            }
        });

    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        );
    }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
    try {
        console.log('Create invoice request received');

        // Check authentication
        const user = getUserFromRequest(request);
        if (!user) {
            console.log('Unauthorized invoice creation attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const body = await request.json();
        const {
            invoiceType = 'personal', // Default to personal
            customerId,
            // Personal invoice fields
            customerName,
            customerNameFr,
            customerPhone,
            customerEmail,
            customerAddress,
            customerAddressFr,
            // Company invoice fields
            companyName,
            companyNameFr,
            customerICE,
            customerRC,
            customerVAT,
            companyAddress,
            companyAddressFr,
            companyPhone,
            companyEmail,
            items,
            discount,
            taxRate,
            paymentMethod,
            paidAmount,
            dueDate,
            notes,
            shopName,
            shopNameFr,
            shopAddress,
            shopAddressFr,
            shopPhone,
            shopICE,
            shopRC,
            shopIF,
            shopCNSS,
            shopRIB,
            shopWebsite,
            paymentTerms,
            paymentDelayDays
        } = body;

        // Load user settings for defaults
        const userSettings = await Settings.findOne({ userId: user.userId }).lean();
        const s: any = userSettings || {};

        console.log('Invoice creation data:', { customerName, itemsCount: items?.length });

        // Validation based on invoice type
        if (invoiceType === 'personal') {
            if (!customerName) {
                return NextResponse.json(
                    { error: 'Customer name is required for personal invoices' },
                    { status: 400 }
                );
            }
        } else if (invoiceType === 'company') {
            if (!companyName) {
                return NextResponse.json(
                    { error: 'Company name is required for company invoices' },
                    { status: 400 }
                );
            }
            if (!customerICE) {
                return NextResponse.json(
                    { error: 'ICE number is required for company invoices' },
                    { status: 400 }
                );
            }
            if (!customerRC) {
                return NextResponse.json(
                    { error: 'RC number is required for company invoices' },
                    { status: 400 }
                );
            }
            if (!companyAddress) {
                return NextResponse.json(
                    { error: 'Company address is required for company invoices' },
                    { status: 400 }
                );
            }
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
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

            // Verify product exists and has sufficient stock
            if (mongoose.Types.ObjectId.isValid(item.productId)) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return NextResponse.json(
                        { error: `Product not found: ${item.name}` },
                        { status: 400 }
                    );
                }

                if (product.quantity < item.quantity) {
                    return NextResponse.json(
                        { error: `Insufficient stock for product: ${item.name}. Available: ${product.quantity}` },
                        { status: 400 }
                    );
                }
            }
        }

        // Verify customer exists if customerId provided
        let customer: ICustomer | null = null;

        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            customer = await Customer.findById(customerId);
            if (!customer) {
                return NextResponse.json(
                    { error: 'Customer not found' },
                    { status: 400 }
                );
            }
        }

        // Calculate totals (these will be recalculated by pre-save middleware, but we need initial values)
        let subtotal = 0;
        const processedItems = items.map((item: any) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            const itemDiscount = item.discount ? (itemTotal * item.discount) / 100 : 0;
            const itemTotalPrice = itemTotal - itemDiscount;
            subtotal += itemTotalPrice;

            return {
                ...item,
                totalPrice: itemTotalPrice,
                discountAmount: itemDiscount
            };
        });

        const globalDiscount = discount ? (subtotal * discount) / 100 : 0;
        const subtotalAfterDiscount = subtotal - globalDiscount;
        const taxAmount = (subtotalAfterDiscount * (taxRate || s.defaultTaxRate || 20)) / 100;
        const totalAmount = subtotalAfterDiscount + taxAmount;

        // Generate invoice number
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await Invoice.countDocuments({ userId: user.userId }) + 1;
        const invoiceNumber = `INV-${year}${month}-${String(count).padStart(4, '0')}`;

        // Create invoice data - only include fields relevant to the invoice type
        const invoiceData: any = {
            invoiceNumber,
            invoiceType,
            userId: user.userId,
            customerId: customer?._id,
            items: processedItems,
            subtotal: subtotalAfterDiscount, // After global discount
            discount: discount || 0,
            discountAmount: globalDiscount,
            taxRate: taxRate || s.defaultTaxRate || 20, // Default 20% TVA or from settings
            taxAmount,
            totalAmount,
            paymentMethod: paymentMethod || 'cash',
            paidAmount: paidAmount || 0,
            remainingAmount: totalAmount - (paidAmount || 0),
            isPaid: (totalAmount - (paidAmount || 0)) <= 0,
            dueDate: (dueDate ? new Date(dueDate) : (s.paymentDelayDays ? new Date(Date.now() + s.paymentDelayDays * 24 * 60 * 60 * 1000) : undefined)),
            notes,
            shopName: shopName || s.companyName,
            shopNameFr,
            shopAddress: shopAddress || s.address,
            shopAddressFr,
            shopPhone: shopPhone || s.phone,
            shopICE: shopICE || s.ice,
            shopRC: shopRC || s.rc,
            shopIF: shopIF || s.if,
            shopCNSS,
            shopRIB: shopRIB || s.rib,
            shopWebsite: shopWebsite || s.website,
            paymentTerms: paymentTerms || s.paymentTerms,
            paymentDelayDays: paymentDelayDays || s.paymentDelayDays,
        };

        // Add type-specific fields only when they have values
        if (invoiceType === 'personal') {
            if (customerName) invoiceData.customerName = customerName;
            if (customerNameFr) invoiceData.customerNameFr = customerNameFr;
            if (customerPhone) invoiceData.customerPhone = customerPhone;
            if (customerEmail) invoiceData.customerEmail = customerEmail;
            if (customerAddress) invoiceData.customerAddress = customerAddress;
            if (customerAddressFr) invoiceData.customerAddressFr = customerAddressFr;
        } else if (invoiceType === 'company') {
            if (companyName) invoiceData.companyName = companyName;
            if (companyNameFr) invoiceData.companyNameFr = companyNameFr;
            if (customerICE) invoiceData.customerICE = customerICE;
            if (customerRC) invoiceData.customerRC = customerRC;
            if (customerVAT) invoiceData.customerVAT = customerVAT;
            if (companyAddress) invoiceData.companyAddress = companyAddress;
            if (companyAddressFr) invoiceData.companyAddressFr = companyAddressFr;
            if (companyPhone) invoiceData.companyPhone = companyPhone;
            if (companyEmail) invoiceData.companyEmail = companyEmail;
        }

        // Create invoice
        const newInvoice = new Invoice(invoiceData);
        await newInvoice.save();

        // Reduce stock for each item after successful invoice creation
        for (const item of items) {
            if (mongoose.Types.ObjectId.isValid(item.productId)) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { quantity: -item.quantity } },
                    { new: true }
                );
                console.log(`Stock reduced for product ${item.productId}: -${item.quantity}`);
            }
        }

        // Update customer stats if applicable
        if (customer) {
            const updateData: any = {
                $inc: {
                    totalPurchases: newInvoice.totalAmount
                },
                lastPurchaseDate: new Date()
            };

            // If it's credit, add to debt
            if (paymentMethod === 'credit') {
                updateData.$inc.totalDebt = newInvoice.remainingAmount;
            }

            await Customer.findByIdAndUpdate(
                customerId,
                updateData
            );
            console.log(`Customer stats updated for ${customer.name}`);
        }

        console.log('Invoice created successfully:', newInvoice.invoiceNumber);

        return NextResponse.json(
            {
                message: 'Invoice created successfully',
                invoice: newInvoice
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error creating invoice:', error);

        // If it's a validation error, return more specific details
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            console.error('Validation errors:', validationErrors);
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationErrors,
                    validationError: true
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        );
    }
}
