import mongoose from 'mongoose';

const catalogItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['smartphones', 'laptops', 'desktops', 'monitors', 'tablets', 'circuit_boards', 'peripherals', 'appliances', 'batteries']
    },
    description: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    iconName: {
      type: String,
      default: 'phone_android'
    },
    basePriceMin: {
      type: Number,
      required: true
    },
    basePriceMax: {
      type: Number,
      required: true
    },
    estimatedPayoutTime: {
      type: String,
      default: 'Within 2 hours of pickup'
    },
    co2SavingsGrams: {
      type: Number,
      default: 2200 // default 2,200g = 2.2kg CO2
    },
    materialsRecoverable: [
      {
        name: String, // e.g., 'Copper', 'Gold', 'Palladium', 'Rare Earth'
        percentageOrGrams: String
      }
    ],
    // Surge / Limited-Time Bounty Campaign
    bonusCampaign: {
      isActive: { type: Boolean, default: false },
      title: { type: String, default: 'Flash Recycling Bounty' },
      bonusPercentage: { type: Number, default: 20 }, // e.g. +20% extra payout
      totalSlots: { type: Number, default: 50 },
      remainingSlots: { type: Number, default: 18 },
      expiresAt: { type: Date, default: null }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);
