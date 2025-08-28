import { v2 as cloudinary } from 'cloudinary';

const requiredEnv = [
	'CLOUDINARY_CLOUD_NAME',
	'CLOUDINARY_API_KEY',
	'CLOUDINARY_API_SECRET',
] as const;

type RequiredEnv = typeof requiredEnv[number];

function ensureEnv() {
	for (const key of requiredEnv) {
		if (!process.env[key]) {
			throw new Error(`Missing required environment variable: ${key}`);
		}
	}
}

let initialized = false;

export function initCloudinary(): void {
	if (initialized) return;
	ensureEnv();
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
		api_key: process.env.CLOUDINARY_API_KEY as string,
		api_secret: process.env.CLOUDINARY_API_SECRET as string,
		secure: true,
	});
	initialized = true;
}

export { cloudinary };