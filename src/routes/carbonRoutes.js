import express from 'express';
import { getCarbonSummary } from '../controllers/carbonController.js';
import { authenticateJwt } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateJwt);

router.get('/summary', getCarbonSummary);

export default router;
