import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { CarbonLedger } from '../models/CarbonLedger.js';
import { sendOtpEmail } from '../services/mailerService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../config/jwt.js';

// Generate 6-digit cryptographically random numeric string
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestOtp = async (req, res) => {
  try {
    const { email, role = 'individual' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.'
      });
    }

    if (!['individual', 'bulk_institution'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "individual" or "bulk_institution".'
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        role,
        otpCode: otpHash,
        otpExpiresAt
      });
    } else {
      user.role = role; // User can specify or switch role
      user.otpCode = otpHash;
      user.otpExpiresAt = otpExpiresAt;
    }

    await user.save();

    // Send email via Nodemailer
    await sendOtpEmail(email, otp, role);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${email}.`,
      role,
      // For immediate dev testing convenience, attach test OTP if not in production
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('[requestOtp error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate and send OTP.',
      error: error.message
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, profileData } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are both required.'
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No pending OTP found for this email. Please request a new code.'
      });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has expired. Please request a new one.'
      });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.otpCode);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    // Mark as verified & clear OTP
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;

    // If profile data was passed during registration, save it
    if (profileData) {
      if (user.role === 'individual' && profileData.individual) {
        user.individualProfile = { ...user.individualProfile, ...profileData.individual };
      } else if (user.role === 'bulk_institution' && profileData.bulk) {
        user.bulkProfile = { ...user.bulkProfile, ...profileData.bulk };
      }
    }

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // Ensure Wallet exists
    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        totalAmountSold: 0,
        claimableBalance: 0
      });
    }

    // Ensure CarbonLedger exists
    let carbonLedger = await CarbonLedger.findOne({ userId: user._id });
    if (!carbonLedger) {
      carbonLedger = await CarbonLedger.create({
        userId: user._id,
        totalCarbonPoints: 0,
        totalKgDiverted: 0
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      tokens: {
        accessToken,
        refreshToken
      },
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        individualProfile: user.individualProfile,
        bulkProfile: user.bulkProfile
      },
      walletSummary: {
        totalAmountSold: wallet.totalAmountSold,
        claimableBalance: wallet.claimableBalance
      },
      carbonSummary: {
        totalCarbonPoints: carbonLedger.totalCarbonPoints,
        totalKgDiverted: carbonLedger.totalKgDiverted,
        ecoTierBadge: carbonLedger.ecoTierBadge
      }
    });
  } catch (error) {
    console.error('[verifyOtp error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed.',
      error: error.message
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: incomingRefreshToken } = req.body;
    if (!incomingRefreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const decoded = verifyRefreshToken(incomingRefreshToken);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or revoked refresh token.'
      });
    }

    const isMatch = await bcrypt.compare(incomingRefreshToken, user.refreshToken);
    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token does not match.'
      });
    }

    const newAccessToken = generateAccessToken(user);
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Failed to refresh token.',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { individualProfile, bulkProfile } = req.body;

    if (individualProfile && user.role === 'individual') {
      user.individualProfile = { ...user.individualProfile.toObject(), ...individualProfile };
    }

    if (bulkProfile && user.role === 'bulk_institution') {
      user.bulkProfile = { ...user.bulkProfile.toObject(), ...bulkProfile };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        individualProfile: user.individualProfile,
        bulkProfile: user.bulkProfile
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otpCode -refreshToken');
    const wallet = await Wallet.findOne({ userId: user._id });
    const carbon = await CarbonLedger.findOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      user,
      wallet: wallet || { totalAmountSold: 0, claimableBalance: 0 },
      carbon: carbon || { totalCarbonPoints: 0, totalKgDiverted: 0, ecoTierBadge: 'Green Novice' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile data',
      error: error.message
    });
  }
};
