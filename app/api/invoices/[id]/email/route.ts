import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
	const user = getUserFromRequest(request);
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	// TODO: Implement sending email with invoice PDF
	return NextResponse.json({ message: 'Email sent (stub)' }, { status: 200 });
}