import mongoose from 'mongoose';

const carbonTransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellOrder',
      default: null
    },
    gramsCo2Saved: {
      type: Number,
      required: true
    },
    pointsEarned: {
      type: Number,
      required: true // 1 point = 1g carbon emission reduced
    },
    deviceDescription: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const carbonLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true
    },
    totalCarbonPoints: {
      type: Number,
      default: 0 // 1 point = 1g carbon emission reduced
    },
    totalKgDiverted: {
      type: Number,
      default: 0 // totalCarbonPoints / 1000
    },
    ecoTierBadge: {
      type: String,
      enum: ['Green Novice', 'Eco Guardian', 'Planet Champion', 'Carbon Neutralizer'],
      default: 'Green Novice'
    },
    history: [carbonTransactionSchema]
  },
  { timestamps: true }
);

export const CarbonLedger = mongoose.model('CarbonLedger', carbonLedgerSchema);
