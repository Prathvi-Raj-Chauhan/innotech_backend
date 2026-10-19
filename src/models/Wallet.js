import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'BANK_TRANSFER'],
      default: 'UPI'
    },
    payoutDetails: {
      upiId: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      beneficiaryName: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    referenceUtr: {
      type: String,
      default: ''
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true
    },
    totalAmountSold: {
      type: Number,
      default: 0 // Cumulative lifetime sales value
    },
    claimableBalance: {
      type: Number,
      default: 0 // Current balance available to payout now
    },
    totalPaidOut: {
      type: Number,
      default: 0 // Amount already withdrawn/paid out
    },
    payoutHistory: [payoutRequestSchema]
  },
  { timestamps: true }
);

export const Wallet = mongoose.model('Wallet', walletSchema);
