import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['individual', 'bulk_institution', 'admin'],
      default: 'individual'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otpCode: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    // Individual user profile
    individualProfile: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      defaultAddress: { type: addressSchema, default: () => ({}) },
      upiId: { type: String, default: '' }
    },
    // Bulk seller profile (Colleges, IT tech companies, enterprises)
    bulkProfile: {
      organizationName: { type: String, default: '' },
      orgType: {
        type: String,
        enum: ['college', 'tech_company', 'school', 'hospital', 'other'],
        default: 'tech_company'
      },
      gstNumber: { type: String, default: '' },
      authorizedPerson: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      facilityAddress: { type: addressSchema, default: () => ({}) }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
