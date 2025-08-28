import mongoose, { Document, Schema } from 'mongoose';

export interface IReturn extends Document {
  saleId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  returnedQuantity: number;
  originalQuantity: number;
  originalSellPrice: number;
  refundAmount: number;
  returnReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  returnDate: Date;
  processedDate?: Date;
  processedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema: Schema = new Schema({
  saleId: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: [true, 'Sale ID is required'],
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
  returnedQuantity: {
    type: Number,
    required: [true, 'Returned quantity is required'],
    min: [0.01, 'Returned quantity must be greater than 0'],
  },
  originalQuantity: {
    type: Number,
    required: [true, 'Original quantity is required'],
    min: [0.01, 'Original quantity must be greater than 0'],
  },
  originalSellPrice: {
    type: Number,
    required: [true, 'Original sell price is required'],
    min: [0, 'Original sell price cannot be negative'],
  },
  refundAmount: {
    type: Number,
    required: [true, 'Refund amount is required'],
    min: [0, 'Refund amount cannot be negative'],
    default: function (this: IReturn) {
      return this.returnedQuantity * this.originalSellPrice;
    }
  },
  returnReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Return reason cannot exceed 200 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: [true, 'Status is required'],
    default: 'pending',
  },
  returnDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Return date is required'],
  },
  processedDate: {
    type: Date,
  },
  processedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Processed by cannot exceed 100 characters'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
ReturnSchema.index({ saleId: 1 });
ReturnSchema.index({ productId: 1 });
ReturnSchema.index({ customerId: 1 });
ReturnSchema.index({ returnDate: -1 });
ReturnSchema.index({ status: 1 });
ReturnSchema.index({ returnDate: -1, status: 1 });

// Pre-save middleware to calculate refund amount
ReturnSchema.pre('save', function (this: IReturn, next) {
  if (!this.refundAmount || this.refundAmount === 0) {
    this.refundAmount = this.returnedQuantity * this.originalSellPrice;
  }

  // Set processed date when status changes to approved or rejected
  if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
    this.processedDate = new Date();
  }



  next();
});

// Validation to ensure returned quantity doesn't exceed original quantity
ReturnSchema.pre('validate', function (this: IReturn, next) {
  if (this.returnedQuantity > this.originalQuantity) {
    next(new Error('Returned quantity cannot exceed original quantity'));
  } else {
    next();
  }
});



export default mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema);
