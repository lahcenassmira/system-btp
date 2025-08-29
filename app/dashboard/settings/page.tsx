'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/lib/toast';
import { useLanguage } from '@/hooks/use-language';
import { authenticatedFetch, getAuthTokenFromCookie } from '@/lib/client-auth';
import LogoUploader from '@/components/LogoUploader';

interface SettingsForm {
	companyName: string;
	rc: string;
	ice: string;
	if: string;
	tpNumber: string;
	address: string;
	phone: string;
	email: string;
	rib: string;
	website: string;
	logoUrl: string;
	paymentTerms: string;
	paymentDelayDays: number;
	defaultTaxRate: number;
}

export default function SettingsPage() {
	const { t } = useLanguage();

	const [loading, setLoading] = useState(false);
	const [userId, setUserId] = useState('');
	const [form, setForm] = useState<SettingsForm>({
		companyName: '',
		rc: '',
		ice: '',
		if: '',
		tpNumber: '',
		address: '',
		phone: '',
		email: '',
		rib: '',
		website: '',
		logoUrl: '',
		paymentTerms: '',
		paymentDelayDays: 30,
		defaultTaxRate: 20,
	});

	useEffect(() => {
		(async () => {
			try {
				const res = await authenticatedFetch('/api/settings');
				if (res.ok) {
					const data = await res.json();
					if (data.settings) {
						setForm((prev) => ({ ...prev, ...data.settings }));
					}
				}
				
				// Get user ID from auth token for LogoUploader
				const token = getAuthTokenFromCookie();
				if (token) {
					try {
						const payload = JSON.parse(atob(token.split('.')[1]));
						setUserId(payload.userId || payload.id || '');
					} catch (e) {
						console.error('Error parsing token for user ID:', e);
					}
				}
			} catch (e) {
				console.error('Fetch settings error', e);
			}
		})();
	}, []);

	const handleChange = (field: keyof SettingsForm, value: string | number) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSave = async () => {
		try {
			setLoading(true);
			const res = await authenticatedFetch('/api/settings', {
				method: 'PUT',
				body: JSON.stringify(form),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Failed to save settings');
			}
			showSuccess('Paramètres enregistrés');
		} catch (e: any) {
			console.error('Save settings error', e);
			showError(e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
				<p className="text-muted-foreground">Configurer les informations légales et bancaires de votre entreprise</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Informations légales</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label>Nom de l'entreprise</Label>
								<Input value={form.companyName} onChange={(e) => handleChange('companyName', e.target.value)} />
							</div>
							<div>
								<Label>RC</Label>
								<Input value={form.rc} onChange={(e) => handleChange('rc', e.target.value)} />
							</div>
							<div>
								<Label>ICE</Label>
								<Input value={form.ice} onChange={(e) => handleChange('ice', e.target.value)} />
							</div>
							<div>
								<Label>IF</Label>
								<Input value={form.if} onChange={(e) => handleChange('if', e.target.value)} />
							</div>
							<div>
								<Label>TP N°</Label>
								<Input value={form.tpNumber} onChange={(e) => handleChange('tpNumber', e.target.value)} />
							</div>
							<div className="md:col-span-2">
								<Label>Adresse</Label>
								<Textarea rows={2} value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Contact & Banque</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label>Téléphone</Label>
								<Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
							</div>
							<div>
								<Label>Email</Label>
								<Input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
							</div>
							<div>
								<Label>RIB</Label>
								<Input value={form.rib} onChange={(e) => handleChange('rib', e.target.value)} />
							</div>
							<div>
								<Label>Site Web</Label>
								<Input value={form.website} onChange={(e) => handleChange('website', e.target.value)} />
							</div>
							<div className="md:col-span-2 space-y-2">
								<Label>Logo</Label>
								<LogoUploader
									userId={userId}
									initialLogoUrl={form.logoUrl || undefined}
									onUploaded={(url) => setForm((prev) => ({ ...prev, logoUrl: url }))}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Conditions de paiement par défaut</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<Label>Délai de paiement (jours)</Label>
								<Input type="number" min={0} value={form.paymentDelayDays} onChange={(e) => handleChange('paymentDelayDays', Number(e.target.value))} />
							</div>
							<div>
								<Label>TVA par défaut (%)</Label>
								<Input type="number" min={0} max={100} step={0.01} value={form.defaultTaxRate} onChange={(e) => handleChange('defaultTaxRate', Number(e.target.value))} />
							</div>
						</div>
						<div>
							<Label>Conditions</Label>
							<Textarea rows={3} value={form.paymentTerms} onChange={(e) => handleChange('paymentTerms', e.target.value)} placeholder="Ex: Paiement à 30 jours, pénalités de retard 5%..." />
						</div>
						<div className="flex justify-end">
							<Button onClick={handleSave} disabled={loading}>{loading ? 'Enregistrement...' : t('common.save')}</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}