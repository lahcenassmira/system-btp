import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Customer from '@/models/Customer';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { data, createBackup = true } = body;

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
      backup: null as any
    };

    // Create backup if requested
    if (createBackup) {
      const existingCustomers = await Customer.find().lean();
      results.backup = {
        timestamp: new Date(),
        count: existingCustomers.length,
        data: existingCustomers
      };
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Check if customer exists
        const existingCustomer = await Customer.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${row.name}$`, 'i') } },
            ...(row.phone ? [{ phone: row.phone }] : [])
          ]
        });

        if (existingCustomer) {
          // Update existing customer
          await Customer.findByIdAndUpdate(existingCustomer._id, {
            name: row.name,
            phone: row.phone || existingCustomer.phone,
            email: row.email || existingCustomer.email,
            address: row.address || existingCustomer.address,
            notes: row.notes || existingCustomer.notes,
            totalDebt: row.totalDebt !== undefined ? Number(row.totalDebt) : existingCustomer.totalDebt
          });
        } else {
          // Create new customer
          const newCustomer = new Customer({
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            notes: row.notes,
            totalDebt: row.totalDebt ? Number(row.totalDebt) : 0
          });
          await newCustomer.save();
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: row,
          error: error.message
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Customer import error:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}