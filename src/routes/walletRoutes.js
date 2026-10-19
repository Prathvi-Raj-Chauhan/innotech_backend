import express from 'express';
import { getWalletSummary, requestPayout } from '../controllers/walletController.js';
import { authenticateJwt } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateJwt);

router.get('/summary', getWalletSummary);
router.post('/request-payout', requestPayout);

export default router;
