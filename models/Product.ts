import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  unit: 'kg' | 'piece' | 'liter' | 'meter' | 'box';
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  minStockAlert: number;
  category?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  unit: {
    type: String,
    enum: ['kg', 'piece', 'liter', 'meter', 'box'],
    required: [true, 'Unit is required'],
    default: 'piece',
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
  },
  buyPrice: {
    type: Number,
    required: [true, 'Buy price is required'],
    min: [0, 'Buy price cannot be negative'],
  },
  sellPrice: {
    type: Number,
    required: [true, 'Sell price is required'],
    min: [0, 'Sell price cannot be negative'],
  },
  minStockAlert: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stock alert cannot be negative'],
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
});

ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ quantity: 1 });



export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);