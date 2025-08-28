import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  phone?: string;
  hashedPassword: string;
  preferredLanguage: 'fr' | 'ar';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
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

// Create sparse unique indexes manually to handle null values properly
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

console.log('UserSchema defined');

// Clear the model cache to ensure indexes are recreated
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', UserSchema);