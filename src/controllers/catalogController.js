import { CatalogItem } from '../models/CatalogItem.js';

export const getCatalog = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const items = await CatalogItem.find(filter).sort({ 'bonusCampaign.isActive': -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recyclable items catalog.',
      error: error.message
    });
  }
};

export const getCatalogItemById = async (req, res) => {
  try {
    const item = await CatalogItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Recyclable item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch item details.',
      error: error.message
    });
  }
};
