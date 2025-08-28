import mongoose, { Document, Schema } from 'mongoose';

export interface ISale extends Document {
  productId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit' | 'card';
  isPaid: boolean;
  paidAmount: number;
  remainingAmount: number;
  saleDate: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: function(this: ISale) {
      return this.paymentMethod === 'credit';
    },
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  sellPrice: {
    type: Number,
    required: [true, 'Sell price is required'],
    min: [0, 'Sell price cannot be negative'],
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative'],
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'card'],
    required: [true, 'Payment method is required'],
    default: 'cash',
  },
  isPaid: {
    type: Boolean,
    default: function(this: ISale) {
      return this.paymentMethod !== 'credit';
    },
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
  saleDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Sale date is required'],
  },
  paidDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
  },
}, {
  timestamps: true,
});

SaleSchema.index({ productId: 1 });
SaleSchema.index({ customerId: 1 });
SaleSchema.index({ saleDate: -1 });
SaleSchema.index({ isPaid: 1 });
SaleSchema.index({ paymentMethod: 1 });

// Pre-validate middleware to calculate amounts before validation
SaleSchema.pre('validate', function(this: ISale, next) {
  this.totalAmount = this.quantity * this.sellPrice;
  
  if (this.paymentMethod === 'credit') {
    this.remainingAmount = this.totalAmount - this.paidAmount;
    this.isPaid = this.remainingAmount <= 0;
  } else {
    this.paidAmount = this.totalAmount;
    this.remainingAmount = 0;
    this.isPaid = true;
  }
  
  console.log('Sale pre-validate calculation completed:', {
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    remainingAmount: this.remainingAmount,
    isPaid: this.isPaid
  });
  
  next();
});

// Pre-save middleware to calculate amounts
SaleSchema.pre('save', function(this: ISale, next) {
  this.totalAmount = this.quantity * this.sellPrice;
  
  if (this.paymentMethod === 'credit') {
    this.remainingAmount = this.totalAmount - this.paidAmount;
    this.isPaid = this.remainingAmount <= 0;
  } else {
    this.paidAmount = this.totalAmount;
    this.remainingAmount = 0;
    this.isPaid = true;
  }
  
  console.log('Sale pre-save calculation completed:', {
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    remainingAmount: this.remainingAmount,
    isPaid: this.isPaid
  });
  
  next();
});

console.log('SaleSchema defined');

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
