import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'owner' | 'cashier' | 'accountant' | 'manager';

export type Permission = 
  | 'sales_create'
  | 'sales_view'
  | 'sales_edit'
  | 'sales_delete'
  | 'purchases_create'
  | 'purchases_view'
  | 'purchases_edit'
  | 'purchases_delete'
  | 'invoices_create'
  | 'invoices_view'
  | 'invoices_edit'
  | 'invoices_delete'
  | 'invoices_generate'
  | 'customers_create'
  | 'customers_view'
  | 'customers_edit'
  | 'customers_delete'
  | 'products_create'
  | 'products_view'
  | 'products_edit'
  | 'products_delete'
  | 'inventory_view'
  | 'inventory_adjust'
  | 'reports_view'
  | 'reports_export'
  | 'analytics_view'
  | 'returns_create'
  | 'returns_view'
  | 'returns_edit'
  | 'returns_delete'
  | 'settings_view'
  | 'settings_edit';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  hashedPassword: string;
  preferredLanguage: 'fr' | 'ar';
  role: UserRole;
  permissions: Permission[];
  shopId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    default: null,
  },
  phone: {
    type: String,
    trim: true,
    match: [/^(\+212|0)[5-7][0-9]{8}$/, 'Please enter a valid Moroccan phone number'],
    default: null,
  },
  hashedPassword: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  preferredLanguage: {
    type: String,
    enum: ['fr', 'ar'],
    default: 'fr',
  },
  role: {
    type: String,
    enum: ['owner', 'cashier', 'accountant', 'manager'],
    required: [true, 'Role is required'],
    default: 'owner',
  },
  permissions: {
    type: [String],
    enum: [
      'sales_create', 'sales_view', 'sales_edit', 'sales_delete',
      'purchases_create', 'purchases_view', 'purchases_edit', 'purchases_delete',
      'invoices_create', 'invoices_view', 'invoices_edit', 'invoices_delete', 'invoices_generate',
      'customers_create', 'customers_view', 'customers_edit', 'customers_delete',
      'products_create', 'products_view', 'products_edit', 'products_delete',
      'inventory_view', 'inventory_adjust',
      'reports_view', 'reports_export', 'analytics_view',
      'returns_create', 'returns_view', 'returns_edit', 'returns_delete',
      'settings_view', 'settings_edit'
    ],
    default: [],
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    default: null,
  },
}, {
  timestamps: true,
});

// Ensure at least one of email or phone is provided
UserSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone number is required'));
  } else {
    next();
  }
});

// Create indexes to handle null values properly
// Use sparse index for email (works fine with null values)
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
// Use partial index for phone to properly exclude null values
UserSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $ne: null } } });

console.log('UserSchema defined');

// Clear the model cache to ensure indexes are recreated
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', UserSchema);
