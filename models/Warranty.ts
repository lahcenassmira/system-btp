import mongoose, { Document, Schema } from 'mongoose';

export interface IWarranty extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  saleId?: mongoose.Types.ObjectId;
  productName: string;
  productSku?: string;
  productBrand?: string;
  customerName: string;
  customerPhone?: string;
  purchaseDate: Date;
  warrantyDuration: number; // in months
  warrantyStartDate: Date;
  warrantyEndDate: Date;
  status: 'active' | 'expired' | 'claimed' | 'void';
  claimDate?: Date;
  claimReason?: string;
  claimNotes?: string;
  serialNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WarrantySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
  },
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  saleId: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  productSku: {
    type: String,
    trim: true,
  },
  productBrand: {
    type: String,
    trim: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
  },
  warrantyDuration: {
    type: Number,
    required: [true, 'Warranty duration is required'],
    min: [0, 'Warranty duration cannot be negative'],
  },
  warrantyStartDate: {
    type: Date,
    required: [true, 'Warranty start date is required'],
  },
  warrantyEndDate: {
    type: Date,
    required: [true, 'Warranty end date is required'],
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'claimed', 'void'],
    default: 'active',
  },
  claimDate: {
    type: Date,
  },
  claimReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Claim reason cannot exceed 200 characters'],
  },
  claimNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Claim notes cannot exceed 500 characters'],
  },
  serialNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Serial number cannot exceed 100 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
WarrantySchema.index({ userId: 1 });
WarrantySchema.index({ productId: 1 });
WarrantySchema.index({ customerId: 1 });
WarrantySchema.index({ warrantyEndDate: 1 });
WarrantySchema.index({ status: 1 });
WarrantySchema.index({ purchaseDate: -1 });

// Pre-save middleware to calculate warranty end date
WarrantySchema.pre('save', function(this: IWarranty, next) {
  if (this.warrantyStartDate && this.warrantyDuration) {
    const endDate = new Date(this.warrantyStartDate);
    endDate.setMonth(endDate.getMonth() + this.warrantyDuration);
    this.warrantyEndDate = endDate;
  }
  
  // Auto-update status based on dates
  const now = new Date();
  if (this.warrantyEndDate && now > this.warrantyEndDate && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Static method to find expiring warranties
WarrantySchema.statics.findExpiringWarranties = function(userId: string, daysAhead: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'active',
    warrantyEndDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).sort({ warrantyEndDate: 1 });
};

console.log('WarrantySchema defined');

export default mongoose.models.Warranty || mongoose.model<IWarranty>('Warranty', WarrantySchema);
