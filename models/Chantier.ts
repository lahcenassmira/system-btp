import mongoose, { Document, Schema } from 'mongoose';

export interface IChantier extends Document {
  userId: mongoose.Types.ObjectId;
  chantierNumber: string;
  devisId?: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  chantierName: string;
  location: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  estimatedBudget: number;
  actualCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChantierSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  chantierNumber: {
    type: String,
    required: [true, 'Chantier number is required'],
    unique: true,
    trim: true,
  },
  devisId: {
    type: Schema.Types.ObjectId,
    ref: 'Devis',
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
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  estimatedBudget: {
    type: Number,
    required: [true, 'Estimated budget is required'],
    min: [0, 'Estimated budget cannot be negative'],
  },
  actualCost: {
    type: Number,
    default: 0,
    min: [0, 'Actual cost cannot be negative'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
ChantierSchema.index({ userId: 1 });
ChantierSchema.index({ chantierNumber: 1 });
ChantierSchema.index({ clientId: 1 });
ChantierSchema.index({ status: 1 });
ChantierSchema.index({ createdAt: -1 });
ChantierSchema.index({ userId: 1, status: 1 });

// Generate chantier number
ChantierSchema.pre('save', async function (this: IChantier, next) {
  if (!this.chantierNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const count = await mongoose.model('Chantier').countDocuments({
      userId: this.userId
    }) + 1;
    
    this.chantierNumber = `CHT-${year}${month}-${String(count).padStart(4, '0')}`;
  }
  next();
});

console.log('ChantierSchema defined');

export default mongoose.models.Chantier || mongoose.model<IChantier>('Chantier', ChantierSchema);
