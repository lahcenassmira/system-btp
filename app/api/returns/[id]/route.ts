import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Return from '@/models/Return';
import Product from '@/models/Product';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get single return
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Single return request received for ID:', id);

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized return access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid return ID format:', id);
      return NextResponse.json(
        { error: 'Invalid return ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const returnRecord = await Return.findById(id)
      .populate('productId', 'name unit category')
      .populate('customerId', 'name phone')
      .populate('saleId', 'saleDate paymentMethod totalAmount');

    if (!returnRecord) {
      console.log('Return not found:', id);
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    console.log('Return fetched successfully:', returnRecord._id);
    return NextResponse.json({ return: returnRecord }, { status: 200 });

  } catch (error) {
    console.error('Single return fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return' },
      { status: 500 }
    );
  }
}

// PUT - Update return status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Update return request for ID:', id);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized return update attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid return ID format:', id);
      return NextResponse.json(
        { error: 'Invalid return ID' },
        { status: 400 }
      );
    }

    await connectDB();

    let body: any = {};
    let status, notes, processedBy;

    try {
      // Try to get the request body
      const contentType = request.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        const text = await request.text();
        console.log('Raw request body:', text);

        if (text && text.trim() !== '') {
          body = JSON.parse(text);
          console.log('Parsed body:', body);
        } else {
          console.log('Empty request body');
        }
      } else {
        console.log('Non-JSON content type or no content type');
      }

      // Extract values with defaults
      status = body.status as string | undefined;
      notes = body.notes as string | undefined;
      processedBy = (body.processedBy as string | undefined) || 'System';

    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse request body' },
        { status: 400 }
      );
    }

    console.log('Return update data:', { status, notes, processedBy });

    // Validate status
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, approved, rejected)' },
        { status: 400 }
      );
    }

    // Find the return
    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      console.log('Return not found:', id);
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    // Update the return
    returnRecord.status = status;
    if (notes) returnRecord.notes = notes;
    if (processedBy) returnRecord.processedBy = processedBy;

    // If approving the return, we might want to update product inventory
    if (status === 'approved' && returnRecord.status !== 'approved') {
      try {
        // Add the returned quantity back to product inventory
        await Product.findByIdAndUpdate(
          returnRecord.productId,
          { $inc: { quantity: returnRecord.returnedQuantity } }
        );
        console.log(`Added ${returnRecord.returnedQuantity} units back to product inventory`);
      } catch (inventoryError) {
        console.error('Error updating product inventory:', inventoryError);
        // Continue with return update even if inventory update fails
      }
    }

    await returnRecord.save();

    // Populate the updated return for response
    const updatedReturn = await Return.findById(id)
      .populate('productId', 'name unit category')
      .populate('customerId', 'name phone')
      .populate('saleId', 'saleDate paymentMethod totalAmount');

    console.log('Return updated successfully:', id);

    return NextResponse.json({
      message: 'Return updated successfully',
      return: updatedReturn
    }, { status: 200 });

  } catch (error) {
    console.error('Return update error:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}

// DELETE - Delete return (soft delete by setting status to rejected)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Delete return request for ID:', id);

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized return deletion attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid return ID format:', id);
      return NextResponse.json(
        { error: 'Invalid return ID' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the return to rejected status instead of hard delete
    const returnRecord = await Return.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        processedBy: user.email,
        processedDate: new Date()
      },
      { new: true }
    );

    if (!returnRecord) {
      return NextResponse.json(
        { error: 'Return not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Return deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Return deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete return' },
      { status: 500 }
    );
  }
}
