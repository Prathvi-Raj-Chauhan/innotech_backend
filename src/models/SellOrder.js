import mongoose from 'mongoose';

const sellOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roleType: {
      type: String,
      enum: ['individual', 'bulk_institution'],
      default: 'individual'
    },
    catalogItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogItem',
      default: null
    },
    itemTitle: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    deviceImage: {
      type: String,
      default: ''
    },
    // AI Recognition Output Metadata
    aiDetectionMeta: {
      detectedClass: { type: String, default: 'Electronics' },
      confidence: { type: Number, default: 0.92 },
      modelSuggested: { type: String, default: '' },
      estimatedConditionScore: { type: String, default: 'Good' },
      detectedComponents: [{ type: String }]
    },
    // User added/edited details
    userReportedCondition: {
      type: String,
      enum: ['working', 'minor_scratches', 'screen_cracked', 'dead_scrap', 'bulk_mixed'],
      default: 'working'
    },
    brandAndModel: {
      type: String,
      default: ''
    },
    accessoriesIncluded: [{
      type: String // e.g. ['Charger', 'Original Box', 'Cable']
    }],
    quantity: {
      type: Number,
      default: 1
    },
    // Financials
    agreedEstimatedPrice: {
      type: Number,
      required: true
    },
    bonusAmountApplied: {
      type: Number,
      default: 0
    },
    totalFinalPrice: {
      type: Number,
      required: true
    },
    estimatedPayoutTime: {
      type: String,
      default: 'Within 2 hours of pickup'
    },
    // Carbon emission savings
    carbonPointsAwarded: {
      type: Number,
      default: 0 // 1 point = 1g carbon emission reduced
    },
    // Logistics & Pickup
    pickupAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      contactPhone: { type: String, required: true }
    },
    pickupSlot: {
      date: { type: String, default: '' },
      timeWindow: { type: String, default: '10:00 AM - 01:00 PM' }
    },
    // Order Status Lifecycle
    status: {
      type: String,
      enum: ['submitted', 'pickup_scheduled', 'inspected_verified', 'completed_paid', 'cancelled'],
      default: 'submitted'
    },
    trackingHistory: [
      {
        status: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const SellOrder = mongoose.model('SellOrder', sellOrderSchema);
