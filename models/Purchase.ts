import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  productId: mongoose.Types.ObjectId;
  supplier?: string;
  quantity: number;
  buyPrice: number;
  totalAmount: number;
  purchaseDate: Date;
  invoiceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
  },
  buyPrice: {
    type: Number,
    required: [true, 'Buy price is required'],
    min: [0, 'Buy price cannot be negative'],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    default: function () {
      return this.quantity * this.buyPrice;
    }
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Purchase date is required'],
  },
  invoiceNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
  },
}, {
  timestamps: true,
});

PurchaseSchema.index({ productId: 1 });
PurchaseSchema.index({ purchaseDate: -1 });
PurchaseSchema.index({ supplier: 1 });

// Pre-save middleware to calculate total amount
PurchaseSchema.pre('save', function (this: IPurchase, next) {
  // Only calculate if totalAmount is not already set or is 0
  if (!this.totalAmount || this.totalAmount === 0) {
    this.totalAmount = this.quantity * this.buyPrice;
  }
  console.log('Purchase pre-save calculation:', {
    quantity: this.quantity,
    buyPrice: this.buyPrice,
    totalAmount: this.totalAmount,
    calculated: !this.totalAmount || this.totalAmount === 0
  });
  next();
});

console.log('PurchaseSchema defined');

export default mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);