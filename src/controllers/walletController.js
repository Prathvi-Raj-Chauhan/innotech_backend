import { Wallet } from '../models/Wallet.js';

export const getWalletSummary = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        totalAmountSold: 0,
        claimableBalance: 0,
        totalPaidOut: 0,
        payoutHistory: []
      });
    }

    return res.status(200).json({
      success: true,
      wallet: {
        totalAmountSold: wallet.totalAmountSold,
        claimableBalance: wallet.claimableBalance,
        totalPaidOut: wallet.totalPaidOut,
        payoutHistory: wallet.payoutHistory.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wallet details.',
      error: error.message
    });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const { amount, paymentMethod = 'UPI', upiId, accountNumber, ifscCode, beneficiaryName } = req.body;

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    const payoutAmount = amount ? Number(amount) : wallet.claimableBalance;

    if (payoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No funds available to payout. Sell e-waste items to increase your balance.'
      });
    }

    if (payoutAmount > wallet.claimableBalance) {
      return res.status(400).json({
        success: false,
        message: `Requested amount (₹${payoutAmount}) exceeds your claimable balance (₹${wallet.claimableBalance}).`
      });
    }

    const transactionId = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const referenceUtr = `UTR-INNO-${Math.floor(10000000 + Math.random() * 90000000)}`;

    wallet.claimableBalance -= payoutAmount;
    wallet.totalPaidOut += payoutAmount;

    const payoutRecord = {
      transactionId,
      amount: payoutAmount,
      paymentMethod,
      payoutDetails: {
        upiId: upiId || req.user.individualProfile?.upiId || 'recycler@upi',
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || '',
        beneficiaryName: beneficiaryName || req.user.individualProfile?.fullName || 'E-Waste Recycler'
      },
      status: 'completed', // Direct instant simulated bank transfer / payout
      referenceUtr,
      requestedAt: new Date(),
      completedAt: new Date()
    };

    wallet.payoutHistory.push(payoutRecord);
    await wallet.save();

    return res.status(200).json({
      success: true,
      message: `Payout of ₹${payoutAmount} processed successfully to ${paymentMethod === 'UPI' ? (upiId || 'UPI') : 'bank account'}.`,
      transaction: payoutRecord,
      updatedBalance: {
        totalAmountSold: wallet.totalAmountSold,
        claimableBalance: wallet.claimableBalance,
        totalPaidOut: wallet.totalPaidOut
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to process payout.',
      error: error.message
    });
  }
};
