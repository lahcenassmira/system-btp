import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Sale from '@/models/Sale';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// POST - Process payment for credit sale
export async function POST(request: NextRequest) {
  try {
    console.log('Credit payment request received');
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      console.log('Unauthorized credit payment attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { saleId, paymentAmount, notes } = body;

    console.log('Credit payment data:', { saleId, paymentAmount, notes });

    // Validation
    if (!saleId || !paymentAmount) {
      console.log('Missing required payment fields');
      return NextResponse.json(
        { error: 'Sale ID and payment amount are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      console.log('Invalid sale ID:', saleId);
      return NextResponse.json(
        { error: 'Invalid sale ID' },
        { status: 400 }
      );
    }

    if (paymentAmount <= 0) {
      console.log('Invalid payment amount:', paymentAmount);
      return NextResponse.json(
        { error: 'Payment amount must be positive' },
        { status: 400 }
      );
    }

    // Find the sale
    const sale = await Sale.findById(saleId).populate('customerId');
    if (!sale) {
      console.log('Sale not found:', saleId);
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      );
    }

    // Verify it's a credit sale
    if (sale.paymentMethod !== 'credit') {
      console.log('Sale is not a credit sale');
      return NextResponse.json(
        { error: 'This sale is not a credit sale' },
        { status: 400 }
      );
    }

    // Check if payment amount is not more than remaining amount
    if (paymentAmount > sale.remainingAmount) {
      console.log('Payment amount exceeds remaining amount:', {
        paymentAmount,
        remainingAmount: sale.remainingAmount
      });
      return NextResponse.json(
        { 
          error: `Payment amount cannot exceed remaining amount of ${sale.remainingAmount.toFixed(2)} MAD` 
        },
        { status: 400 }
      );
    }

    // Calculate new amounts
    const newPaidAmount = sale.paidAmount + Number(paymentAmount);
    const newRemainingAmount = sale.totalAmount - newPaidAmount;
    const isNowPaid = newRemainingAmount <= 0.01; // Consider paid if remaining is less than 1 cent

    // Update sale
    await Sale.findByIdAndUpdate(
      saleId,
      {
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, newRemainingAmount),
        isPaid: isNowPaid,
        paidDate: isNowPaid ? new Date() : sale.paidDate,
        notes: notes ? (sale.notes ? `${sale.notes}\n${notes}` : notes) : sale.notes
      }
    );

    // Update customer's total debt
    if (sale.customerId) {
      await Customer.findByIdAndUpdate(
        sale.customerId._id,
        {
          $inc: { totalDebt: -Number(paymentAmount) }
        }
      );
    }

    console.log('Credit payment processed successfully:', {
      saleId,
      paymentAmount,
      newPaidAmount,
      newRemainingAmount,
      isNowPaid
    });

    return NextResponse.json(
      { 
        message: 'Payment processed successfully',
        isPaid: isNowPaid
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Credit payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
