import { NextRequest, NextResponse } from 'next/server';
import { initCloudinary, cloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/db';
import Settings from '@/models/Settings';
import { getUserFromRequest } from '@/lib/auth';

// Types
import type { UploadLogoSuccessResponse, UploadLogoErrorResponse } from '@/types/api';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'image/webp']);

export async function POST(request: NextRequest) {
	try {
		const user = getUserFromRequest(request);
		if (!user) {
			return NextResponse.json({ success: false, message: 'Unauthorized' } satisfies UploadLogoErrorResponse, { status: 401 });
		}

		// Expect multipart/form-data
		const contentType = request.headers.get('content-type') || '';
		if (!contentType.includes('multipart/form-data')) {
			return NextResponse.json({ success: false, message: 'Content-Type must be multipart/form-data' } satisfies UploadLogoErrorResponse, { status: 400 });
		}

		const formData = await request.formData();
		const file = formData.get('logo') as File | null;
		const userIdFromBody = formData.get('userId') as string | null;

		if (!file) {
			return NextResponse.json({ success: false, message: 'No file uploaded' } satisfies UploadLogoErrorResponse, { status: 400 });
		}

		if (!ALLOWED_TYPES.has(file.type)) {
			return NextResponse.json({ success: false, message: 'Invalid file type. Allowed: PNG, JPG, JPEG, WEBP' } satisfies UploadLogoErrorResponse, { status: 400 });
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			return NextResponse.json({ success: false, message: 'File too large. Max 5MB' } satisfies UploadLogoErrorResponse, { status: 400 });
		}

		// Security: ensure provided userId (if any) matches token
		if (userIdFromBody && userIdFromBody !== user.userId) {
			return NextResponse.json({ success: false, message: 'User mismatch' } satisfies UploadLogoErrorResponse, { status: 403 });
		}

		await connectDB();
		initCloudinary();

		// Convert web File to Buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload using Cloudinary upload_stream to avoid temp files
		const uploadResult: { secure_url: string } = await new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{
					folder: 'invoice-logos',
					resource_type: 'image',
					use_filename: true,
					unique_filename: true,
					overwrite: false,
					transformation: [
						{ width: 800, height: 800, crop: 'limit', fetch_format: 'auto', quality: 'auto' },
					],
				},
				(err, result) => {
					if (err || !result) return reject(err || new Error('Upload failed'));
					return resolve({ secure_url: (result as any).secure_url });
				}
			);
			uploadStream.end(buffer);
		});

		const logoUrl = uploadResult.secure_url;

		// Save to settings
		const updated = await Settings.findOneAndUpdate(
			{ userId: user.userId },
			{ $set: { logoUrl }, $setOnInsert: { userId: user.userId } },
			{ new: true, upsert: true }
		);

		return NextResponse.json({ success: true, logoUrl } satisfies UploadLogoSuccessResponse);
	} catch (error: any) {
		console.error('Upload logo error:', error);
		const message = error?.message || 'Failed to upload logo';
		return NextResponse.json({ success: false, message } satisfies UploadLogoErrorResponse, { status: 500 });
	}
}