import mongoose, { Document, Schema } from 'mongoose';

export interface IShop extends Document {
  name: string;
  address: string;
  category: string;
  phone: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  address: {
    type: String,
    required: [true, 'Shop address is required'],
    trim: true,
    minlength: 5,
    maxlength: 200,
  },
  category: {
    type: String,
    required: [true, 'Shop category is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  phone: {
    type: String,
    required: [true, 'Shop phone is required'],
    trim: true,
    match: [/^(\+212|0)[5-7][0-9]{8}$/, 'Please enter a valid Moroccan phone number'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required'],
  },
}, {
  timestamps: true,
});

// Ensure shop name is unique per owner (optional constraint)
ShopSchema.index({ name: 1, ownerId: 1 }, { unique: true });

console.log('ShopSchema defined');

// Clear the model cache to ensure indexes are recreated
if (mongoose.models.Shop) {
  delete mongoose.models.Shop;
}

export default mongoose.model<IShop>('Shop', ShopSchema);
