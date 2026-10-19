import { SellOrder } from '../models/SellOrder.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { Wallet } from '../models/Wallet.js';
import { CarbonLedger } from '../models/CarbonLedger.js';

export const createSellOrder = async (req, res) => {
  try {
    const {
      catalogItemId,
      itemTitle,
      category,
      deviceImage,
      aiDetectionMeta,
      userReportedCondition,
      brandAndModel,
      accessoriesIncluded,
      quantity = 1,
      agreedEstimatedPrice,
      pickupAddress,
      pickupSlot
    } = req.body;

    if (!itemTitle || !agreedEstimatedPrice || !pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order details (itemTitle, agreedEstimatedPrice, or pickupAddress).'
      });
    }

    // Check if catalog item has active bonus campaign
    let bonusAmountApplied = 0;
    let co2Grams = 25000; // default 25kg CO2
    let estimatedPayoutTime = 'Within 2 hours of pickup';

    if (catalogItemId) {
      const catalogItem = await CatalogItem.findById(catalogItemId);
      if (catalogItem) {
        if (catalogItem.estimatedPayoutTime) {
          estimatedPayoutTime = catalogItem.estimatedPayoutTime;
        }
        if (catalogItem.co2SavingsGrams) {
          co2Grams = catalogItem.co2SavingsGrams;
        }
        if (catalogItem.bonusCampaign?.isActive && catalogItem.bonusCampaign.remainingSlots > 0) {
          const bonusPct = catalogItem.bonusCampaign.bonusPercentage || 20;
          bonusAmountApplied = Math.round((agreedEstimatedPrice * bonusPct) / 100);
          // Decrement bonus slot
          catalogItem.bonusCampaign.remainingSlots = Math.max(0, catalogItem.bonusCampaign.remainingSlots - 1);
          await catalogItem.save();
        }
      }
    }

    const totalFinalPrice = (Number(agreedEstimatedPrice) + bonusAmountApplied) * quantity;
    const carbonPointsAwarded = co2Grams * quantity; // 1 point = 1g carbon emission reduced

    const orderNumber = `INNO-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = new SellOrder({
      orderNumber,
      userId: req.user._id,
      roleType: req.user.role,
      catalogItemId: catalogItemId || null,
      itemTitle,
      category: category || 'smartphones',
      deviceImage: deviceImage || '',
      aiDetectionMeta: aiDetectionMeta || {
        detectedClass: category || 'Electronics',
        confidence: 0.94,
        estimatedConditionScore: userReportedCondition || 'Good'
      },
      userReportedCondition: userReportedCondition || 'working',
      brandAndModel: brandAndModel || '',
      accessoriesIncluded: accessoriesIncluded || [],
      quantity,
      agreedEstimatedPrice: Number(agreedEstimatedPrice),
      bonusAmountApplied,
      totalFinalPrice,
      estimatedPayoutTime,
      carbonPointsAwarded,
      pickupAddress: {
        street: pickupAddress.street || 'Address Street',
        city: pickupAddress.city || 'City',
        state: pickupAddress.state || 'State',
        pincode: pickupAddress.pincode || '000000',
        contactPhone: pickupAddress.contactPhone || req.user.individualProfile?.phone || '9999999999'
      },
      pickupSlot: pickupSlot || {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeWindow: '10:00 AM - 01:00 PM'
      },
      status: 'submitted',
      trackingHistory: [
        {
          status: 'submitted',
          title: 'Added to Waitlist',
          description: 'Your e-waste recycling request was submitted. Dispatch team is scheduling pickup.'
        }
      ]
    });

    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Recycling order created successfully and added to waitlist.',
      order: newOrder
    });
  } catch (error) {
    console.error('[createSellOrder error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create sell order.',
      error: error.message
    });
  }
};

export const getMySellings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const orders = await SellOrder.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your selling orders.',
      error: error.message
    });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const order = await SellOrder.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
      error: error.message
    });
  }
};

/**
 * Update order status (Admin / Verification Simulation)
 * Transitions: submitted -> pickup_scheduled -> inspected_verified -> completed_paid
 * When completed_paid is reached, money is credited to user's wallet and carbon points are credited!
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await SellOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousStatus = order.status;
    order.status = status;

    const statusDescriptions = {
      pickup_scheduled: 'Collection courier assigned. Pickup vehicle is on its way.',
      inspected_verified: 'Device arrived at recycling hub. AI hardware verification completed.',
      completed_paid: `Recycling complete! ₹${order.totalFinalPrice} credited to your Innotech wallet.`,
      cancelled: note || 'Order was cancelled.'
    };

    order.trackingHistory.push({
      status,
      title: status.replace('_', ' ').toUpperCase(),
      description: statusDescriptions[status] || note || ''
    });

    await order.save();

    // If order was just marked completed_paid, credit Wallet and Carbon Ledger!
    if (status === 'completed_paid' && previousStatus !== 'completed_paid') {
      // 1. Credit Wallet
      let wallet = await Wallet.findOne({ userId: order.userId });
      if (!wallet) {
        wallet = new Wallet({ userId: order.userId, totalAmountSold: 0, claimableBalance: 0 });
      }
      wallet.totalAmountSold += order.totalFinalPrice;
      wallet.claimableBalance += order.totalFinalPrice;
      await wallet.save();

      // 2. Credit CarbonLedger (1 point = 1g carbon emission reduced)
      let carbon = await CarbonLedger.findOne({ userId: order.userId });
      if (!carbon) {
        carbon = new CarbonLedger({ userId: order.userId, totalCarbonPoints: 0, totalKgDiverted: 0 });
      }
      carbon.totalCarbonPoints += order.carbonPointsAwarded;
      carbon.totalKgDiverted = parseFloat((carbon.totalCarbonPoints / 1000).toFixed(2));

      // Calculate Tier Badge
      if (carbon.totalCarbonPoints >= 200000) {
        carbon.ecoTierBadge = 'Carbon Neutralizer';
      } else if (carbon.totalCarbonPoints >= 100000) {
        carbon.ecoTierBadge = 'Planet Champion';
      } else if (carbon.totalCarbonPoints >= 30000) {
        carbon.ecoTierBadge = 'Eco Guardian';
      }

      carbon.history.push({
        orderId: order._id,
        gramsCo2Saved: order.carbonPointsAwarded,
        pointsEarned: order.carbonPointsAwarded,
        deviceDescription: `${order.itemTitle} (${order.userReportedCondition})`
      });

      await carbon.save();
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message
    });
  }
};
