import { CarbonLedger } from '../models/CarbonLedger.js';

export const getCarbonSummary = async (req, res) => {
  try {
    let carbon = await CarbonLedger.findOne({ userId: req.user._id });
    if (!carbon) {
      carbon = await CarbonLedger.create({
        userId: req.user._id,
        totalCarbonPoints: 0,
        totalKgDiverted: 0,
        ecoTierBadge: 'Green Novice',
        history: []
      });
    }

    // Impact conversions
    const totalGrams = carbon.totalCarbonPoints; // 1 point = 1g carbon emission reduced
    const kgDiverted = parseFloat((totalGrams / 1000).toFixed(2));
    const treesEquivalent = parseFloat((kgDiverted / 21).toFixed(2)); // ~21kg CO2 absorbed per tree per year
    const carKmsAvoided = parseFloat((kgDiverted / 0.192).toFixed(1)); // ~192g CO2 per km for avg petrol car

    return res.status(200).json({
      success: true,
      carbon: {
        totalCarbonPoints: carbon.totalCarbonPoints,
        totalKgDiverted: kgDiverted,
        ecoTierBadge: carbon.ecoTierBadge,
        equivalentMetrics: {
          treesEquivalent,
          carKmsAvoided
        },
        creditTradingPreview: {
          availableCredits: parseFloat((totalGrams / 1000000).toFixed(4)), // 1 metric ton = 1,000,000 grams
          estimatedCreditValueUsd: parseFloat(((totalGrams / 1000000) * 15).toFixed(2)), // ~$15 per ton voluntary market
          status: 'Phase 2 Trading System Opening Soon'
        },
        history: carbon.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve carbon points details.',
      error: error.message
    });
  }
};
