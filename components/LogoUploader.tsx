'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/lib/toast';
import type { UploadLogoResponse } from '@/types/api';

interface LogoUploaderProps {
	userId: string;
	initialLogoUrl?: string;
	onUploaded?: (logoUrl: string) => void;
}

export default function LogoUploader({ userId, initialLogoUrl, onUploaded }: LogoUploaderProps) {

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialLogoUrl);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		setPreviewUrl(initialLogoUrl);
	}, [initialLogoUrl]);

	const handleFileChange = () => {
		const file = fileInputRef.current?.files?.[0];
		if (!file) return;
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
	};

	const handleUpload = async () => {
		const file = fileInputRef.current?.files?.[0];
		if (!file) {
			showError('Please choose an image file');
			return;
		}

		const allowed = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
		if (!allowed.includes(file.type)) {
			showError('Invalid file type. Allowed: PNG, JPG, JPEG, WEBP');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			showError('File too large. Max 5MB');
			return;
		}

		try {
			setUploading(true);
			const formData = new FormData();
			formData.append('userId', userId);
			formData.append('logo', file);

			const res = await fetch('/api/upload-logo', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
				},
				body: formData,
			});
			const data = (await res.json()) as UploadLogoResponse;
			if (!res.ok || (data as any).success === false) {
				const message = (data as any).message || 'Upload failed';
				showError(message);
				return;
			}

			const success = data as { success: true; logoUrl: string };
			setPreviewUrl(success.logoUrl);
			onUploaded?.(success.logoUrl);
			showSuccess('Logo uploaded successfully!');
		} catch (e: any) {
			showError(e?.message || 'Upload failed');
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<Input ref={fileInputRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleFileChange} />
				<Button onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Logo'}</Button>
			</div>
			{previewUrl ? (
				<div className="border rounded p-2 w-[200px] h-[100px] flex items-center justify-center bg-muted/20">
					<img src={previewUrl} alt="Logo preview" className="max-h-[80px] object-contain" />
				</div>
			) : (
				<div className="border rounded p-2 w-[200px] h-[100px] flex items-center justify-center text-muted-foreground bg-muted/10">
					<span>LOGO</span>
				</div>
			)}
		</div>
	);
}