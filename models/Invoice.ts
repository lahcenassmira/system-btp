import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  nameFr?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number; // percentage discount for this item
  discountAmount?: number; // calculated discount amount
  warrantyDuration?: number; // in months
}

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceType: 'personal' | 'company'; // New field for invoice type
  customerId?: mongoose.Types.ObjectId;
  
  // Personal invoice fields
  customerName: string;
  customerNameFr?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerAddressFr?: string;
  
  // Company invoice fields
  companyName?: string;
  companyNameFr?: string;
  customerICE?: string;
  customerRC?: string;
  customerVAT?: string; // VAT number for companies
  companyAddress?: string;
  companyAddressFr?: string;
  companyPhone?: string;
  companyEmail?: string;
  
  items: IInvoiceItem[];
  subtotal: number;
  discount?: number; // global discount percentage
  discountAmount?: number; // calculated global discount amount
  taxRate: number; // percentage
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit' | 'card' | 'partial' | 'cheque' | 'bank_transfer';
  isPaid: boolean;
  paidAmount: number;
  remainingAmount: number;
  invoiceDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  shopName?: string;
  shopNameFr?: string;
  shopLogo?: string;
  shopAddress?: string;
  shopAddressFr?: string;
  shopPhone?: string;
  shopICE?: string;
  shopRC?: string;
  shopIF?: string; // Identifiant Fiscal
  shopCNSS?: string;
  shopRIB?: string;
  shopWebsite?: string;
  paymentTerms?: string;
  paymentDelayDays?: number;
  lastReminderAt?: Date;
  reminderCount?: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  nameFr: {
    type: String,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0,
  },
  discountAmount: {
    type: Number,
    min: [0, 'Discount amount cannot be negative'],
    default: 0,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
  warrantyDuration: {
    type: Number,
    min: [0, 'Warranty duration cannot be negative'],
    default: 0,
  },
});

const InvoiceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
  },
  invoiceType: {
    type: String,
    enum: ['personal', 'company'],
    required: [true, 'Invoice type is required'],
    default: 'personal',
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  
  // Personal invoice fields
  customerName: {
    type: String,
    required: function(this: IInvoice) {
      return this.invoiceType === 'personal';
    },
    trim: true,
  },
  customerNameFr: {
    type: String,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  customerAddress: {
    type: String,
    trim: true,
  },
  customerAddressFr: {
    type: String,
    trim: true,
  },
  
  // Company invoice fields
  companyName: {
    type: String,
    required: function(this: IInvoice) {
      return this.invoiceType === 'company';
    },
    trim: true,
  },
  companyNameFr: {
    type: String,
    trim: true,
  },
  customerICE: {
    type: String,
    trim: true,
    validate: {
      validator: function(this: IInvoice, value: string) {
        if (this.invoiceType === 'company' && value) {
          return /^\d{15}$/.test(value);
        }
        return true;
      },
      message: 'ICE must be 15 digits for company invoices'
    },
    required: function(this: IInvoice) {
      return this.invoiceType === 'company';
    },
  },
  customerRC: {
    type: String,
    trim: true,
    required: function(this: IInvoice) {
      return this.invoiceType === 'company';
    },
  },
  customerVAT: {
    type: String,
    trim: true,
  },
  companyAddress: {
    type: String,
    trim: true,
    required: function(this: IInvoice) {
      return this.invoiceType === 'company';
    },
  },
  companyAddressFr: {
    type: String,
    trim: true,
  },
  companyPhone: {
    type: String,
    trim: true,
  },
  companyEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0,
  },
  discountAmount: {
    type: Number,
    min: [0, 'Discount amount cannot be negative'],
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 20, // 20% TVA for Morocco
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
  },
  taxAmount: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax amount cannot be negative'],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'card', 'partial', 'cheque', 'bank_transfer'],
    required: [true, 'Payment method is required'],
    default: 'cash',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Remaining amount cannot be negative'],
  },
  invoiceDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Invoice date is required'],
  },
  dueDate: {
    type: Date,
  },
  paidDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  shopName: {
    type: String,
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters'],
  },
  shopNameFr: {
    type: String,
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters'],
  },
  shopLogo: {
    type: String,
    trim: true,
  },
  shopAddress: {
    type: String,
    trim: true,
    maxlength: [200, 'Shop address cannot exceed 200 characters'],
  },
  shopAddressFr: {
    type: String,
    trim: true,
    maxlength: [200, 'Shop address cannot exceed 200 characters'],
  },
  shopPhone: {
    type: String,
    trim: true,
  },
  shopICE: {
    type: String,
    trim: true,
    match: [/^\d{15}$/, 'ICE must be 15 digits'],
  },
  shopRC: {
    type: String,
    trim: true,
  },
  shopIF: {
    type: String,
    trim: true,
  },
  shopCNSS: {
    type: String,
    trim: true,
  },
  shopRIB: {
    type: String,
    trim: true,
  },
  shopWebsite: {
    type: String,
    trim: true,
  },
  paymentTerms: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment terms cannot exceed 500 characters'],
  },
  paymentDelayDays: {
    type: Number,
    min: [0, 'Payment delay cannot be negative'],
  },
  lastReminderAt: {
    type: Date,
  },
  reminderCount: {
    type: Number,
    default: 0,
    min: [0, 'Reminder count cannot be negative'],
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
}, {
  timestamps: true,
});

// Indexes
InvoiceSchema.index({ userId: 1 });
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ invoiceDate: -1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ isPaid: 1 });
InvoiceSchema.index({ invoiceType: 1 });
InvoiceSchema.index({ userId: 1, invoiceType: 1 });

// Pre-save middleware to calculate amounts
InvoiceSchema.pre('save', function (this: IInvoice, next) {
  // Calculate items totals and discounts
  this.items = this.items.map(item => {
    // Calculate total before discount
    const total = item.quantity * item.unitPrice;

    // Calculate item discount
    if (item.discount && item.discount > 0) {
      item.discountAmount = (total * item.discount) / 100;
      item.totalPrice = total - item.discountAmount;
    } else {
      item.discountAmount = 0;
      item.totalPrice = total;
    }

    return item;
  });

  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate global discount if any
  if (this.discount && this.discount > 0) {
    this.discountAmount = (this.subtotal * this.discount) / 100;
    this.subtotal = this.subtotal - this.discountAmount;
  } else {
    this.discountAmount = 0;
  }

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;

  // Calculate total amount
  this.totalAmount = this.subtotal + this.taxAmount;

  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - this.paidAmount;

  // Update paid status
  this.isPaid = this.remainingAmount <= 0;

  // Update status based on payment
  if (this.isPaid && this.status === 'draft') {
    this.status = 'paid';
  }

  next();
});

// Generate invoice number
InvoiceSchema.pre('save', async function (this: IInvoice, next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Different prefixes for different invoice types
    const prefix = this.invoiceType === 'company' ? 'COMP' : 'PERS';
    
    // Count invoices of the same type for the user
    const count = await mongoose.model('Invoice').countDocuments({
      userId: this.userId,
      invoiceType: this.invoiceType
    }) + 1;
    
    this.invoiceNumber = `${prefix}-${year}${month}-${String(count).padStart(4, '0')}`;
  }
  next();
});

console.log('InvoiceSchema defined');

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
