import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

// DELETE - Delete a customer by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`Delete customer request received for ID: ${id}`);

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized customer deletion attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const customerId = id;

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      console.log(`Customer not found with ID: ${customerId}`);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Delete the customer
    await Customer.findByIdAndDelete(customerId);
    console.log(`Customer deleted successfully with ID: ${customerId}`);

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error(`Customer deletion error`, error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}