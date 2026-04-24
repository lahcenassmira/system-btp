import mongoose, { Document, Schema } from 'mongoose';

export interface IDevisItem {
  description: string;
  unit: string; // m², m³, kg, etc.
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IDevis extends Document {
  userId: mongoose.Types.ObjectId;
  devisNumber: string;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  chantierName: string;
  location: string;
  items: IDevisItem[];
  totalHT: number;
  tva: number;
  tvaRate: number; // percentage (default 20%)
  totalTTC: number;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  chantierId?: mongoose.Types.ObjectId;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DevisItemSchema = new Schema({
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters'],
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
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative'],
  },
});

const DevisSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  devisNumber: {
    type: String,
    required: [true, 'Devis number is required'],
    unique: true,
    trim: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Client ID is required'],
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
  },
  clientCompany: {
    type: String,
    trim: true,
  },
  clientPhone: {
    type: String,
    trim: true,
  },
  clientEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  clientAddress: {
    type: String,
    trim: true,
  },
  chantierName: {
    type: String,
    required: [true, 'Chantier name is required'],
    trim: true,
    maxlength: [200, 'Chantier name cannot exceed 200 characters'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters'],
  },
  items: {
    type: [DevisItemSchema],
    validate: {
      validator: function(items: IDevisItem[]) {
        return items && items.length > 0;
      },
      message: 'At least one item is required',
    },
  },
  totalHT: {
    type: Number,
    required: [true, 'Total HT is required'],
    min: [0, 'Total HT cannot be negative'],
  },
  tva: {
    type: Number,
    required: [true, 'TVA is required'],
    min: [0, 'TVA cannot be negative'],
  },
  tvaRate: {
    type: Number,
    default: 20,
    min: [0, 'TVA rate cannot be negative'],
    max: [100, 'TVA rate cannot exceed 100%'],
  },
  totalTTC: {
    type: Number,
    required: [true, 'Total TTC is required'],
    min: [0, 'Total TTC cannot be negative'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'rejected'],
    default: 'draft',
  },
  chantierId: {
    type: Schema.Types.ObjectId,
    ref: 'Chantier',
  },
  validUntil: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
DevisSchema.index({ userId: 1 });
DevisSchema.index({ devisNumber: 1 });
DevisSchema.index({ clientId: 1 });
DevisSchema.index({ status: 1 });
DevisSchema.index({ createdAt: -1 });
DevisSchema.index({ userId: 1, status: 1 });

// Pre-save middleware to calculate totals
DevisSchema.pre('save', function (this: IDevis, next) {
  // Calculate item totals
  this.items = this.items.map(item => {
    item.total = item.quantity * item.unitPrice;
    return item;
  });

  // Calculate total HT
  this.totalHT = this.items.reduce((sum, item) => sum + item.total, 0);

  // Calculate TVA
  this.tva = (this.totalHT * this.tvaRate) / 100;

  // Calculate total TTC
  this.totalTTC = this.totalHT + this.tva;

  next();
});

// Generate devis number
DevisSchema.pre('save', async function (this: IDevis, next) {
  if (!this.devisNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const count = await mongoose.model('Devis').countDocuments({
      userId: this.userId
    }) + 1;
    
    this.devisNumber = `DEV-${year}${month}-${String(count).padStart(4, '0')}`;
  }
  next();
});

console.log('DevisSchema defined');

export default mongoose.models.Devis || mongoose.model<IDevis>('Devis', DevisSchema);
