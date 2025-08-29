import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
	userId: mongoose.Types.ObjectId;
	companyName?: string;
	rc?: string;
	ice?: string;
	if?: string; // Identifiant Fiscal
	tpNumber?: string; // TP N°
	address?: string;
	phone?: string;
	email?: string;
	rib?: string;
	website?: string;
	logoUrl?: string;
	paymentTerms?: string; // Conditions de paiement par défaut
	paymentDelayDays?: number; // Délai de paiement par défaut (jours)
	defaultTaxRate?: number; // TVA par défaut
	createdAt: Date;
	updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'User ID is required'],
		unique: true,
	},
	companyName: {
		type: String,
		trim: true,
		maxlength: [120, 'Company name too long'],
	},
	rc: {
		type: String,
		trim: true,
	},
	ice: {
		type: String,
		trim: true,
		validate: {
			validator: function(this: ISettings, value: string) {
				if (!value) return true;
				return /^\d{15}$/.test(value);
			},
			message: 'ICE must be 15 digits'
		}
	},
	if: {
		type: String,
		trim: true,
	},
	tpNumber: {
		type: String,
		trim: true,
	},
	address: {
		type: String,
		trim: true,
		maxlength: [200, 'Address too long'],
	},
	phone: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		trim: true,
		lowercase: true,
	},
	rib: {
		type: String,
		trim: true,
	},
	website: {
		type: String,
		trim: true,
	},
	logoUrl: {
		type: String,
		trim: true,
	},
	paymentTerms: {
		type: String,
		trim: true,
		maxlength: [500, 'Payment terms too long'],
		default: 'Paiement à 30 jours fin de mois',
	},
	paymentDelayDays: {
		type: Number,
		min: [0, 'Delay cannot be negative'],
		default: 30,
	},
	defaultTaxRate: {
		type: Number,
		min: [0, 'Tax rate cannot be negative'],
		max: [100, 'Tax rate cannot exceed 100%'],
		default: 20,
	},
}, {
	timestamps: true,
});

SettingsSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);