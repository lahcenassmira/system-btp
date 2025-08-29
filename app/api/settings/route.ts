import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { getUserFromRequest } from '@/lib/auth';

// GET - Fetch current user's settings
export async function GET(request: NextRequest) {
	try {
		const user = getUserFromRequest(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const existing = await Settings.findOne({ userId: user.userId }).lean();
		return NextResponse.json({ settings: existing || null });
	} catch (error) {
		console.error('Settings GET error:', error);
		return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
	}
}

// PUT - Create or update settings (upsert)
export async function PUT(request: NextRequest) {
	try {
		const user = getUserFromRequest(request);
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();

		const body = await request.json();
		const {
			companyName,
			rc,
			ice,
			if: ifValue,
			tpNumber,
			address,
			phone,
			email,
			rib,
			website,
			logoUrl,
			paymentTerms,
			paymentDelayDays,
			defaultTaxRate,
		} = body;

		const updateData: any = {
			...(companyName !== undefined ? { companyName } : {}),
			...(rc !== undefined ? { rc } : {}),
			...(ice !== undefined ? { ice } : {}),
			...(ifValue !== undefined ? { if: ifValue } : {}),
			...(tpNumber !== undefined ? { tpNumber } : {}),
			...(address !== undefined ? { address } : {}),
			...(phone !== undefined ? { phone } : {}),
			...(email !== undefined ? { email } : {}),
			...(rib !== undefined ? { rib } : {}),
			...(website !== undefined ? { website } : {}),
			...(logoUrl !== undefined ? { logoUrl } : {}),
			...(paymentTerms !== undefined ? { paymentTerms } : {}),
			...(paymentDelayDays !== undefined ? { paymentDelayDays } : {}),
			...(defaultTaxRate !== undefined ? { defaultTaxRate } : {}),
		};

		const settings = await Settings.findOneAndUpdate(
			{ userId: user.userId },
			{ $set: updateData, $setOnInsert: { userId: user.userId } },
			{ upsert: true, new: true }
		);

		return NextResponse.json({ message: 'Settings saved', settings });
	} catch (error: any) {
		console.error('Settings PUT error:', error);
		if (error.name === 'ValidationError') {
			const validationErrors = Object.values(error.errors).map((e: any) => e.message);
			return NextResponse.json({ error: 'Validation failed', details: validationErrors }, { status: 400 });
		}
		return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
	}
}