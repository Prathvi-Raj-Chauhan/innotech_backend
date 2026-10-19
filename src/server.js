import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(` 🚀 Innotech E-Waste Backend running on port ${PORT}`);
    console.log(` 📡 Base URL: http://localhost:${PORT}/api/v1`);
    console.log(` 🩺 Health:   http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
};

startServer();
