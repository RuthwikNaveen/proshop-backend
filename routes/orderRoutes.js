import express from 'express';
const router = express.Router();
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  createRazorpayOrder, 
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderToReturned,
  deleteOrder,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/razorpay').get(protect, createRazorpayOrder);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/return').put(protect, updateOrderToReturned);
router.route('/:id').get(protect, getOrderById).delete(protect, admin, deleteOrder);

export default router;