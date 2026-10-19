import express from 'express';
import {
  createSellOrder,
  getMySellings,
  getOrderDetail,
  updateOrderStatus
} from '../controllers/orderController.js';
import { authenticateJwt } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateJwt);

router.post('/sell-request', createSellOrder);
router.get('/my-sellings', getMySellings);
router.get('/:id', getOrderDetail);
router.patch('/:id/status', updateOrderStatus); // Used by logistics/hub verification simulation

export default router;
