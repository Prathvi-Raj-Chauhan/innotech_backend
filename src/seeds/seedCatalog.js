import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CatalogItem } from '../models/CatalogItem.js';

dotenv.config();

const sampleCatalog = [
  {
    title: 'Smartphones (Android / iPhone)',
    category: 'smartphones',
    description: 'Working, cracked, or completely dead smartphones. We recover gold, silver, copper, and cobalt while safely neutralizing lithium batteries.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    iconName: 'phone_android',
    basePriceMin: 800,
    basePriceMax: 4500,
    estimatedPayoutTime: 'Instant within 2 hours of pickup',
    co2SavingsGrams: 28000, // 28kg CO2
    materialsRecoverable: [
      { name: 'Gold (Au)', percentageOrGrams: '0.034g' },
      { name: 'Silver (Ag)', percentageOrGrams: '0.35g' },
      { name: 'Copper (Cu)', percentageOrGrams: '15g' },
      { name: 'Cobalt / Lithium', percentageOrGrams: '38g' }
    ],
    bonusCampaign: {
      isActive: true,
      title: 'Limited Flash Surge Bounty',
      bonusPercentage: 20, // +20% extra payout
      totalSlots: 50,
      remainingSlots: 19,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    }
  },
  {
    title: 'Laptops & MacBooks',
    category: 'laptops',
    description: 'Old notebooks, ultrabooks, MacBooks, and work laptops. High recovery value for multi-layer PCBs and aluminum frames.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
    iconName: 'laptop_mac',
    basePriceMin: 2000,
    basePriceMax: 12000,
    estimatedPayoutTime: 'Instant within 2 hours of pickup',
    co2SavingsGrams: 85000, // 85kg CO2
    materialsRecoverable: [
      { name: 'Gold (Au)', percentageOrGrams: '0.12g' },
      { name: 'Aluminum (Al)', percentageOrGrams: '650g' },
      { name: 'Copper (Cu)', percentageOrGrams: '120g' },
      { name: 'Tantalum & Rare Earth', percentageOrGrams: '12g' }
    ],
    bonusCampaign: {
      isActive: true,
      title: 'College & Enterprise Laptop Drive',
      bonusPercentage: 25, // +25% extra payout
      totalSlots: 100,
      remainingSlots: 41,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
    }
  },
  {
    title: 'Computer Motherboards & Server PCBs',
    category: 'circuit_boards',
    description: 'Green, blue, and gold circuit boards from CPUs, servers, gaming rigs, and network switches. Maximum precious metal recovery.',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    iconName: 'developer_board',
    basePriceMin: 600,
    basePriceMax: 3500,
    estimatedPayoutTime: 'Within 24 hours of hub assay',
    co2SavingsGrams: 45000,
    materialsRecoverable: [
      { name: 'Gold Plated Pins', percentageOrGrams: '0.25g' },
      { name: 'High-Purity Copper', percentageOrGrams: '250g' },
      { name: 'Palladium', percentageOrGrams: '0.02g' }
    ],
    bonusCampaign: {
      isActive: false,
      title: 'PCB Ingot Drive',
      bonusPercentage: 15,
      totalSlots: 50,
      remainingSlots: 50
    }
  },
  {
    title: 'Monitors & LCD Displays',
    category: 'monitors',
    description: 'Flat panel LED/LCD monitors, CRT displays, and all-in-one screens. Safe removal of CCFL mercury tubes and plastic recycling.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    iconName: 'desktop_windows',
    basePriceMin: 500,
    basePriceMax: 2200,
    estimatedPayoutTime: 'Within 24 hours of pickup',
    co2SavingsGrams: 35000,
    materialsRecoverable: [
      { name: 'Recycled Polymer Plastics', percentageOrGrams: '1.2kg' },
      { name: 'Internal Copper Wire', percentageOrGrams: '85g' },
      { name: 'Controller IC Chips', percentageOrGrams: '45g' }
    ],
    bonusCampaign: {
      isActive: true,
      title: 'Screen Clean-Up Bonus',
      bonusPercentage: 15,
      totalSlots: 50,
      remainingSlots: 27,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  },
  {
    title: 'Desktop Towers & CPUs',
    category: 'desktops',
    description: 'Full tower enclosures, power supplies (SMPS), heatsinks, and graphics cards.',
    imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    iconName: 'computer',
    basePriceMin: 1500,
    basePriceMax: 6000,
    estimatedPayoutTime: 'Within 2 hours of pickup',
    co2SavingsGrams: 95000,
    materialsRecoverable: [
      { name: 'Structural Steel', percentageOrGrams: '3.5kg' },
      { name: 'Heat Pipe Copper', percentageOrGrams: '350g' },
      { name: 'Extruded Aluminum', percentageOrGrams: '500g' }
    ],
    bonusCampaign: {
      isActive: false,
      title: 'Desktop Lot Bounty',
      bonusPercentage: 10,
      totalSlots: 50,
      remainingSlots: 50
    }
  },
  {
    title: 'Lithium Battery Packs & Power Banks',
    category: 'batteries',
    description: 'Old power banks, laptop battery packs, and tool batteries. Certified zero-landfill hydrometallurgical recycling.',
    imageUrl: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80',
    iconName: 'battery_charging_full',
    basePriceMin: 300,
    basePriceMax: 1500,
    estimatedPayoutTime: 'Instant on verification',
    co2SavingsGrams: 20000,
    materialsRecoverable: [
      { name: 'Cobalt Metal', percentageOrGrams: '80g' },
      { name: 'Lithium Carbonate', percentageOrGrams: '25g' },
      { name: 'Nickel', percentageOrGrams: '110g' }
    ],
    bonusCampaign: {
      isActive: true,
      title: 'Safe Battery Bounty',
      bonusPercentage: 30,
      totalSlots: 100,
      remainingSlots: 34,
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000)
    }
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/innotech_ewaste';
    await mongoose.connect(mongoUri);
    console.log('[Seed]: Connected to MongoDB');

    await CatalogItem.deleteMany({});
    console.log('[Seed]: Cleared existing catalog items');

    const created = await CatalogItem.insertMany(sampleCatalog);
    console.log(`[Seed]: Successfully populated ${created.length} recyclable e-waste items!`);

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();
