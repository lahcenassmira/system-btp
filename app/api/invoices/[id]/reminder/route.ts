import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invoice from '@/models/Invoice';
import { getUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const user = getUserFromRequest(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const { id } = await context.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
		}

		const invoice = await Invoice.findOne({ _id: id, userId: user.userId });
		if (!invoice) {
			return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
		}

		// Update reminder metadata
		invoice.lastReminderAt = new Date();
		invoice.reminderCount = (invoice.reminderCount || 0) + 1;
		await invoice.save();

		// TODO: integrate email/SMS sending here
		return NextResponse.json({ message: 'Reminder recorded', invoice: { _id: invoice._id, lastReminderAt: invoice.lastReminderAt, reminderCount: invoice.reminderCount } });
	} catch (error) {
		console.error('Send reminder error:', error);
		return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
	}
}