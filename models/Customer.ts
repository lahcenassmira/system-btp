import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  company?: string;
  ice?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  totalDebt: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters'],
  },
  company: {
    type: String,
    trim: true,
    maxlength: [120, 'Company name cannot exceed 120 characters'],
  },
  ice: {
    type: String,
    trim: true,
    match: [/^\d{15}$/, 'ICE must be 15 digits'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^(\+212|0)[5-7][0-9]{8}$/, 'Please enter a valid Moroccan phone number'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  totalDebt: {
    type: Number,
    default: 0,
    min: [0, 'Total debt cannot be negative'],
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, 'Total purchases cannot be negative'],
  },
  lastPurchaseDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

CustomerSchema.index({ name: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ totalDebt: -1 });
CustomerSchema.index({ totalPurchases: -1 });

console.log('CustomerSchema defined');

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);