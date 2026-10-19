import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import carbonRoutes from './routes/carbonRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Health check
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'online',
//     platform: 'Innotech E-Waste Recycling API',
//     timestamp: new Date().toISOString()
//   });
// });
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'Innotech E-Waste Recycling API',
    endpoints: {
      health: '/api/health',
      baseApi: '/api/v1'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/carbon', carbonRoutes);
app.use('/api/v1/ai', aiRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
